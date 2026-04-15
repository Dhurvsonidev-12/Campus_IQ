from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid
import os
import qrcode
import shutil
import joblib
from datetime import datetime, timedelta

from database import engine, Base, SessionLocal
import models
from security import hash_password, verify_password, create_access_token
from auth import get_current_user

app = FastAPI(title="CampusIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("qr_codes", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

app.mount("/qr_codes", StaticFiles(directory="qr_codes"), name="qr_codes")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "ai", "attendance_model.pkl")

model = joblib.load(model_path)

@app.get("/")
def home():
    return {"message": "CampusIQ Backend Running"}

from pydantic import BaseModel
from typing import Optional, List

def create_volunteer_registration(user_id: int, event_id: int, db: Session):
    existing_reg = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == user_id
    ).first()
    if not existing_reg:
        qr_code_str = str(uuid.uuid4())
        new_reg = models.Registration(
            user_id=user_id,
            event_id=event_id,
            qr_code=qr_code_str
        )
        db.add(new_reg)
        
        qr_data = f"TICKET:{qr_code_str}"
        img = qrcode.make(qr_data)
        filepath = os.path.join("qr_codes", f"{qr_code_str}.png")
        img.save(filepath)

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class WhitelistRequest(BaseModel):
    email: str
    event_id: int

class BulkWhitelistRequest(BaseModel):
    emails: List[str]
    event_id: int

class ApplyVolunteerRequest(BaseModel):
    event_id: int

class UpdateVolunteerStatusRequest(BaseModel):
    status: str

# ─── AUTH ────────────────────────────────────────────────────────────────

@app.post("/register")
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(models.User.email == data.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(data.password)

    user = models.User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        role=data.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    approved_whitelists = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.email == user.email,
        models.VolunteerWhitelist.status == "approved"
    ).all()

    for aw in approved_whitelists:
        aw.user_id = user.id
        create_volunteer_registration(user.id, aw.event_id, db)
    db.commit()

    return {"message": "User registered successfully"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token_data = {
        "sub": user.email,
        "role": user.role,
        "id": user.id
    }

    token = create_access_token(token_data)
    return {"access_token": token, "token_type": "bearer"}

# ─── USER PROFILE ────────────────────────────────────────────────────────

@app.get("/user/profile")
def get_user_profile(db: Session = Depends(get_db), user_data=Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_data["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "profile_photo": user.profile_photo,
        "phone": user.phone,
        "address": user.address,
        "student_type": user.student_type,
        "institution_name": user.institution_name,
        "board": user.board,
        "grade": user.grade,
        "semester": user.semester,
        "course": user.course,
        "department": user.department,
        "section": user.section,
        "roll_number": user.roll_number,
        "org_name": user.org_name,
        "org_address": user.org_address
    }

@app.put("/user/profile")
def update_user_profile(
    name: str = Form(...),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    student_type: Optional[str] = Form(None),
    institution_name: Optional[str] = Form(None),
    board: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    semester: Optional[str] = Form(None),
    course: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    section: Optional[str] = Form(None),
    roll_number: Optional[str] = Form(None),
    org_name: Optional[str] = Form(None),
    org_address: Optional[str] = Form(None),
    profile_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_data["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    user.phone = phone
    user.address = address
    user.student_type = student_type
    user.institution_name = institution_name
    user.board = board
    user.grade = grade
    user.semester = semester
    user.course = course
    user.department = department
    user.section = section
    user.roll_number = roll_number
    user.org_name = org_name
    user.org_address = org_address

    if profile_photo:
        # Create profiles directory if it doesn't exist (handled in startup now, but safe to keep)
        os.makedirs(os.path.join("uploads", "profiles"), exist_ok=True)
        
        file_extension = os.path.splitext(profile_photo.filename)[1]
        filename = f"profile_{user.id}{file_extension}"
        filepath = os.path.join("uploads", "profiles", filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(profile_photo.file, buffer)
            
        user.profile_photo = f"profiles/{filename}"

    db.commit()
    db.refresh(user)
    
    return {"message": "Profile updated successfully"}

# ─── EVENTS ──────────────────────────────────────────────────────────────

@app.post("/create-event")
def create_event(
    title: str = Form(...),
    description: str = Form(...),
    venue: str = Form(...),
    fee: float = Form(...),
    participant_limit: int = Form(...),
    max_volunteers: Optional[int] = Form(None),
    event_date: str = Form(None),
    event_end_date: str = Form(None),
    poster: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can create events")

    poster_filename = None

    if poster:
        poster_filename = f"{uuid.uuid4()}_{poster.filename}"
        filepath = os.path.join("uploads", poster_filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(poster.file, buffer)

    parsed_event_date = None
    parsed_event_end_date = None

    if event_date:
        try:
            parsed_event_date = datetime.fromisoformat(event_date)
        except ValueError:
            pass

    if event_end_date:
        try:
            parsed_event_end_date = datetime.fromisoformat(event_end_date)
        except ValueError:
            pass

    event = models.Event(
        title=title,
        description=description,
        venue=venue,
        fee=fee,
        participant_limit=participant_limit,
        max_volunteers=max_volunteers,
        host_id=user["id"],
        poster=poster_filename,
        event_date=parsed_event_date,
        event_end_date=parsed_event_end_date
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {"message": "Event created successfully", "event_id": event.id}

@app.get("/event/{event_id}")
def get_single_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "venue": event.venue,
        "fee": event.fee,
        "participant_limit": event.participant_limit,
        "max_volunteers": event.max_volunteers,
        "poster": event.poster,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
        "host_id": event.host_id
    }

@app.get("/events")
def get_events(search: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Event)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Event.title.ilike(search_term),
                models.Event.description.ilike(search_term),
                models.Event.venue.ilike(search_term)
            )
        )

    return query.all()

@app.get("/host/events")
def get_host_events(db: Session = Depends(get_db), user=Depends(get_current_user)):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts allowed")

    return db.query(models.Event).filter(models.Event.host_id == user["id"]).all()

@app.delete("/delete-event/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.host_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    # delete all registrations of this event first
    db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).delete()

    # delete volunteer whitelist entries for this event
    db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.event_id == event_id
    ).delete()

    # now delete event
    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully"}

@app.put("/edit-event/{event_id}")
def edit_event(
    event_id: int,
    title: str = Form(...),
    description: str = Form(...),
    venue: str = Form(...),
    fee: float = Form(...),
    participant_limit: int = Form(...),
    max_volunteers: Optional[int] = Form(None),
    event_date: str = Form(None),
    event_end_date: str = Form(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.host_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    event.title = title
    event.description = description
    event.venue = venue
    event.fee = fee
    event.participant_limit = participant_limit
    event.max_volunteers = max_volunteers

    if event_date:
        try:
            event.event_date = datetime.fromisoformat(event_date)
        except ValueError:
            pass

    if event_end_date:
        try:
            event.event_end_date = datetime.fromisoformat(event_end_date)
        except ValueError:
            pass

    db.commit()

    return {"message": "Event updated"}

# ─── REGISTRATION & TICKETS ─────────────────────────────────────────────

@app.post("/register-event")
def register_event(event_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    total_registered = db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).count()

    if total_registered >= event.participant_limit:
        raise HTTPException(status_code=400, detail="Event is full")

    existing = db.query(models.Registration).filter(
        models.Registration.user_id == current_user["id"],
        models.Registration.event_id == event_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already registered")

    qr_token = str(uuid.uuid4())

    registration = models.Registration(
        user_id=current_user["id"],
        event_id=event_id,
        qr_code=qr_token
    )

    db.add(registration)
    db.commit()
    db.refresh(registration)

    qr_data = f"TICKET:{qr_token}"
    img = qrcode.make(qr_data)

    filename = f"{qr_token}.png"
    filepath = os.path.join("qr_codes", filename)

    img.save(filepath)

    return {
        "message": "Event registered successfully",
        "qr_token": qr_token,
        "qr_image": f"/qr_codes/{filename}"
    }

@app.get("/my-tickets")
def get_my_tickets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    registrations = db.query(models.Registration).filter(
        models.Registration.user_id == user["id"]
    ).all()

    tickets = []
    for reg in registrations:
        event = db.query(models.Event).filter(models.Event.id == reg.event_id).first()
        if event:
            tickets.append({
                "id": reg.id,
                "event_id": event.id,
                "event_title": event.title,
                "event_venue": event.venue,
                "event_fee": event.fee,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "event_end_date": event.event_end_date.isoformat() if event.event_end_date else None,
                "event_poster": event.poster,
                "qr_code": reg.qr_code,
                "qr_image": f"/qr_codes/{reg.qr_code}.png",
                "checked_in": reg.checked_in,
                "booked_at": reg.created_at.isoformat() if reg.created_at else None
            })

    return tickets

# ─── SCAN TICKET ─────────────────────────────────────────────────────────

@app.post("/scan-ticket")
def scan_ticket(qr_token: str, db: Session = Depends(get_db), user=Depends(get_current_user)):

    registration = db.query(models.Registration).filter(
        models.Registration.qr_code == qr_token
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Invalid ticket — no matching registration found")

    if registration.checked_in:
        raise HTTPException(status_code=400, detail="Ticket already used — attendee has already checked in")

    event = db.query(models.Event).filter(models.Event.id == registration.event_id).first()
    
    is_host = event.host_id == user["id"]
    is_volunteer = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.email == user["sub"],
        models.VolunteerWhitelist.event_id == registration.event_id,
        models.VolunteerWhitelist.status == "approved"
    ).first() is not None

    if not (is_host or is_volunteer):
        raise HTTPException(status_code=403, detail="You are not assigned to scan tickets for this event")

    registration.checked_in = True
    db.commit()

    # Get event info for response
    event = db.query(models.Event).filter(models.Event.id == registration.event_id).first()
    attendee = db.query(models.User).filter(models.User.id == registration.user_id).first()

    return {
        "message": "Check-in successful!",
        "attendee_name": attendee.name if attendee else "Unknown",
        "event_title": event.title if event else "Unknown Event"
    }

# ─── VOLUNTEER WHITELIST ─────────────────────────────────────────────────

@app.post("/student/apply-volunteer")
def apply_volunteer(data: ApplyVolunteerRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    
    event = db.query(models.Event).filter(models.Event.id == data.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.max_volunteers is not None:
        approved_count = db.query(models.VolunteerWhitelist).filter(
            models.VolunteerWhitelist.event_id == data.event_id,
            models.VolunteerWhitelist.status == "approved"
        ).count()
        if approved_count >= event.max_volunteers:
            raise HTTPException(status_code=400, detail="Volunteer positions are full for this event")


    existing = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.email == user["sub"],
        models.VolunteerWhitelist.event_id == data.event_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already applied or been approved for this event."
        )

    entry = models.VolunteerWhitelist(
        email=user["sub"],
        event_id=data.event_id,
        host_id=event.host_id,
        user_id=user["id"],
        status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Volunteer application submitted."}

@app.get("/student/volunteer-events")
def get_student_volunteer_events(db: Session = Depends(get_db), user=Depends(get_current_user)):
    entries = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.email == user["sub"]
    ).all()

    results = []
    for entry in entries:
        event = db.query(models.Event).filter(models.Event.id == entry.event_id).first()
        if event:
            results.append({
                "id": entry.id,
                "event_id": event.id,
                "event_title": event.title,
                "event_venue": event.venue,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "event_poster": event.poster,
                "status": entry.status,
                "applied_at": entry.created_at.isoformat() if entry.created_at else None
            })
    return results

@app.put("/host/volunteer-request/{whitelist_id}")
def update_volunteer_request(whitelist_id: int, data: UpdateVolunteerStatusRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts allowed")

    entry = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.id == whitelist_id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Volunteer request not found")

    if entry.host_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    if data.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    if data.status == "approved":
        event = db.query(models.Event).filter(models.Event.id == entry.event_id).first()
        if event.max_volunteers is not None:
            approved_count = db.query(models.VolunteerWhitelist).filter(
                models.VolunteerWhitelist.event_id == entry.event_id,
                models.VolunteerWhitelist.status == "approved"
            ).count()
            if approved_count >= event.max_volunteers:
                raise HTTPException(status_code=400, detail="Volunteer positions are full for this event")
                
        if entry.user_id:
            create_volunteer_registration(entry.user_id, entry.event_id, db)

    entry.status = data.status
    db.commit()

    return {"message": f"Volunteer request {data.status}"}

@app.post("/host/whitelist-volunteer")
def whitelist_volunteer(data: WhitelistRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can whitelist volunteers")

    # Verify event belongs to this host
    event = db.query(models.Event).filter(
        models.Event.id == data.event_id,
        models.Event.host_id == user["id"]
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not owned by you")

    # Check if email already whitelisted for ANY event (1 event per volunteer rule)
    existing = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.email == data.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"This email is already assigned to another event (Event ID: {existing.event_id})"
        )

    if event.max_volunteers is not None:
        approved_count = db.query(models.VolunteerWhitelist).filter(
            models.VolunteerWhitelist.event_id == data.event_id,
            models.VolunteerWhitelist.status == "approved"
        ).count()
        if approved_count >= event.max_volunteers:
            raise HTTPException(status_code=400, detail="Volunteer positions are full for this event")

    registered_user = db.query(models.User).filter(models.User.email == data.email).first()

    entry = models.VolunteerWhitelist(
        email=data.email,
        event_id=data.event_id,
        host_id=user["id"],
        user_id=registered_user.id if registered_user else None,
        status="approved"
    )

    db.add(entry)
    
    if registered_user:
        create_volunteer_registration(registered_user.id, data.event_id, db)

    db.commit()
    db.refresh(entry)

    return {"message": f"Volunteer {data.email} whitelisted for event: {event.title}", "id": entry.id}

@app.post("/host/bulk-whitelist-volunteers")
def bulk_whitelist_volunteers(data: BulkWhitelistRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can whitelist volunteers")

    event = db.query(models.Event).filter(
        models.Event.id == data.event_id,
        models.Event.host_id == user["id"]
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not owned by you")

    added = []
    skipped = []
    
    current_approved_count = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.event_id == data.event_id,
        models.VolunteerWhitelist.status == "approved"
    ).count()

    for email in data.emails:
        email = email.strip()
        if not email:
            continue
            
        if event.max_volunteers is not None and current_approved_count >= event.max_volunteers:
            skipped.append({"email": email, "reason": "Max volunteer limit reached"})
            continue

        # Check if already whitelisted for any event
        existing = db.query(models.VolunteerWhitelist).filter(
            models.VolunteerWhitelist.email == email
        ).first()

        if existing:
            skipped.append({"email": email, "reason": f"Already assigned to event ID {existing.event_id}"})
            continue

        registered_user = db.query(models.User).filter(models.User.email == email).first()

        entry = models.VolunteerWhitelist(
            email=email,
            event_id=data.event_id,
            host_id=user["id"],
            user_id=registered_user.id if registered_user else None,
            status="approved"
        )
        db.add(entry)
        current_approved_count += 1
        
        if registered_user:
            create_volunteer_registration(registered_user.id, data.event_id, db)
                
        added.append(email)

    db.commit()

    return {
        "message": f"{len(added)} volunteers added, {len(skipped)} skipped",
        "added": added,
        "skipped": skipped
    }

@app.get("/host/whitelisted-volunteers/{event_id}")
def get_whitelisted_volunteers(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts allowed")

    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.host_id == user["id"]
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not owned by you")

    entries = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.event_id == event_id
    ).all()

    result = []
    for entry in entries:
        # Check if volunteer has registered
        registered_user = db.query(models.User).filter(
            models.User.email == entry.email
        ).first()

        result.append({
            "id": entry.id,
            "email": entry.email,
            "user_id": entry.user_id,
            "status": entry.status,
            "registered": registered_user is not None,
            "volunteer_name": registered_user.name if registered_user else None,
            "created_at": entry.created_at.isoformat() if entry.created_at else None
        })

    return result

@app.delete("/host/remove-volunteer/{whitelist_id}")
def remove_volunteer(whitelist_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):

    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts allowed")

    entry = db.query(models.VolunteerWhitelist).filter(
        models.VolunteerWhitelist.id == whitelist_id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found")

    if entry.host_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(entry)
    db.commit()

    return {"message": "Volunteer removed from whitelist"}

# ─── ANALYTICS HELPER ────────────────────────────────────────────────────

@app.get("/event/{event_id}/stats")
def get_event_stats(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    total_registrations = db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).count()

    total_checkins = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.checked_in == True
    ).count()

    return {
        "event_id": event_id,
        "title": event.title,
        "total_registrations": total_registrations,
        "total_checkins": total_checkins,
        "participant_limit": event.participant_limit
    }