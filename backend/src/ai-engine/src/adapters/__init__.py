"""
Adapter module for AI model integrations.

Provides unified access to AI models from different providers through a standardized interface.
"""

from .model_adapter import (
    ModelAdapter,
    ModelAdapterError,
    ModelTimeoutError,
    ModelAuthenticationError,
    ModelRateLimitError,
    ModelContentFilterError,
    create_model_adapter
)
from .openrouter_adapter import OpenRouterAdapter

__all__ = [
    'ModelAdapter',
    'ModelAdapterError',
    'ModelTimeoutError',
    'ModelAuthenticationError',
    'ModelRateLimitError',
    'ModelContentFilterError',
    'OpenRouterAdapter',
    'create_model_adapter',
]