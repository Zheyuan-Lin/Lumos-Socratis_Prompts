import os
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud import storage
from datetime import datetime

# Initialize Firebase with the correct credentials file
cred = credentials.Certificate('/Users/soukasumi/Desktop/socratisprompts-firebase-adminsdk-fbsvc-e2b189e793.json')
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

# Initialize Google Cloud Storage client
storage_client = storage.Client()

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

def export_to_cloud_storage(bucket_name="socratis-data-backup"):
    """
    Export all Firestore collections to Google Cloud Storage.
    
    Args:
        bucket_name (str): Name of the GCS bucket to store the exports
    """
    try:
        # Get or create bucket
        try:
            bucket = storage_client.get_bucket(bucket_name)
        except Exception:
            bucket = storage_client.create_bucket(bucket_name)
            print(f"Created new bucket: {bucket_name}")

        # Get all collections
        collections = ['interactions', 'questions', 'responses', 'insights']
        export_data = {}
        
        for collection_name in collections:
            # Get all documents in the collection
            docs = db.collection(collection_name).stream()
            collection_data = []
            
            for doc in docs:
                # Convert document to dictionary and add document ID
                doc_data = doc.to_dict()
                doc_data['id'] = doc.id
                collection_data.append(doc_data)
            
            export_data[collection_name] = collection_data
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'firestore_export_{timestamp}.json'
        
        # Create a temporary local file
        temp_file = f'/tmp/{filename}'
        with open(temp_file, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        # Upload to Google Cloud Storage
        blob = bucket.blob(f'exports/{filename}')
        blob.upload_from_filename(temp_file)
        
        # Clean up temporary file
        os.remove(temp_file)
        
        print(f"Successfully exported Firestore data to gs://{bucket_name}/exports/{filename}")
        return {
            'status': 'success',
            'bucket': bucket_name,
            'filename': f'exports/{filename}',
            'url': f'gs://{bucket_name}/exports/{filename}'
        }
        
    except Exception as e:
        error_msg = f"Error exporting to Cloud Storage: {str(e)}"
        print(error_msg)
        return {
            'status': 'error',
            'message': error_msg
        } 