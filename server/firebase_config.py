import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Get the path to the Firebase credentials file from environment variable
cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH environment variable is not set")

cred = credentials.Certificate(cred_path)
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