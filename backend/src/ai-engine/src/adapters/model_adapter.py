import abc
import logging
import asyncio
from typing import Dict, List, Any, Optional, Type, Union

from ..config.settings import DEFAULT_MODEL, MODEL_CONFIGS

# Set up module logger
logger = logging.getLogger(__name__)


class ModelAdapterError(Exception):
    """Base exception class for model adapter errors"""
    
    def __init__(self, message: str, operation: str, model_name: str):
        super().__init__(message)
        self.message = message
        self.operation = operation
        self.model_name = model_name
        self.detailed_message = f"Error in {operation} using model {model_name}: {message}"


class ModelTimeoutError(ModelAdapterError):
    """Exception raised when a model request times out"""
    
    def __init__(self, message: str, operation: str, model_name: str, timeout: int):
        super().__init__(message, operation, model_name)
        self.timeout = timeout
        self.detailed_message = f"Request timed out after {timeout}s in {operation} using model {model_name}: {message}"


class ModelAuthenticationError(ModelAdapterError):
    """Exception raised when authentication with the model provider fails"""
    
    def __init__(self, message: str, operation: str, model_name: str):
        super().__init__(message, operation, model_name)
        self.detailed_message = f"Authentication error in {operation} using model {model_name}: {message}"


class ModelRateLimitError(ModelAdapterError):
    """Exception raised when rate limits are exceeded"""
    
    def __init__(self, message: str, operation: str, model_name: str, retry_after: Optional[int] = None):
        super().__init__(message, operation, model_name)
        self.retry_after = retry_after
        retry_info = f", retry after {retry_after}s" if retry_after else ""
        self.detailed_message = f"Rate limit exceeded in {operation} using model {model_name}{retry_info}: {message}"


class ModelContentFilterError(ModelAdapterError):
    """Exception raised when content is filtered by the model provider"""
    
    def __init__(self, message: str, operation: str, model_name: str, filter_reason: Optional[str] = None):
        super().__init__(message, operation, model_name)
        self.filter_reason = filter_reason
        reason_info = f" (reason: {filter_reason})" if filter_reason else ""
        self.detailed_message = f"Content filtered in {operation} using model {model_name}{reason_info}: {message}"


class ModelAdapter(abc.ABC):
    """Abstract base class defining the interface for AI model adapters"""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the model adapter with configuration"""
        self.config = config
        self.provider_name = None  # To be set by subclasses
        logger.debug(f"Initializing base model adapter")
    
    @abc.abstractmethod
    def generate_text(self, prompt: str, model_name: Optional[str] = None, 
                     parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text based on a prompt
        
        Args:
            prompt: The input text prompt
            model_name: The name of the model to use, defaults to configured DEFAULT_MODEL
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Generated text response
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        pass
    
    @abc.abstractmethod
    def generate_chat_completion(self, messages: List[Dict[str, str]], 
                               model_name: Optional[str] = None,
                               parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a response based on a conversation history
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_name: The name of the model to use, defaults to configured DEFAULT_MODEL
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Chat completion response dictionary
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        pass
    
    @abc.abstractmethod
    async def async_generate_text(self, prompt: str, model_name: Optional[str] = None,
                                parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Asynchronously generate text based on a prompt
        
        Args:
            prompt: The input text prompt
            model_name: The name of the model to use, defaults to configured DEFAULT_MODEL
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Generated text response
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        pass
    
    @abc.abstractmethod
    async def async_generate_chat_completion(self, messages: List[Dict[str, str]],
                                           model_name: Optional[str] = None,
                                           parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Asynchronously generate a response based on a conversation history
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_name: The name of the model to use, defaults to configured DEFAULT_MODEL
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Chat completion response dictionary
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        pass
    
    def prepare_prompt(self, prompt: str, model_name: Optional[str] = None) -> str:
        """Prepare and optimize a prompt for the model"""
        return prepare_prompt(prompt, model_name)
    
    def prepare_messages(self, messages: List[Dict[str, str]], 
                        model_name: Optional[str] = None) -> List[Dict[str, str]]:
        """Prepare and optimize messages for chat completion"""
        return prepare_messages(messages, model_name)
    
    def prepare_parameters(self, parameters: Optional[Dict[str, Any]], 
                          model_name: Optional[str] = None) -> Dict[str, Any]:
        """Prepare model parameters with defaults"""
        return prepare_parameters(parameters, model_name)
    
    @abc.abstractmethod
    def handle_error(self, error: Exception, operation: str, model_name: str) -> None:
        """
        Handle errors from model API calls
        
        Args:
            error: The exception that occurred
            operation: The operation that was being performed (e.g., "generate_text")
            model_name: The model that was being used
            
        Raises:
            ModelAdapterError: Transformed exception with additional context
        """
        pass
    
    def close(self) -> None:
        """Close resources used by the adapter"""
        logger.debug(f"Closing {self.provider_name} adapter")
    
    async def async_close(self) -> None:
        """Asynchronously close resources used by the adapter"""
        logger.debug(f"Closing {self.provider_name} adapter asynchronously")
    
    def __enter__(self):
        """Context manager entry method"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit method"""
        self.close()
        if exc_val:
            logger.error(f"Exception occurred in context: {exc_val}")
    
    async def __aenter__(self):
        """Async context manager entry method"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit method"""
        await self.async_close()
        if exc_val:
            logger.error(f"Exception occurred in async context: {exc_val}")


class MockModelAdapter(ModelAdapter):
    """Mock implementation of ModelAdapter for testing purposes"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the mock adapter with predefined responses
        
        Args:
            config: Configuration dictionary, which may include:
                - responses: Dictionary mapping prompts to predefined responses
                - should_fail: Boolean indicating if the adapter should simulate failures
                - failure_exception: Exception to raise when should_fail is True
        """
        super().__init__(config)
        self.provider_name = "mock"
        self._responses = config.get("responses", {})
        self._should_fail = config.get("should_fail", False)
        self._failure_exception = config.get("failure_exception", None)
        logger.debug("Initialized Mock Model Adapter")
    
    def generate_text(self, prompt: str, model_name: Optional[str] = None, 
                     parameters: Optional[Dict[str, Any]] = None) -> str:
        """Generate text based on a prompt using predefined responses"""
        if self._should_fail and self._failure_exception:
            raise self._failure_exception
        
        optimized_prompt = self.prepare_prompt(prompt, model_name)
        response = self._responses.get(optimized_prompt, f"Mock response for: {optimized_prompt}")
        
        logger.debug(f"Mock generate_text: '{optimized_prompt[:30]}...' -> '{response[:30]}...'")
        return response
    
    def generate_chat_completion(self, messages: List[Dict[str, str]], 
                               model_name: Optional[str] = None,
                               parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a response based on conversation history using predefined responses"""
        if self._should_fail and self._failure_exception:
            raise self._failure_exception
        
        optimized_messages = self.prepare_messages(messages, model_name)
        
        # Use the last user message as the key for finding responses
        last_user_message = None
        for msg in reversed(optimized_messages):
            if msg.get("role") == "user":
                last_user_message = msg.get("content")
                break
        
        response_text = self._responses.get(last_user_message, 
                                         f"Mock response for: {last_user_message}")
        
        response = {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    }
                }
            ]
        }
        
        logger.debug(f"Mock generate_chat_completion: '{last_user_message[:30]}...' -> '{response_text[:30]}...'")
        return response
    
    async def async_generate_text(self, prompt: str, model_name: Optional[str] = None,
                                parameters: Optional[Dict[str, Any]] = None) -> str:
        """Asynchronously generate text based on a prompt using predefined responses"""
        return self.generate_text(prompt, model_name, parameters)
    
    async def async_generate_chat_completion(self, messages: List[Dict[str, str]],
                                           model_name: Optional[str] = None,
                                           parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Asynchronously generate a response based on conversation history"""
        return self.generate_chat_completion(messages, model_name, parameters)
    
    def set_response(self, key: str, response: Any) -> None:
        """
        Set a predefined response for a specific prompt or message
        
        Args:
            key: The prompt or message to match
            response: The response to return when the key is matched
        """
        self._responses[key] = response
        logger.debug(f"Added mock response for key: '{key[:30]}...'")
    
    def set_failure_mode(self, should_fail: bool, exception: Optional[Exception] = None) -> None:
        """
        Configure the adapter to fail with a specific exception
        
        Args:
            should_fail: Whether the adapter should simulate failures
            exception: The exception to raise when should_fail is True
        """
        self._should_fail = should_fail
        if exception:
            self._failure_exception = exception
        logger.debug(f"Set failure mode: should_fail={should_fail}, exception={exception}")
    
    def handle_error(self, error: Exception, operation: str, model_name: str) -> None:
        """Handle errors in the mock adapter"""
        logger.error(f"Error in {operation} using model {model_name}: {str(error)}")
        raise ModelAdapterError(str(error), operation, model_name)
    
    def close(self) -> None:
        """Close resources used by the mock adapter"""
        self._responses.clear()
        super().close()
        logger.debug("Closed Mock Model Adapter")
    
    async def async_close(self) -> None:
        """Asynchronously close resources used by the mock adapter"""
        self._responses.clear()
        await super().async_close()
        logger.debug("Closed Mock Model Adapter asynchronously")


def create_model_adapter(config: Dict[str, Any]) -> ModelAdapter:
    """
    Factory function to create an appropriate model adapter based on configuration
    
    Args:
        config: Configuration dictionary, must include 'provider' key
        
    Returns:
        An instance of a concrete ModelAdapter implementation
        
    Raises:
        ValueError: If the specified provider is not supported
    """
    provider = config.get('provider', 'openrouter').lower()
    
    logger.debug(f"Creating model adapter for provider: {provider}")
    
    if provider == 'openrouter':
        # Import here to avoid circular imports
        from .openrouter_adapter import OpenRouterAdapter
        return OpenRouterAdapter(config)
    elif provider == 'mock':
        return MockModelAdapter(config)
    else:
        raise ValueError(f"Unsupported provider: {provider}. Supported providers: openrouter, mock")


def prepare_prompt(prompt: str, model_name: Optional[str] = None) -> str:
    """
    Prepare and optimize a prompt for a specific model
    
    Args:
        prompt: The input text prompt
        model_name: The name of the model to use, defaults to DEFAULT_MODEL
        
    Returns:
        Optimized prompt for the specified model
    """
    model = model_name or DEFAULT_MODEL
    
    # Get model configuration
    model_config = MODEL_CONFIGS.get(model, {})
    context_window = model_config.get('context_window', 4096)
    
    # Clean the prompt
    cleaned_prompt = prompt.strip()
    
    # Optimize based on model context window if needed
    if len(cleaned_prompt) > context_window * 0.9:  # Keep some room for the response
        # Truncate with a note
        truncated_length = int(context_window * 0.9)
        cleaned_prompt = cleaned_prompt[:truncated_length] + "\n[Note: prompt has been truncated to fit model context window]"
    
    return cleaned_prompt


def prepare_messages(messages: List[Dict[str, str]], model_name: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Prepare and optimize a list of messages for chat completion
    
    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model_name: The name of the model to use, defaults to DEFAULT_MODEL
        
    Returns:
        Optimized messages for the specified model
        
    Raises:
        ValueError: If messages format is invalid
    """
    model = model_name or DEFAULT_MODEL
    
    # Validate messages format
    if not isinstance(messages, list):
        raise ValueError("Messages must be a list")
    
    for msg in messages:
        if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
            raise ValueError("Each message must be a dict with 'role' and 'content' keys")
    
    # Get model configuration
    model_config = MODEL_CONFIGS.get(model, {})
    context_window = model_config.get('context_window', 4096)
    
    # Make a copy to avoid modifying the original
    optimized_messages = messages.copy()
    
    # Ensure we don't exceed the context window
    total_length = sum(len(msg.get('content', '')) for msg in optimized_messages)
    
    if total_length > context_window * 0.9:
        # Strategy: Keep system message, truncate oldest user/assistant messages
        system_messages = [msg for msg in optimized_messages if msg.get('role') == 'system']
        other_messages = [msg for msg in optimized_messages if msg.get('role') != 'system']
        
        # Keep system messages intact
        system_length = sum(len(msg.get('content', '')) for msg in system_messages)
        remaining_length = int(context_window * 0.9) - system_length
        
        # Start removing or truncating from oldest messages
        while other_messages and remaining_length <= 0:
            other_messages.pop(0)  # Remove oldest message
            remaining_length = int(context_window * 0.9) - system_length - sum(len(msg.get('content', '')) for msg in other_messages)
        
        # If we still need to truncate, truncate the oldest message
        if other_messages and remaining_length < sum(len(msg.get('content', '')) for msg in other_messages):
            oldest_msg = other_messages[0]
            content = oldest_msg['content']
            truncated_content = content[:remaining_length - (sum(len(msg.get('content', '')) for msg in other_messages[1:]))]
            oldest_msg['content'] = truncated_content + "\n[Note: message has been truncated to fit model context window]"
        
        # Reconstruct messages
        optimized_messages = system_messages + other_messages
    
    # Ensure there's a system message if the model requires it
    has_system = any(msg.get('role') == 'system' for msg in optimized_messages)
    if not has_system and model.startswith('anthropic/'):
        # Claude models often work better with a system message
        optimized_messages.insert(0, {
            'role': 'system',
            'content': 'You are a helpful AI assistant for the Tribe platform, which helps people form meaningful local connections.'
        })
    
    return optimized_messages


def prepare_parameters(parameters: Optional[Dict[str, Any]], model_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Prepare model parameters with defaults from configuration
    
    Args:
        parameters: User-provided parameters to override defaults
        model_name: The name of the model to use, defaults to DEFAULT_MODEL
        
    Returns:
        Prepared parameters with defaults applied
    """
    model = model_name or DEFAULT_MODEL
    model_config = MODEL_CONFIGS.get(model, {})
    
    # Start with default parameters from model config
    prepared_params = model_config.copy()
    
    # Remove non-parameter keys
    for key in ['context_window', 'capabilities']:
        if key in prepared_params:
            del prepared_params[key]
    
    # Update with user-provided parameters
    if parameters:
        prepared_params.update(parameters)
    
    # Validate parameters are within acceptable ranges
    if 'temperature' in prepared_params and not 0 <= prepared_params['temperature'] <= 2:
        prepared_params['temperature'] = max(0, min(prepared_params['temperature'], 2))
    
    if 'top_p' in prepared_params and not 0 < prepared_params['top_p'] <= 1:
        prepared_params['top_p'] = max(0.01, min(prepared_params['top_p'], 1))
    
    return prepared_params