from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(100))

    messages = relationship("Message", back_populates="owner")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(50), index=True)
    content = Column(Text)
    category = Column(String(50), default="unknown")
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="messages")
