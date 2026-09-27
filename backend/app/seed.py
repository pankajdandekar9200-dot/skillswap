"""
Seed script — populates the database with 20 demo students, skills, availability,
exchange requests, sessions, and reviews for immediate demonstration.

Run: python -m app.seed
"""

from datetime import datetime, timedelta
import random
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Skill, UserSkill, Availability, ExchangeRequest, Session, Review,
    Credit, CreditTransaction,
)
from app.auth import hash_password
from app.config import INITIAL_CREDITS

# ── Skill catalog ──────────────────────────────────────────────────

SKILLS = [
    # Tech
    ("Python", "Tech"), ("JavaScript", "Tech"), ("React", "Tech"),
    ("Machine Learning", "Tech"), ("Data Analysis", "Tech"), ("Web Development", "Tech"),
    # Design
    ("Graphic Design", "Design"), ("UI/UX Design", "Design"), ("Figma", "Design"),
    ("Photography", "Design"),
    # Communication
    ("Public Speaking", "Communication"), ("Debate", "Communication"),
    ("Academic Writing", "Communication"), ("Presentation Skills", "Communication"),
    # Arts
    ("Guitar", "Arts"), ("Piano", "Arts"), ("Sketching", "Arts"),
    ("Video Editing", "Arts"), ("Digital Painting", "Arts"),
    # Business
    ("Marketing", "Business"), ("Entrepreneurship", "Business"),
    ("Financial Literacy", "Business"), ("Project Management", "Business"),
    # Academics
    ("Calculus", "Academics"), ("Physics", "Academics"), ("Statistics", "Academics"),
    ("Organic Chemistry", "Academics"), ("Linear Algebra", "Academics"),
]

# ── Demo students ──────────────────────────────────────────────────

STUDENTS = [
    {"name": "Pankaj dandekar", "email": "pankaj@demo.edu", "college": "DIT,PIMPRI", "bio": "CS sophomore passionate about open-source and machine learning. Always happy to teach Python basics!"},
    {"name": "Shravan bairagi", "email": "shravan@demo.edu", "college": "NIT Trichy", "bio": "Design enthusiast learning to code. I can teach Figma and UI/UX in exchange for React lessons."},
    {"name": "Harsh bhosale", "email": "harsh@demo.edu", "college": "BITS Pilani", "bio": "Third-year mechanical engineer who loves guitar and wants to learn digital marketing."},
    {"name": "Sneha Iyer", "email": "sneha@demo.edu", "college": "IIT Bombay", "bio": "Data science nerd. Teach me photography and I'll teach you statistics and Python!"},
    {"name": "Arjun Nair", "email": "arjun@demo.edu", "college": "VIT Vellore", "bio": "Full-stack developer and part-time debate club captain. Let's swap skills!"},
    {"name": "Kavya Reddy", "email": "kavya@demo.edu", "college": "IIIT Hyderabad", "bio": "Graphic designer exploring the world of entrepreneurship and business."},
    {"name": "Vikram Singh", "email": "vikram@demo.edu", "college": "Delhi University", "bio": "Physics tutor and aspiring pianist. Happy to help with calculus too!"},
    {"name": "Ananya Gupta", "email": "ananya@demo.edu", "college": "IIT Kanpur", "bio": "Video editor and content creator. Looking to learn web development."},
    {"name": "Rohan Das", "email": "rohan@demo.edu", "college": "Jadavpur University", "bio": "Marketing intern turned coder. I can teach you brand strategy while you teach me JavaScript."},
    {"name": "Meera Joshi", "email": "meera@demo.edu", "college": "IISER Pune", "bio": "Organic chemistry enthusiast who also loves sketching. Let's learn together!"},
    {"name": "Aditya Kumar", "email": "aditya@demo.edu", "college": "NIT Warangal", "bio": "Machine learning researcher. Teach me public speaking, I'll teach you ML!"},
    {"name": "Ishika Banerjee", "email": "ishika@demo.edu", "college": "Presidency University", "bio": "Literature student with a passion for academic writing and debate."},
    {"name": "Nikhil Menon", "email": "nikhil@demo.edu", "college": "IIIT Bangalore", "bio": "React developer and project management enthusiast. Always open to skill swaps."},
    {"name": "Divya Saxena", "email": "divya@demo.edu", "college": "Miranda House", "bio": "Financial literacy advocate and aspiring data analyst."},
    {"name": "Karthik Rajan", "email": "karthik@demo.edu", "college": "IIT Madras", "bio": "Linear algebra TA. Teach me guitar and I'll help you ace your math courses!"},
    {"name": "Tanya Malhotra", "email": "tanya@demo.edu", "college": "NIFT Delhi", "bio": "Fashion design student learning digital painting. I can teach photography!"},
    {"name": "Siddharth Jain", "email": "siddharth@demo.edu", "college": "BITS Goa", "bio": "Entrepreneur running a campus startup. Looking to learn React and ML."},
    {"name": "Nandini Rao", "email": "nandini@demo.edu", "college": "IISc Bangalore", "bio": "Physics researcher and piano lover. Let's exchange knowledge!"},
    {"name": "Amit Thakur", "email": "amit@demo.edu", "college": "DTU Delhi", "bio": "Web dev freelancer teaching JavaScript. Want to learn public speaking."},
    {"name": "Riya Chatterjee", "email": "riya@demo.edu", "college": "St. Xavier's Kolkata", "bio": "Presentation skills coach and aspiring data scientist."},
]

# Skills each student teaches and wants to learn (by skill index)
STUDENT_SKILLS = [
    # (teach_indices, learn_indices)
    ([0, 4], [6, 14]),         # pankaj: teaches Python, Data Analysis; wants Graphic Design, Guitar
    ([7, 8], [2, 5]),          # shravan: teaches UI/UX, Figma; wants React, Web Dev
    ([14, 10], [19, 17]),      # harsh: teaches Guitar, Public Speaking; wants Marketing, Video Editing
    ([0, 25], [9, 6]),         # Sneha: teaches Python, Statistics; wants Photography, Graphic Design
    ([1, 5, 11], [19, 15]),    # Arjun: teaches JS, Web Dev, Debate; wants Marketing, Piano
    ([6, 8], [20, 22]),        # Kavya: teaches Graphic Design, Figma; wants Entrepreneurship, Project Mgmt
    ([24, 23], [15, 0]),       # Vikram: teaches Physics, Calculus; wants Piano, Python
    ([17, 18], [5, 2]),        # Ananya: teaches Video Editing, Digital Painting; wants Web Dev, React
    ([19, 20], [1, 0]),        # Rohan: teaches Marketing, Entrepreneurship; wants JS, Python
    ([26, 16], [3, 17]),       # Meera: teaches Org Chem, Sketching; wants ML, Video Editing
    ([3, 4], [10, 13]),        # Aditya: teaches ML, Data Analysis; wants Public Speaking, Presentation
    ([12, 11], [6, 17]),       # Ishika: teaches Academic Writing, Debate; wants Graphic Design, Video Editing
    ([2, 22], [20, 14]),       # Nikhil: teaches React, Project Mgmt; wants Entrepreneurship, Guitar
    ([21, 4], [0, 3]),         # Divya: teaches Financial Literacy, Data Analysis; wants Python, ML
    ([27, 23], [14, 1]),       # Karthik: teaches Linear Algebra, Calculus; wants Guitar, JS
    ([9, 18], [8, 6]),         # Tanya: teaches Photography, Digital Painting; wants Figma, Graphic Design
    ([20, 22], [2, 3]),        # Siddharth: teaches Entrepreneurship, Project Mgmt; wants React, ML
    ([24, 15], [0, 3]),        # Nandini: teaches Physics, Piano; wants Python, ML
    ([1, 5], [10, 13]),        # Amit: teaches JS, Web Dev; wants Public Speaking, Presentation
    ([13, 10], [4, 0]),        # Riya: teaches Presentation, Public Speaking; wants Data Analysis, Python
]

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
TIMES = [("09:00", "11:00"), ("11:00", "13:00"), ("14:00", "16:00"), ("16:00", "18:00"), ("18:00", "20:00")]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database...")

    # 1. Create skills
    skill_objs = []
    for name, cat in SKILLS:
        s = Skill(name=name, category=cat)
        db.add(s)
        skill_objs.append(s)
    db.flush()
    print(f"  Created {len(skill_objs)} skills")

    # 2. Create students
    user_objs = []
    for student in STUDENTS:
        u = User(
            name=student["name"],
            email=student["email"],
            password_hash=hash_password("password123"),
            college=student["college"],
            bio=student["bio"],
            is_verified=True,
        )
        db.add(u)
        user_objs.append(u)
    db.flush()
    print(f"  Created {len(user_objs)} students")

    # 3. Assign skills
    for i, (teach_idx, learn_idx) in enumerate(STUDENT_SKILLS):
        for idx in teach_idx:
            us = UserSkill(
                user_id=user_objs[i].id,
                skill_id=skill_objs[idx].id,
                type="teach",
                proficiency_level=random.randint(60, 95),
            )
            db.add(us)
        for idx in learn_idx:
            us = UserSkill(
                user_id=user_objs[i].id,
                skill_id=skill_objs[idx].id,
                type="learn",
                proficiency_level=random.randint(10, 40),
            )
            db.add(us)
    db.flush()
    print("  Assigned skills to students")

    # 4. Add availability
    for i, user in enumerate(user_objs):
        num_slots = random.randint(2, 5)
        chosen_days = random.sample(DAYS, num_slots)
        for day in chosen_days:
            start, end = random.choice(TIMES)
            mode = random.choice(["online", "in-person", "online"])  # bias towards online
            a = Availability(
                user_id=user.id,
                day_of_week=day,
                start_time=start,
                end_time=end,
                mode=mode,
            )
            db.add(a)
    db.flush()
    print("  Added availability slots")

    # 5. Create credits for each user
    for user in user_objs:
        c = Credit(user_id=user.id, balance=INITIAL_CREDITS + random.randint(0, 30))
        db.add(c)
    db.flush()

    # 6. Create some exchange requests + completed sessions + reviews
    exchange_pairs = [
        (0, 3, 0, 9),   # Pankaj↔Sneha: Python for Photography
        (1, 4, 7, 1),   # shravan↔Arjun: UI/UX for JS
        (2, 8, 14, 1),  # harsh↔Rohan: Guitar for JS
        (5, 12, 6, 22), # Kavya↔Nikhil: Graphic Design for Project Mgmt
        (6, 17, 24, 15),# Vikram↔Nandini: Physics for Piano
        (9, 7, 16, 17), # Meera↔Ananya: Sketching for Video Editing
        (10, 19, 3, 4), # Aditya↔Riya: ML for Data Analysis
        (13, 18, 21, 1),# Divya↔Amit: Financial Literacy for JS
    ]

    now = datetime.utcnow()
    for req_i, rec_i, req_skill_i, rec_skill_i in exchange_pairs:
        er = ExchangeRequest(
            requester_id=user_objs[req_i].id,
            recipient_id=user_objs[rec_i].id,
            requester_skill_id=skill_objs[req_skill_i].id,
            recipient_skill_id=skill_objs[rec_skill_i].id,
            status="accepted",
            message="Hey! I'd love to swap skills with you. Let's learn together!",
            created_at=now - timedelta(days=random.randint(5, 30)),
        )
        db.add(er)
        db.flush()

        # Create a completed session
        session = Session(
            exchange_request_id=er.id,
            scheduled_at=now - timedelta(days=random.randint(1, 4)),
            duration_minutes=60,
            mode=random.choice(["online", "in-person"]),
            status="completed",
            meeting_link_or_location="https://meet.google.com/abc-defg-hij",
            completed_by_teacher_at=now - timedelta(hours=random.randint(1, 48)),
            completed_by_learner_at=now - timedelta(hours=random.randint(1, 48)),
        )
        db.add(session)
        db.flush()

        # Both participants review each other
        for reviewer_i, reviewee_i in [(req_i, rec_i), (rec_i, req_i)]:
            review = Review(
                session_id=session.id,
                reviewer_id=user_objs[reviewer_i].id,
                reviewee_id=user_objs[reviewee_i].id,
                rating=random.randint(4, 5),
                teaching_quality=random.randint(3, 5),
                knowledge=random.randint(4, 5),
                communication=random.randint(3, 5),
                would_learn_again=True,
                comment=random.choice([
                    "Great session! Learned a lot.",
                    "Really patient teacher. Highly recommend!",
                    "Amazing explanation of concepts. Would love to swap again.",
                    "Very knowledgeable and friendly. Thank you!",
                    "Fantastic experience. Made a complex topic easy to understand.",
                ]),
            )
            db.add(review)

    # 7. Add a few pending requests for demo purposes
    pending_pairs = [
        (3, 11, 25, 12),  # Sneha→Ishika: Stats for Academic Writing
        (14, 2, 27, 14),  # Karthik→harsh: Linear Algebra for Guitar
        (15, 5, 9, 8),    # Tanya→Kavya: Photography for Figma
    ]
    for req_i, rec_i, req_skill_i, rec_skill_i in pending_pairs:
        er = ExchangeRequest(
            requester_id=user_objs[req_i].id,
            recipient_id=user_objs[rec_i].id,
            requester_skill_id=skill_objs[req_skill_i].id,
            recipient_skill_id=skill_objs[rec_skill_i].id,
            status="pending",
            message="Hi! I noticed we have complementary skills. Want to swap?",
        )
        db.add(er)

    db.commit()
    db.close()
    print("  Seeding complete!")


if __name__ == "__main__":
    seed()
