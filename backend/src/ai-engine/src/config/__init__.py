import os
import logging
import logging.handlers
from .settings import ENV, DEBUG, LOG_LEVEL

def configure_logging():
    """
    Configure logging for the AI Engine service
    
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(__name__)
    
    # Set log level from settings
    log_level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Create formatter with timestamp, level, and message
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    
    # Create console handler for logging output
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Add file handler if LOG_FILE is specified in settings
    from .settings import LOG_FILE
    if LOG_FILE:
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_FILE,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    # Prevent propagation to root logger to avoid duplicate logs
    logger.propagate = False
    
    return logger

# Initialize logger on module import
logger = configure_logging()

# Import settings for use throughout the application
from . import settings