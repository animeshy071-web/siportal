from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.base_class import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_no = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    department = Column(String)
    semester = Column(Integer)
    section = Column(String)
    batch = Column(String)
    dob = Column(String)
    gender = Column(String)
    address = Column(String)
    parent_name = Column(String)
    parent_phone = Column(String)
    avatar = Column(String)

    user = relationship("User", backref="student_profile")

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""

class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    department = Column(String)
    designation = Column(String)
    experience = Column(String)
    avatar = Column(String)
    
    user = relationship("User", backref="faculty_profile")

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""

class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    avatar = Column(String)

    user = relationship("User", backref="admin_profile")

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""
