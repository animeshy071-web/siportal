from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User, RoleEnum
from app.models.profiles import StudentProfile, FacultyProfile
from app.schemas.profiles import StudentCreate, FacultyCreate, StudentCreatedResponse, FacultyCreatedResponse
from app.core.security import get_password_hash
from app.utils.auth_utils import generate_random_password, generate_student_username, generate_faculty_username, generate_uuid

def create_student(db: Session, student_data: StudentCreate) -> StudentCreatedResponse:
    # Check if email or roll_no exists
    if db.query(User).filter(User.email == student_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(StudentProfile).filter(StudentProfile.roll_no == student_data.roll_no).first():
        raise HTTPException(status_code=400, detail="Roll number already exists")

    password = generate_random_password()
    username = generate_student_username(student_data.name, student_data.roll_no)
    
    # Ensure unique username
    while db.query(User).filter(User.username == username).first():
        username = generate_student_username(student_data.name, student_data.roll_no + generate_uuid()[:4])

    user_id = generate_uuid()
    new_user = User(
        id=user_id,
        email=student_data.email,
        username=username,
        hashed_password=get_password_hash(password),
        role=RoleEnum.student
    )
    db.add(new_user)
    
    profile_data = student_data.model_dump()
    profile_data.pop('email', None)
    profile_data['user_id'] = user_id
    new_profile = StudentProfile(**profile_data)
    db.add(new_profile)
    
    db.commit()
    db.refresh(new_profile)

    return {
        "student": new_profile,
        "credentials": {
            "username": username,
            "password": password
        }
    }

def create_faculty(db: Session, faculty_data: FacultyCreate) -> FacultyCreatedResponse:
    if db.query(User).filter(User.email == faculty_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    password = generate_random_password()
    username = generate_faculty_username(faculty_data.name)
    
    while db.query(User).filter(User.username == username).first():
        username = generate_faculty_username(faculty_data.name) + generate_uuid()[:4]

    user_id = generate_uuid()
    new_user = User(
        id=user_id,
        email=faculty_data.email,
        username=username,
        hashed_password=get_password_hash(password),
        role=RoleEnum.faculty
    )
    db.add(new_user)
    
    profile_data = faculty_data.model_dump()
    profile_data.pop('email', None)
    profile_data['user_id'] = user_id
    new_profile = FacultyProfile(**profile_data)
    db.add(new_profile)
    
    db.commit()
    db.refresh(new_profile)

    return {
        "faculty": new_profile,
        "credentials": {
            "username": username,
            "password": password
        }
    }
