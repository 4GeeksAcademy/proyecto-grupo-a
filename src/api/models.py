from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, ForeignKey, Integer, DateTime, Text
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'user'

    id: Mapped[int] = mapped_column(primary_key=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    signup_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    profile_pic: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(50), default='user')
    last_session: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[bool] = mapped_column(Boolean, default=True)
    google_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=True)
    google_refresh_token: Mapped[str] = mapped_column(
        String(255), nullable=True)
    google_access_token: Mapped[str] = mapped_column(
        String(255), nullable=True)
    
    

    # Relaciones
    events = relationship("Event", back_populates="user",
                          cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user",
                         cascade="all, delete-orphan")
    task_groups = relationship("TaskGroup", back_populates="user",
                         cascade="all, delete-orphan")
 
    calendars = relationship(
        "Calendar", back_populates="user", cascade="all, delete-orphan")


    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    # Helpers de seguridad
    def set_password(self, raw_password: str):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password, raw_password)

    def serialize(self):
        return {
            "id": self.id,
            "display_name": self.display_name,
            "name": self.name,
            "email": self.email,
            "signup_date": self.signup_date.isoformat() if self.signup_date else None,
            "profile_pic": self.profile_pic,
            "rol": self.rol,
            "last_session": self.last_session.isoformat() if self.last_session else None,
            "status": self.status,
        }


class Event(db.Model):
    __tablename__ = 'event'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('user.id'), nullable=False)
    calendar_id: Mapped[int] = mapped_column(   # 🔹 Enlaza con Calendar
        Integer, ForeignKey('calendar.id'), nullable=False
    )
    
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    
    google_event_id: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="confirmed")

    # Relaciones
    user = relationship("User", back_populates="events")

    calendar = relationship("Calendar", back_populates="events")


    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "calendar_id": self.calendar_id,
            "title": self.title,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "description": self.description,
            "color": self.color,
            "google_event_id": self.google_event_id,
            "status": self.status
        }


class Task(db.Model):
    __tablename__ = 'task'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('user.id'), nullable=False)
    task_group_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('task_group.id'), nullable=False
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[bool] = mapped_column(Boolean, default=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    recurrencia: Mapped[int] = mapped_column(Integer, default=0)
    color: Mapped[str] = mapped_column(String(50))

    # Relaciones
    user = relationship("User", back_populates="tasks")
    task_groups = relationship("TaskGroup", back_populates="tasks",
                         cascade="all")


    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "task_group_id": self.task_group_id,
            "title": self.title,
            "status": self.status,
            "date": self.date.isoformat() if self.date else None,
            "recurrencia": self.recurrencia,
            "color": self.color
        }


class TaskGroup(db.Model):
    __tablename__ = 'task_group'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('user.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    color: Mapped[str] = mapped_column(String(50))

    user = relationship("User", back_populates="task_groups")
    tasks = relationship("Task", back_populates="task_groups", cascade="all, delete-orphan")

    def serialize_with_tasks(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "color": self.color,
            "tasks": [task.serialize() for task in self.tasks]
        }


class Calendar(db.Model):
    __tablename__ = 'calendar'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('user.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    color: Mapped[str] = mapped_column(String(50))

    # Relaciones
    user = relationship("User", back_populates="calendars")
    events = relationship("Event", back_populates="calendar",
                          cascade="all, delete-orphan")


    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "color": self.color

        }

