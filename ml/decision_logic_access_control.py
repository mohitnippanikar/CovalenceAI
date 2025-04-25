import pandas as pd
import pickle
from datetime import datetime
import json

# Load the saved Random Forest model and label encoders
with open('random_forest_model_new.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

with open('label_encoders.pkl', 'rb') as encoders_file:
    label_encoders = pickle.load(encoders_file)

def classify_request(user_data, user_query):
    """
    Function to classify a user request based on the provided data and user query.
    
    Args:
        user_data (dict): The user data containing fields like user_role, department, etc.
        user_query (str): The query or context for classification.

    Returns:
        dict: A dictionary containing the prediction, prediction label, and probabilities.
    """
    try:
        # Validate required fields
        required_fields = ['user_role', 'department', 'employee_status', 'resource_type', 
                           'resource_sensitivity', 'employee_join_date', 'past_violations']
        for field in required_fields:
            if field not in user_data:
                raise ValueError(f"Missing required field: {field}")

        # Convert to DataFrame
        user_df = pd.DataFrame([user_data])

        # Preprocess the data (use saved encoders for consistency)
        categorical_cols = ['user_role', 'department', 'employee_status', 'resource_type', 'resource_sensitivity']
        for col in categorical_cols:
            le = label_encoders[col]
            # Handle unseen categories
            if user_df[col].iloc[0] not in le.classes_:
                raise ValueError(f"Unknown category '{user_df[col].iloc[0]}' in column '{col}'")
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
            "user_query": user_query,  # Include the user query in the response
            "prediction": int(prediction),  # Numeric prediction (0 or 1)
            "prediction_label": prediction_label,  # Label ("Approved" or "Not Approved")
            "probability": probability.tolist()  # Probabilities for each class
        }

        return response

    except Exception as e:
        return {"error": str(e)}
    


from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
load_dotenv()
import os
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def predict_role_using_query(user_query):
    prompt = """
    You have to understand the user query properly and categorize it into one of the following roles: - 
    hr,legal,sales.
    Undestand that hr will have access to information about the employees but will not have access to the legal or the sales information.
    legal will have access to the legal information or the company policies but will not have access to the employee information or the sales information.
    sales department will have access to the sales information or the historical data of the sales but will not have access to the employee information or the legal information.

    So based on the user query you have to predict the role of the user.
    Your answer should be strictly in lowercase and only one single word - hr,legal,sales.
    Donot add any other information or explanation to your answer, just one single word from the above mentioned roles.

    The user query is - {user_query}

    """


    llm = ChatGroq(temperature=0, groq_api_key=GROQ_API_KEY, model_name="llama-3.1-8b-instant")

    # Build the full prompt with the transcript text
    actual_prompt = ChatPromptTemplate.from_messages([
        ("system", prompt),
        ("human", "{input}")
    ])

    chain = actual_prompt | llm
    response = chain.invoke({"input": "tell me the role of the user based on the query provided.Give only one word and nothing else", "user_query": user_query})
    
    # Return the notes content
    return response.content


def load_users():
    """
    Load users from the data.json file.
    """
    with open('data.json') as f:
        return json.load(f)

def unified_access_control_logic(user_id, user_query):
    """
    Unified logic to handle access control based on user ID and query.

    Args:
        user_id (int): The ID of the user.
        user_query (str): The query or context for classification.

    Returns:
        str: The final decision or action to be taken.
    """
    # Step 1: Fetch user data from data.json
    users = load_users()
    user_data = next((user for user in users if user.get("id") == user_id), None)

    if not user_data:
        return "User not found"

    # Keep only the required attributes
    user_data = {
        "user_role": user_data.get("user_role"),
        "department": user_data.get("department"),
        "employee_status": user_data.get("employee_status"),
        "resource_type": user_data.get("resource_type"),
        "resource_sensitivity": user_data.get("resource_sensitivity"),
        "employee_join_date": user_data.get("employee_join_date"),
        "past_violations": user_data.get("past_violations"),
    }

    # Step 2: Run classify_request
    classification_response = classify_request(user_data, user_query)

    # Check if classification response indicates "Access Denied"
    if classification_response.get("prediction") == 0:
        return "access denied"

    # Step 3: Run predict_role_using_query
    predicted_role = predict_role_using_query(user_query)

    # Check if the predicted role matches the user's department
    if predicted_role != user_data.get("department", "").lower():
        return "access denied"

    # Step 4: Check for specific words in the user query
    if any(word in user_query.lower() for word in ["show", "display"]):
        return "show"
    else:
        return "access granted"

   