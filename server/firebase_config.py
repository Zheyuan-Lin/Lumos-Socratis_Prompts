import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate('/Users/soukasumi/Desktop/socratisprompts-firebase-adminsdk-fbsvc-e2b189e793.json')  
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

# Define the schema for questions collection
questions_schema = {
    "type": str,  # "question"
    "id": str,    # unique question id
    "text": str,  # question text
    "timestamp": str  # ISO timestamp
}

# Define the schema for responses collection
responses_schema = {
    "question_id": str,     # reference to question
    "response": str,        # user's response text
    "participant_id": str,  # user who responded
    "timestamp": str        # ISO timestamp
} 