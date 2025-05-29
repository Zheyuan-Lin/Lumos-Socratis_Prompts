<<<<<<< HEAD
import os
import json
=======
>>>>>>> a29a5e4f32d7de1e157468df1cdf57da4f3f4f33
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

<<<<<<< HEAD
# Get Firebase credentials from environment variable
#firebase_credentials = os.getenv('FIREBASE_CREDENTIALS')

# if not firebase_credentials:
#     raise ValueError("FIREBASE_CREDENTIALS environment variable is not set")

# # Parse the credentials JSON string
# cred_dict = json.loads(firebase_credentials)
# cred = credentials.Certificate(cred_dict)

cred = credentials.Certificate('/Users/soukasumi/Desktop/firebase.json')  
# Initialize Firebase
=======
cred = credentials.Certificate('/Users/soukasumi/Desktop/socratisprompts-firebase-adminsdk-fbsvc-e2b189e793.json')  
>>>>>>> a29a5e4f32d7de1e157468df1cdf57da4f3f4f33
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