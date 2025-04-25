# Employee Query Classifier API

This API determines whether a query is appropriate for the employee dataset and provides authentication/authorization based on user roles.

## Overview

The service uses a zero-shot classification model to determine if a query is corporate-related and appropriate for the employee dataset. It can also check if a user has the proper authorization to access specific department data.

## Features

- Query classification (corporate vs non-corporate)
- User authentication based on CSV data
- Department-specific authorization rules
- Special role-based permissions

## Installation

1. Clone this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the API server:

```bash
python app.py
```

By default, the server runs at http://127.0.0.1:8000

## API Endpoints

### Basic Classification

#### POST /api/classify

Classifies a query without user authentication.

**Request:**
```json
{
  "query": "Show me the employees in the Engineering department"
}
```

**Response:**
```json
{
  "query": "Show me the employees in the Engineering department",
  "is_appropriate": true,
  "label": "employee data request",
  "confidence": 0.82
}
```

#### GET /api/classify?query=...

Same as POST but using a GET request.

### User-Authenticated Queries

#### POST /api/user-query

Processes a query with user authentication and authorization.

**Request:**
```json
{
  "user_id": 10,
  "query": "Show me the list of employees in the Engineering department"
}
```

**Response:**
```json
{
  "query": "Show me the list of employees in the Engineering department",
  "is_appropriate": true,
  "label": "employee data request",
  "confidence": 0.82,
  "user_id": 10,
  "user_dept": "Human Resources",
  "user_name": "Niels Toffetto",
  "status": "approved",
  "message": "Query approved: Cross-department authorization from Human Resources to Engineering",
  "requested_dept": "Engineering",
  "is_authorized": true,
  "auth_reason": "Cross-department authorization from Human Resources to Engineering"
}
```

#### GET /api/user-query?user_id=...&query=...

Same as POST but using a GET request.

### Health Check

#### GET /api/health

Checks if the API is running and the model is loaded.

## Authorization Rules

The system uses several factors to determine if a user is authorized to access data:

1. **Department Matching**: Users can always access data from their own department
2. **Special Roles**: Certain users have elevated privileges (e.g., HR, Legal)
3. **Department Access Rules**: Specific departments can access other departments' data
4. **Past Violations**: Users with multiple violations have restricted access

## Running the Tests

To test the API functionality:

```bash
python test_api.py
```

This will run through various test scenarios for both basic classification and user-authenticated queries.

## Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- Transformers
- PyTorch
- Pandas

## User Data

User information is stored in `MOCK_DATA.csv` with the following fields:
- id
- first_name
- last_name
- email
- gender
- ip_address
- dept
- profile_url
- join_date
- past_violations 