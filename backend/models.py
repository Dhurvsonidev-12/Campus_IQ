from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="student")
    
    # Profile & Personal Details
    profile_photo = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Student specific
    student_type = Column(String, nullable=True) # school / college
    institution_name = Column(String, nullable=True)
    board = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    course = Column(String, nullable=True)
    department = Column(String, nullable=True)
    section = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    
    # Host specific
    org_name = Column(String, nullable=True)
    org_address = Column(String, nullable=True)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    venue = Column(String)
    fee = Column(Float, default=0)
    participant_limit = Column(Integer)
    max_volunteers = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    host_id = Column(Integer, ForeignKey("users.id"))
    poster = Column(String)
    event_date = Column(DateTime, nullable=True)
    event_end_date = Column(DateTime, nullable=True)


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))

    qr_code = Column(String)

    checked_in = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)


class VolunteerWhitelist(Base):
    __tablename__ = "volunteer_whitelist"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"))
    host_id = Column(Integer, ForeignKey("users.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="approved")
    created_at = Column(DateTime, default=datetime.utcnow)