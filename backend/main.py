from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uuid
import os
import qrcode
import shutil
import joblib

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

model = joblib.load("ai/attendance_model.pkl")

@app.get("/")
def home():
    return {"message": "CampusIQ Backend Running"}

from pydantic import BaseModel

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

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

    return {"message": "User registered successfully"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "id": user.id
    })

    return {"access_token": token, "token_type": "bearer"}

@app.post("/create-event")
def create_event(
    title: str = Form(...),
    description: str = Form(...),
    venue: str = Form(...),
    fee: float = Form(...),
    participant_limit: int = Form(...),
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

    event = models.Event(
        title=title,
        description=description,
        venue=venue,
        fee=fee,
        participant_limit=participant_limit,
        host_id=user["id"],
        poster=poster_filename
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {"message": "Event created successfully", "event_id": event.id}

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all()

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

    # now delete event
    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully"}

@app.put("/edit-event/{event_id}")
def edit_event(
    event_id: int,
    title: str,
    description: str,
    venue: str,
    fee: float,
    participant_limit: int,
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

    db.commit()

    return {"message": "Event updated"}

@app.post("/register-event")
def register_event(user_id: int, event_id: int, db: Session = Depends(get_db)):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    total_registered = db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).count()

    if total_registered >= event.participant_limit:
        raise HTTPException(status_code=400, detail="Event is full")

    existing = db.query(models.Registration).filter(
        models.Registration.user_id == user_id,
        models.Registration.event_id == event_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already registered")

    qr_token = str(uuid.uuid4())

    registration = models.Registration(
        user_id=user_id,
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