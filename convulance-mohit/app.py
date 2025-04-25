from fastapi import FastAPI, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn
import logging
import os
import warnings
import tensorflow as tf
import main_model
from main_model import is_corporate_related, process_user_query, load_classifier

# Suppress warnings
warnings.filterwarnings('ignore', category=UserWarning, module='torch.utils._pytree')
warnings.filterwarnings('ignore', category=DeprecationWarning)

# Suppress TensorFlow messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=INFO, 2=WARNING, 3=ERROR
tf.get_logger().setLevel('ERROR')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app with metadata for documentation
app = FastAPI(
    title="Employee Query Classifier",
    description="API to determine if a query is appropriate for the employee dataset",
    version="1.0.0",
    docs_url="/",  # This will show the documentation on the home page
    redoc_url="/redoc"  # Alternative documentation at /redoc
)

# Input and Response Models
class QueryRequest(BaseModel):
    query: str

class UserQueryRequest(BaseModel):
    user_id: int
    query: str

class QueryResponse(BaseModel):
    query: str
    is_appropriate: bool
    label: str
    confidence: float

class UserQueryResponse(BaseModel):
    query: str
    is_appropriate: bool
    label: str
    confidence: float
    user_id: int
    user_dept: Optional[str] = None
    user_name: Optional[str] = None
    status: str
    message: str
    requested_dept: Optional[str] = None
    is_authorized: Optional[bool] = None
    auth_reason: Optional[str] = None

# Startup Event
@app.on_event("startup")
async def startup_event():
    try:
        logger.info("Loading classification model...")
        # Load the classifier and set it in the main_model module
        main_model.classifier = load_classifier()
        logger.info("Classification model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load classification model: {e}")
        raise HTTPException(status_code=500, detail="Failed to load classification model")

# API Routes
@app.post("/api/classify", response_model=QueryResponse, tags=["Classification"])
async def classify_query(request: QueryRequest):
    if main_model.classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        logger.info(f"Processing query: {request.query}")
        is_related, predicted_label, confidence, _ = is_corporate_related(
            request.query, 
            main_model.classifier
        )
        return {
            "query": request.query,
            "is_appropriate": is_related,
            "label": predicted_label,
            "confidence": float(confidence)
        }
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/classify", response_model=QueryResponse, tags=["Classification"])
async def classify_query_get(query: str = Query(..., description="The query text to classify")):
    if main_model.classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        logger.info(f"Processing query: {query}")
        is_related, predicted_label, confidence, _ = is_corporate_related(
            query, 
            main_model.classifier
        )
        return {
            "query": query,
            "is_appropriate": is_related,
            "label": predicted_label,
            "confidence": float(confidence)
        }
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user-query", response_model=UserQueryResponse, tags=["User Queries"])
async def process_authenticated_query(request: UserQueryRequest):
    """Process a query with user authentication and authorization"""
    try:
        logger.info(f"Processing user query: User ID {request.user_id}, Query: {request.query}")
        result = process_user_query(request.user_id, request.query)
        
        if result.get("status") == "error":
            # Return a 404 if user not found or other client errors
            if "not found" in result.get("message", ""):
                raise HTTPException(status_code=404, detail=result["message"])
            # Return a 400 for other client errors
            raise HTTPException(status_code=400, detail=result["message"])

        # Ensure all optional fields are explicitly set to avoid validation errors
        if "requested_dept" not in result or result["requested_dept"] is None:
            result["requested_dept"] = ""
            
        if "is_authorized" not in result:
            result["is_authorized"] = None
            
        if "auth_reason" not in result:
            result["auth_reason"] = None
            
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing user query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user-query", response_model=UserQueryResponse, tags=["User Queries"])
async def process_authenticated_query_get(
    user_id: int = Query(..., description="The ID of the user making the query"),
    query: str = Query(..., description="The query text to classify")
):
    """Process a query with user authentication and authorization (GET method)"""
    try:
        logger.info(f"Processing user query (GET): User ID {user_id}, Query: {query}")
        result = process_user_query(user_id, query)
        
        if result.get("status") == "error":
            # Return a 404 if user not found
            if "not found" in result.get("message", ""):
                raise HTTPException(status_code=404, detail=result["message"])
            # Return a 400 for other client errors
            raise HTTPException(status_code=400, detail=result["message"])
            
        # Ensure all optional fields are explicitly set to avoid validation errors
        if "requested_dept" not in result or result["requested_dept"] is None:
            result["requested_dept"] = ""
            
        if "is_authorized" not in result:
            result["is_authorized"] = None
            
        if "auth_reason" not in result:
            result["auth_reason"] = None
            
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing user query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": main_model.classifier is not None
    }

if __name__ == "__main__":
    # Control auto-reload with an environment variable (default: disabled for production)
    debug_mode = os.getenv("DEBUG", "False").lower() == "true"
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=debug_mode)
