from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import json
import os
import warnings
import requests
import tempfile
import pickle
import pandas as pd
from datetime import datetime
from all_embeddings_of_files import setup_embeddings, answer_query
from decision_logic_access_control import unified_access_control_logic, load_users
from langchain_community.vectorstores import Chroma

warnings.filterwarnings("ignore")

load_dotenv()

app = Flask(__name__)
# Configure CORS with more specific options
CORS(app)

# Load the saved Random Forest model and label encoders
with open('random_forest_model_new.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

with open('label_encoders.pkl', 'rb') as encoders_file:
    label_encoders = pickle.load(encoders_file)


chroma_db = None
chat_memory = []

@app.route('/')
def home():
    return "Welcome to the Linear Depression Prediction API!"

# @app.route('/transcribe', methods=['POST'])
# def transcribe_video():
#     """
#     Endpoint to accept an MP4 file, process it, and return the transcription.
#     """
#     if 'file' not in request.files:
#         return jsonify({"error": "No file provided"}), 400

#     file = request.files['file']

#     if file.filename == '':
#         return jsonify({"error": "No file selected"}), 400

#     if not file.filename.endswith('.mp4'):
#         return jsonify({"error": "Invalid file type. Only MP4 files are supported."}), 400

#     # Save the file temporarily
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
#         file.save(temp_file.name)
#         temp_file_path = temp_file.name

#     try:
#         # Call the get_transcription function
#         transcription = get_transcription(temp_file_path)
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#     finally:
#         # Clean up the temporary file
#         if os.path.exists(temp_file_path):
#             os.remove(temp_file_path)

#     return jsonify({"transcription": transcription}), 200


def load_users():
    with open('data.json') as f:
        return json.load(f)

# LOGIN endpoint
@app.route('/login', methods=['POST'])
def login():
    """
    Endpoint to validate user login credentials.
    Expects 'email' and 'password' in the request body.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    # Load users from data.json
    users = load_users()
    for user in users:
        if user['email'] == email and user['password'] == password:
            return jsonify({'message': 'Login successful', 'user': user}), 200

    return jsonify({'message': 'Invalid credentials'}), 401

# GET user by ID
@app.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    users = load_users()
    for user in users:
        if user['id'] == user_id:
            return jsonify(user), 200

    return jsonify({'message': 'User not found'}), 404

def make_call(number: str = "8850094107") -> dict:
    """Initiate a call to the specified phone number."""
    if not number.startswith("+91"):
        number = f"+91{number}"

    print(f"Calling: {number}")

    response = requests.post(
        "https://api.vapi.ai/call",
        headers={
            "Authorization": f"Bearer be548093-f962-420c-87d1-793ca2fd555e",
            "Content-Type": "application/json"
        },
        json={
            "assistantId": "72260992-7070-4428-9b3d-c5aef5bff288",
            "name": "Py-Caller",
            "customer": {
                "number": number,
            },
            "phoneNumberId": "0449d051-6037-42e3-9a92-2b75dcdeb17e"
        },
    )

    if response.status_code == 200:
        return {"message": "Call initiated"}
    else:
        return {
            "message": "Failed to initiate call",
            "details": response.json()
        }
    


# Call endpoint
@app.route('/call', methods=['POST'])
def call_endpoint():
    result = make_call()
    return jsonify(result)

@app.route('/classify-request', methods=['POST'])
def classify_request():
    """
    Endpoint to classify a user request based on the provided data.
    a sample request body would be:
    user_data = {
        'user_role': 'Admin',
        'department': 'IT',
        'employee_status': 'Terminated',
        'resource_type': 'doc',
        'resource_sensitivity': 'restricted',
        'employee_join_date': '02-04-2020',
        'past_violations': 0
    }
    """
    try:
        # Get user data from the request
        user_data = request.get_json()

        # Validate required fields
        required_fields = ['user_role', 'department', 'employee_status', 'resource_type', 
                           'resource_sensitivity', 'employee_join_date', 'past_violations']
        for field in required_fields:
            if field not in user_data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Convert to DataFrame
        user_df = pd.DataFrame([user_data])

        # Preprocess the data (use saved encoders for consistency)
        categorical_cols = ['user_role', 'department', 'employee_status', 'resource_type', 'resource_sensitivity']
        for col in categorical_cols:
            le = label_encoders[col]
            # Handle unseen categories
            if user_df[col].iloc[0] not in le.classes_:
                return jsonify({"error": f"Unknown category '{user_df[col].iloc[0]}' in column '{col}'"}), 400
            user_df[col] = le.transform(user_df[col])

        # Feature engineering: derive time spent in months
        current_date = pd.to_datetime('today')
        user_df['employee_join_date'] = pd.to_datetime(user_df['employee_join_date'], errors='coerce')
        user_df['time_spent_months'] = (current_date - user_df['employee_join_date']).dt.days // 30

        # Drop the original 'employee_join_date'
        user_df.drop('employee_join_date', axis=1, inplace=True)

        # Predict using the Random Forest model
        prediction = model.predict(user_df)[0]  # Get the numeric prediction (0 or 1)
        probability = model.predict_proba(user_df)[0]  # Get the probability for each class

        # Map numeric prediction to label
        prediction_label = "Approved" if prediction == 1 else "Not Approved"

        # Prepare the response
        response = {
            "prediction": int(prediction),  # Numeric prediction (0 or 1)
            "prediction_label": prediction_label,  # Label ("Approved" or "Not Approved")
            "probability": probability.tolist()  # Probabilities for each class
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@app.route('/create-embeddings', methods=['POST'])
def create_embeddings():
    global chroma_db
    data = request.get_json()
    file_paths = data.get("file_paths", [])
    if not file_paths:
        return jsonify({"error": "No file paths provided"}), 400
    try:
        chroma_db = setup_embeddings(file_paths)
        return jsonify({"message": "Embeddings created and stored in ChromaDB"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/query', methods=['POST'])
def query():
    """
    Endpoint to handle user queries with access control logic.
    Expects 'user_id' and 'query' in the request body.
    """
    global chroma_db, chat_memory

    # Check if ChromaDB is initialized
    if chroma_db is None:
        return jsonify({"error": "ChromaDB is not initialized. Please create embeddings first."}), 400

    # Parse the request data
    data = request.get_json()
    user_id = data.get("user_id")
    user_query = data.get("query")

    # Validate inputs
    if not user_id or not user_query:
        return jsonify({"error": "Both 'user_id' and 'query' are required."}), 400

    try:
        # Step 1: Run unified access control logic
        access_control_result = unified_access_control_logic(user_id, user_query)

        # Step 2: Handle access control results
        if access_control_result == "User not found":
            return jsonify({"error": "User not found"}), 404
        elif access_control_result == "access denied":
            return jsonify({"message": "Access Denied"}), 403
        elif access_control_result == "show":
            # Logic for "show" or "display" queries
            return jsonify({"message": "show"}), 200
        else:
            # Proceed with RAG-based approach
            response = answer_query(user_query, chroma_db)
            return jsonify({"response": response, "chat_memory": chat_memory}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=False)