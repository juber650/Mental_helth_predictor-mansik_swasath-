import pandas as pd
import joblib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal


# Load trained ML model
model = joblib.load("mental_helth_model.pkl")


# Create FastAPI application
app = FastAPI(
    title="MindScope AI",
    description="Student Mental Health Prediction API",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# Input Data Model
# ==============================

class StudentData(BaseModel):

    Age: int = Field(
        ...,
        gt=10,
        description="Age of the student in years"
    )

    Gender: Literal[
        "Male",
        "Female",
        "Other"
    ]

    Country: str

    Academic_Level: Literal[
        "High School",
        "Undergraduate",
        "Graduate",
        "Postgraduate"
    ]

    Most_Used_Platform: Literal[
        "Facebook",
        "LinkedIn",
        "Instagram",
        "Snapchat",
        "Twitter",
        "YouTube",
        "TikTok",
        "LINE",
        "KakaoTalk",
        "VKontakte",
        "WhatsApp",
        "WeChat"
    ]

    Purpose_Of_Use: Literal[
        "Networking",
        "Education",
        "Entertainment",
        "News"
    ]

    Avg_Daily_Usage_Hours: float = Field(
        ...,
        gt=0,
        le=24
    )

    Daily_Unlocks: int = Field(
        ...,
        gt=0,
        description="Number of times the phone is unlocked daily"
    )

    Study_Hours: float = Field(
        ...,
        gt=0,
        le=24,
        description="Number of hours spent studying daily"
    )

    Physical_Activity_Hours: float = Field(
        ...,
        gt=0,
        le=24,
        description="Number of hours spent on physical activity daily"
    )

    Sleep_Hours_Per_Night: float = Field(
        ...,
        gt=0,
        le=24,
        description="Number of hours spent sleeping per night"
    )

    Stress_Level: Literal[
        "Medium",
        "Low",
        "Very High",
        "High"
    ]


# ==============================
# Prediction Response
# ==============================

class PredictionResponse(BaseModel):

    predicted_mental_health_score: float


# ==============================
# Countries
# ==============================

top_countries = [
    "Other",
    "India",
    "USA",
    "Canada",
    "Australia",
    "UK",
    "Germany",
    "Turkey",
    "Mexico",
    "France"
]


# ==============================
# Home Route
# ==============================

@app.get("/")
def greet():

    return {
        "message": "Hello! Welcome to the MindScope Mental Health Prediction API."
    }


# ==============================
# Prediction Route
# ==============================

@app.post(
    "/predict",
    response_model=PredictionResponse
)
def predict(data: StudentData):

    # Group countries
    country_group = (
        data.Country
        if data.Country in top_countries
        else "Other"
    )

    # Create input DataFrame (exactly matching the new pipeline features)
    input_row = pd.DataFrame([{
        "Study_Hours": data.Study_Hours,
        "Age": data.Age,
        "Avg_Daily_Usage_Hours": data.Avg_Daily_Usage_Hours,
        "Daily_Unlocks": data.Daily_Unlocks,
        "Physical_Activity_Hours": data.Physical_Activity_Hours,
        "Sleep_Hours_Per_Night": data.Sleep_Hours_Per_Night,
        "Stress_Level": data.Stress_Level,
        "Gender": data.Gender,
        "Grouped_country": country_group,  # 'c' छोटा है, ट्रेनिंग कोड के अनुसार
        "Academic_Level": data.Academic_Level,
        "Most_Used_Platform": data.Most_Used_Platform,
        "Purpose_Of_Use": data.Purpose_Of_Use
    }])

    # Make prediction
    prediction = model.predict(input_row)[0]

    # Return prediction
    return PredictionResponse(
        predicted_mental_health_score=round(float(prediction), 2)
    )