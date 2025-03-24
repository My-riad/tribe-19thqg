#!/usr/bin/env python3
"""
Main entry point for the AI Engine service.

This service provides AI-powered capabilities for the Tribe platform, including:
- Matchmaking: Assigning users to compatible Tribes
- Personality Analysis: Analyzing user traits and compatibility
- Engagement Generation: Creating conversation prompts and challenges
- Recommendations: Suggesting events and activities
"""

import os
import sys
import time
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config.settings import (
    ENV, 
    DEBUG, 
    LOG_LEVEL, 
    DEFAULT_MODEL,
    validate_settings
)
from . import configure_logging
from . import (
    create_matching_service,
    create_personality_service,
    create_engagement_service,
    create_recommendation_service
)
from .adapters.model_adapter import (
    ModelAdapterError,
    ModelTimeoutError,
    ModelAuthenticationError,
    ModelRateLimitError,
    ModelContentFilterError
)

# Set up module logger
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="Tribe AI Engine",
    description="AI-powered matchmaking, personality analysis, engagement, and recommendation services",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Service instances (initialized during startup)
matching_service = None
personality_service = None
engagement_service = None
recommendation_service = None

# Request validation models
class MatchingRequest(BaseModel):
    """Request model for matching operations"""
    matching_type: str
    data: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)
    model_name: Optional[str] = None

class PersonalityRequest(BaseModel):
    """Request model for personality analysis"""
    assessment_data: Dict[str, Any]
    analysis_type: str
    options: Dict[str, Any] = Field(default_factory=dict)
    model_name: Optional[str] = None

class EngagementRequest(BaseModel):
    """Request model for engagement generation"""
    engagement_type: str
    context: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)
    model_name: Optional[str] = None

class RecommendationRequest(BaseModel):
    """Request model for recommendations"""
    recommendation_type: str
    user_data: Dict[str, Any]
    context: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)
    model_name: Optional[str] = None

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services and validate settings at startup"""
    global matching_service, personality_service, engagement_service, recommendation_service
    
    logger.info(f"Starting AI Engine in {ENV} environment (debug={DEBUG})")
    
    # Validate settings
    if not validate_settings():
        logger.warning("Settings validation failed. Some features may not work correctly.")
    
    # Initialize services if not already initialized
    if matching_service is None:
        matching_service = create_matching_service()
        
    if personality_service is None:
        personality_service = create_personality_service()
        
    if engagement_service is None:
        engagement_service = create_engagement_service()
        
    if recommendation_service is None:
        recommendation_service = create_recommendation_service()
    
    logger.info("AI Engine services initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources at shutdown"""
    global matching_service, personality_service, engagement_service, recommendation_service
    
    logger.info("Shutting down AI Engine")
    
    # Close service instances
    if matching_service:
        matching_service.close()
        
    if personality_service:
        personality_service.close()
        
    if engagement_service:
        engagement_service.close()
        
    if recommendation_service:
        recommendation_service.close()
    
    logger.info("AI Engine services cleaned up successfully")

# Middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log request information and timing"""
    start_time = time.time()
    
    # Log the incoming request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        # Process the request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} in {process_time:.4f}s")
        
        # Add timing header
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        return response
    except Exception as e:
        # Log error and return a 500 response
        process_time = time.time() - start_time
        logger.error(f"Error processing request: {str(e)} in {process_time:.4f}s")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Error handlers
@app.exception_handler(ModelTimeoutError)
@app.exception_handler(ModelAuthenticationError)
@app.exception_handler(ModelRateLimitError)
@app.exception_handler(ModelContentFilterError)
@app.exception_handler(ModelAdapterError)
async def handle_model_error(exc: Exception, request: Request):
    """Convert model-specific errors to appropriate HTTP responses"""
    logger.error(f"Model error: {str(exc)} for {request.method} {request.url.path}")
    
    if isinstance(exc, ModelTimeoutError):
        status_code = 504  # Gateway Timeout
        error_type = "timeout"
    elif isinstance(exc, ModelAuthenticationError):
        status_code = 401  # Unauthorized
        error_type = "authentication"
    elif isinstance(exc, ModelRateLimitError):
        status_code = 429  # Too Many Requests
        error_type = "rate_limit"
    elif isinstance(exc, ModelContentFilterError):
        status_code = 422  # Unprocessable Entity
        error_type = "content_filter"
    else:
        status_code = 500  # Internal Server Error
        error_type = "model_error"
    
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": str(exc),
            "error_type": error_type,
            "operation": getattr(exc, "operation", None),
            "model_name": getattr(exc, "model_name", None)
        }
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Check if the service is healthy"""
    services_status = {
        "matching_service": matching_service is not None,
        "personality_service": personality_service is not None,
        "engagement_service": engagement_service is not None,
        "recommendation_service": recommendation_service is not None
    }
    
    all_services_healthy = all(services_status.values())
    
    return {
        "status": "healthy" if all_services_healthy else "degraded",
        "services": services_status,
        "environment": ENV
    }

# Model information endpoint
@app.get("/models", tags=["Models"])
async def get_models():
    """Get available models and their capabilities"""
    from .config.settings import MODEL_CONFIGS
    
    models = {}
    for model_name, config in MODEL_CONFIGS.items():
        models[model_name] = {
            "capabilities": config.get("capabilities", []),
            "context_window": config.get("context_window", 0),
            "is_default": model_name == DEFAULT_MODEL
        }
    
    return {
        "models": models,
        "default_model": DEFAULT_MODEL
    }

# Matching endpoints
@app.post("/matching", tags=["Matching"])
async def perform_matching(request: MatchingRequest):
    """Perform AI-powered matching operation"""
    logger.info(f"Matching request: {request.matching_type}")
    
    try:
        result = matching_service.perform_matching(
            matching_type=request.matching_type,
            data=request.data,
            options=request.options,
            model_name=request.model_name
        )
        return result
    except Exception as e:
        logger.error(f"Error in matching: {str(e)}")
        raise

@app.post("/matching/batch", tags=["Matching"])
async def batch_perform_matching(requests: List[MatchingRequest]):
    """Perform batch matching operations"""
    logger.info(f"Batch matching request with {len(requests)} items")
    
    try:
        batch_data = [
            {
                "matching_type": request.matching_type,
                "data": request.data,
                "options": request.options,
                "model_name": request.model_name
            }
            for request in requests
        ]
        
        results = matching_service.batch_perform_matching(batch_data)
        return results
    except Exception as e:
        logger.error(f"Error in batch matching: {str(e)}")
        raise

# Personality analysis endpoint
@app.post("/personality", tags=["Personality"])
async def analyze_personality(request: PersonalityRequest):
    """Analyze personality based on assessment data"""
    logger.info(f"Personality analysis request: {request.analysis_type}")
    
    try:
        result = personality_service.analyze_personality(
            assessment_data=request.assessment_data,
            analysis_type=request.analysis_type,
            options=request.options,
            model_name=request.model_name
        )
        return result
    except Exception as e:
        logger.error(f"Error in personality analysis: {str(e)}")
        raise

# Engagement endpoint
@app.post("/engagement", tags=["Engagement"])
async def generate_engagement(request: EngagementRequest):
    """Generate engagement prompts and challenges"""
    logger.info(f"Engagement generation request: {request.engagement_type}")
    
    try:
        result = engagement_service.generate_engagement(
            engagement_type=request.engagement_type,
            context=request.context,
            options=request.options,
            model_name=request.model_name
        )
        return result
    except Exception as e:
        logger.error(f"Error in engagement generation: {str(e)}")
        raise

# Recommendations endpoint
@app.post("/recommendations", tags=["Recommendations"])
async def generate_recommendations(request: RecommendationRequest):
    """Generate personalized recommendations"""
    logger.info(f"Recommendation request: {request.recommendation_type}")
    
    try:
        result = recommendation_service.generate_recommendations(
            recommendation_type=request.recommendation_type,
            user_data=request.user_data,
            context=request.context,
            options=request.options,
            model_name=request.model_name
        )
        return result
    except Exception as e:
        logger.error(f"Error in recommendation generation: {str(e)}")
        raise

# Main function to run the application
def main():
    """Run the FastAPI application with Uvicorn"""
    # Configure logging
    configure_logging(LOG_LEVEL)
    
    # Get host and port from environment variables or use defaults
    host = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_ENGINE_PORT", "8000"))
    
    # Run the FastAPI application with Uvicorn
    logger.info(f"Starting AI Engine server at http://{host}:{port}")
    try:
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=DEBUG,
            log_level=LOG_LEVEL.lower()
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")

# Configure logging
configure_logging(LOG_LEVEL)

# Include API routers
from .routes import matching_router, personality_router, engagement_router, recommendation_router

app.include_router(matching_router)
app.include_router(personality_router)
app.include_router(engagement_router)
app.include_router(recommendation_router)

# Initialize services
matching_service = create_matching_service()
personality_service = create_personality_service()
engagement_service = create_engagement_service()
recommendation_service = create_recommendation_service()

if __name__ == "__main__":
    main()