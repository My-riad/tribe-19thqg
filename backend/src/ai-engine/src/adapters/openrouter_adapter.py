import requests
import aiohttp
import logging
import json
import asyncio
import time
import uuid
from typing import Dict, List, Any, Optional

from .model_adapter import (
    ModelAdapter, 
    ModelAdapterError, 
    ModelTimeoutError, 
    ModelAuthenticationError, 
    ModelRateLimitError, 
    ModelContentFilterError
)
from ..config.settings import (
    OPENROUTER_API_KEY, 
    OPENROUTER_API_URL, 
    MODEL_TIMEOUT,
    MODEL_CONFIGS
)

# Set up module logger
logger = logging.getLogger(__name__)


class OpenRouterAdapter(ModelAdapter):
    """Adapter for interacting with OpenRouter API to access various AI models"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the OpenRouter adapter with configuration
        
        Args:
            config: Configuration dictionary, may include:
                - api_key: OpenRouter API key
                - api_url: OpenRouter API base URL
                - timeout: Request timeout in seconds
                - max_retries: Maximum number of retry attempts
                - retry_delay: Delay between retries in seconds
        """
        super().__init__(config)
        self.provider_name = 'openrouter'
        
        # Extract configuration
        self.api_key = config.get('api_key', OPENROUTER_API_KEY)
        self.api_url = config.get('api_url', OPENROUTER_API_URL)
        self.timeout = config.get('timeout', MODEL_TIMEOUT)
        self.max_retries = config.get('max_retries', 3)
        self.retry_delay = config.get('retry_delay', 1.0)
        
        # Validate API key
        if not self.api_key:
            raise ValueError("OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide in config.")
        
        # Initialize HTTP session for reuse
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://tribe.app',
            'X-Title': 'Tribe App'
        })
        
        # Async session (initialized on demand)
        self.async_session = None
        
        logger.info(f"Initialized OpenRouter adapter (timeout: {self.timeout}s, max_retries: {self.max_retries})")
    
    def generate_text(self, prompt: str, model_name: Optional[str] = None, 
                     parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text based on a prompt using OpenRouter API
        
        Args:
            prompt: The input text prompt
            model_name: The name of the model to use
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
        # Prepare prompt and parameters
        prepared_prompt = self.prepare_prompt(prompt, model_name)
        prepared_params = self.prepare_parameters(parameters, model_name)
        
        # Generate a unique request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Log the request
        logger.debug(f"Text generation request {request_id} with model {model_name or 'default'}: '{prepared_prompt[:50]}...'")
        
        # Construct request URL
        url = f"{self.api_url}/api/v1/completions"
        
        # Prepare payload
        payload = {
            "model": model_name,
            "prompt": prepared_prompt,
            **prepared_params
        }
        
        # Set up timeout and retry counters
        timeout = self.timeout
        retries = 0
        
        # Attempt the request with retries
        while True:
            try:
                response = self.session.post(url, json=payload, timeout=timeout)
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                
                # Extract generated text
                if 'choices' in result and len(result['choices']) > 0:
                    text = result['choices'][0].get('text', '')
                    logger.debug(f"Text generation successful for request {request_id}: '{text[:50]}...'")
                    return text
                else:
                    raise ModelAdapterError("Invalid response format from OpenRouter API", 
                                           "generate_text", model_name or "default")
                
            except Exception as error:
                retries += 1
                if retries <= self.max_retries:
                    logger.warning(f"Request {request_id} failed (attempt {retries}/{self.max_retries}), retrying in {self.retry_delay}s: {str(error)}")
                    time.sleep(self.retry_delay * retries)  # Exponential backoff
                    continue
                else:
                    # Handle the error after max retries
                    self.handle_error(error, "generate_text", model_name or "default")
    
    def generate_chat_completion(self, messages: List[Dict[str, str]], 
                               model_name: Optional[str] = None,
                               parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a response based on a conversation history using OpenRouter API
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_name: The name of the model to use
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Chat completion response dictionary with format:
            {
                "message": {
                    "role": "assistant",
                    "content": "Generated response"
                },
                "usage": {
                    "prompt_tokens": int,
                    "completion_tokens": int,
                    "total_tokens": int
                },
                "metadata": {
                    "model": "model name",
                    "provider": "provider name"
                }
            }
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        # Prepare messages and parameters
        prepared_messages = self.prepare_messages(messages, model_name)
        prepared_params = self.prepare_parameters(parameters, model_name)
        
        # Generate a unique request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Log the request
        logger.debug(f"Chat completion request {request_id} with model {model_name or 'default'}: {len(prepared_messages)} messages")
        
        # Construct request URL
        url = f"{self.api_url}/api/v1/chat/completions"
        
        # Prepare payload
        payload = {
            "model": model_name,
            "messages": prepared_messages,
            **prepared_params
        }
        
        # Set up timeout and retry counters
        timeout = self.timeout
        retries = 0
        
        # Attempt the request with retries
        while True:
            try:
                response = self.session.post(url, json=payload, timeout=timeout)
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                
                # Format the response
                formatted_response = self.format_chat_response(result, model_name)
                logger.debug(f"Chat completion successful for request {request_id}: '{formatted_response['message']['content'][:50]}...'")
                return formatted_response
                
            except Exception as error:
                retries += 1
                if retries <= self.max_retries:
                    logger.warning(f"Request {request_id} failed (attempt {retries}/{self.max_retries}), retrying in {self.retry_delay}s: {str(error)}")
                    time.sleep(self.retry_delay * retries)  # Exponential backoff
                    continue
                else:
                    # Handle the error after max retries
                    self.handle_error(error, "generate_chat_completion", model_name or "default")
    
    async def async_generate_text(self, prompt: str, model_name: Optional[str] = None,
                                parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Asynchronously generate text based on a prompt using OpenRouter API
        
        Args:
            prompt: The input text prompt
            model_name: The name of the model to use
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
        # Prepare prompt and parameters
        prepared_prompt = self.prepare_prompt(prompt, model_name)
        prepared_params = self.prepare_parameters(parameters, model_name)
        
        # Generate a unique request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Log the request
        logger.debug(f"Async text generation request {request_id} with model {model_name or 'default'}: '{prepared_prompt[:50]}...'")
        
        # Ensure async session is initialized
        await self.ensure_async_session()
        
        # Construct request URL
        url = f"{self.api_url}/api/v1/completions"
        
        # Prepare payload
        payload = {
            "model": model_name,
            "prompt": prepared_prompt,
            **prepared_params
        }
        
        # Set up timeout and retry counters
        timeout = aiohttp.ClientTimeout(total=self.timeout)
        retries = 0
        
        # Attempt the request with retries
        while True:
            try:
                async with self.async_session.post(url, json=payload, timeout=timeout) as response:
                    response.raise_for_status()
                    result = await response.json()
                
                # Extract generated text
                if 'choices' in result and len(result['choices']) > 0:
                    text = result['choices'][0].get('text', '')
                    logger.debug(f"Async text generation successful for request {request_id}: '{text[:50]}...'")
                    return text
                else:
                    raise ModelAdapterError("Invalid response format from OpenRouter API", 
                                           "async_generate_text", model_name or "default")
                
            except Exception as error:
                retries += 1
                if retries <= self.max_retries:
                    logger.warning(f"Async request {request_id} failed (attempt {retries}/{self.max_retries}), retrying in {self.retry_delay}s: {str(error)}")
                    await asyncio.sleep(self.retry_delay * retries)  # Exponential backoff
                    continue
                else:
                    # Handle the error after max retries
                    self.handle_error(error, "async_generate_text", model_name or "default")
    
    async def async_generate_chat_completion(self, messages: List[Dict[str, str]],
                                           model_name: Optional[str] = None,
                                           parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Asynchronously generate a response based on a conversation history
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_name: The name of the model to use
            parameters: Optional parameters to control generation behavior
            
        Returns:
            Chat completion response dictionary with format:
            {
                "message": {
                    "role": "assistant",
                    "content": "Generated response"
                },
                "usage": {
                    "prompt_tokens": int,
                    "completion_tokens": int,
                    "total_tokens": int
                },
                "metadata": {
                    "model": "model name",
                    "provider": "provider name"
                }
            }
            
        Raises:
            ModelAdapterError: On general errors
            ModelTimeoutError: When request times out
            ModelAuthenticationError: On authentication failures
            ModelRateLimitError: When rate limits are exceeded
            ModelContentFilterError: When content is filtered
        """
        # Prepare messages and parameters
        prepared_messages = self.prepare_messages(messages, model_name)
        prepared_params = self.prepare_parameters(parameters, model_name)
        
        # Generate a unique request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Log the request
        logger.debug(f"Async chat completion request {request_id} with model {model_name or 'default'}: {len(prepared_messages)} messages")
        
        # Ensure async session is initialized
        await self.ensure_async_session()
        
        # Construct request URL
        url = f"{self.api_url}/api/v1/chat/completions"
        
        # Prepare payload
        payload = {
            "model": model_name,
            "messages": prepared_messages,
            **prepared_params
        }
        
        # Set up timeout and retry counters
        timeout = aiohttp.ClientTimeout(total=self.timeout)
        retries = 0
        
        # Attempt the request with retries
        while True:
            try:
                async with self.async_session.post(url, json=payload, timeout=timeout) as response:
                    response.raise_for_status()
                    result = await response.json()
                
                # Format the response
                formatted_response = self.format_chat_response(result, model_name)
                logger.debug(f"Async chat completion successful for request {request_id}: '{formatted_response['message']['content'][:50]}...'")
                return formatted_response
                
            except Exception as error:
                retries += 1
                if retries <= self.max_retries:
                    logger.warning(f"Async request {request_id} failed (attempt {retries}/{self.max_retries}), retrying in {self.retry_delay}s: {str(error)}")
                    await asyncio.sleep(self.retry_delay * retries)  # Exponential backoff
                    continue
                else:
                    # Handle the error after max retries
                    self.handle_error(error, "async_generate_chat_completion", model_name or "default")
    
    def handle_error(self, error: Exception, operation: str, model_name: str) -> None:
        """
        Handle errors from OpenRouter API calls
        
        Args:
            error: The exception that occurred
            operation: The operation that was being performed (e.g., "generate_text")
            model_name: The model that was being used
            
        Raises:
            ModelAdapterError: Transformed exception with additional context
        """
        logger.error(f"Error in {operation} using model {model_name}: {str(error)}")
        
        # Handle timeouts
        if isinstance(error, (requests.Timeout, asyncio.TimeoutError)) or (
            hasattr(error, '__module__') and error.__module__ == 'aiohttp.client_exceptions' and 
            error.__class__.__name__ == 'ClientTimeout'):
            raise ModelTimeoutError(str(error), operation, model_name, self.timeout)
        
        # Handle connection errors
        if isinstance(error, (requests.ConnectionError, aiohttp.ClientConnectionError)):
            raise ModelAdapterError(f"Connection error: {str(error)}", operation, model_name)
        
        # Handle HTTP errors
        if isinstance(error, (requests.HTTPError, aiohttp.ClientResponseError)) or (
            hasattr(error, 'response') and hasattr(error.response, 'status_code')):
            
            # Extract status code
            status_code = getattr(error, 'status_code', None)
            if not status_code and hasattr(error, 'response'):
                status_code = getattr(error.response, 'status_code', None)
            
            if status_code in (401, 403):
                raise ModelAuthenticationError(f"Authentication error: {str(error)}", operation, model_name)
            
            if status_code == 429:
                # Try to extract retry-after header
                retry_after = None
                if hasattr(error, 'response') and hasattr(error.response, 'headers'):
                    retry_after = error.response.headers.get('retry-after')
                    if retry_after:
                        try:
                            retry_after = int(retry_after)
                        except ValueError:
                            retry_after = None
                
                raise ModelRateLimitError(f"Rate limit exceeded: {str(error)}", 
                                          operation, model_name, retry_after)
            
            if status_code == 400:
                # Check if this is a content filter issue
                filter_reason = None
                if hasattr(error, 'response') and hasattr(error.response, 'json'):
                    try:
                        response_data = error.response.json()
                        if 'error' in response_data and 'type' in response_data['error']:
                            if response_data['error']['type'] == 'content_filter':
                                filter_reason = response_data['error'].get('message', 'Content filtered')
                                raise ModelContentFilterError(
                                    f"Content filtered: {filter_reason}", 
                                    operation, model_name, filter_reason
                                )
                    except Exception:
                        pass  # Continue with normal error handling if JSON parsing fails
            
            # Other HTTP errors
            raise ModelAdapterError(f"HTTP error {status_code}: {str(error)}", operation, model_name)
        
        # Handle other errors
        raise ModelAdapterError(str(error), operation, model_name)
    
    async def ensure_async_session(self) -> None:
        """Ensure the async HTTP session is initialized"""
        if self.async_session is None:
            self.async_session = aiohttp.ClientSession(headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://tribe.app',
                'X-Title': 'Tribe App'
            })
    
    def close(self) -> None:
        """Close resources used by the adapter"""
        if hasattr(self, 'session') and self.session:
            self.session.close()
        logger.debug(f"Closed OpenRouter adapter resources")
        super().close()
    
    async def async_close(self) -> None:
        """Asynchronously close resources used by the adapter"""
        if hasattr(self, 'async_session') and self.async_session:
            await self.async_session.close()
        logger.debug(f"Closed OpenRouter adapter resources asynchronously")
        await super().async_close()
    
    def format_response(self, response: Dict[str, Any], model_name: str) -> Dict[str, Any]:
        """
        Format the raw OpenRouter API response 
        
        Args:
            response: The raw API response
            model_name: The model that generated the response
            
        Returns:
            Formatted response with standardized structure
        """
        # Extract and format token usage if available
        usage = {}
        if 'usage' in response:
            usage = {
                'prompt_tokens': response['usage'].get('prompt_tokens', 0),
                'completion_tokens': response['usage'].get('completion_tokens', 0),
                'total_tokens': response['usage'].get('total_tokens', 0),
            }
        
        # Create standardized response
        return {
            'text': response.get('choices', [{}])[0].get('text', ''),
            'usage': usage,
            'metadata': {
                'model': response.get('model', model_name),
                'provider': self.provider_name,
                'finish_reason': response.get('choices', [{}])[0].get('finish_reason'),
            }
        }
    
    def format_chat_response(self, response: Dict[str, Any], model_name: str) -> Dict[str, Any]:
        """
        Format the raw OpenRouter API chat completion response
        
        Args:
            response: The raw API response
            model_name: The model that generated the response
            
        Returns:
            Formatted chat completion response with standardized structure
        """
        # Extract and format token usage if available
        usage = {}
        if 'usage' in response:
            usage = {
                'prompt_tokens': response['usage'].get('prompt_tokens', 0),
                'completion_tokens': response['usage'].get('completion_tokens', 0),
                'total_tokens': response['usage'].get('total_tokens', 0),
            }
        
        # Extract the assistant message
        message = {
            'role': 'assistant', 
            'content': ''
        }
        
        if 'choices' in response and len(response['choices']) > 0:
            if 'message' in response['choices'][0]:
                message = response['choices'][0]['message']
        
        # Create standardized response
        return {
            'message': message,
            'usage': usage,
            'metadata': {
                'model': response.get('model', model_name),
                'provider': self.provider_name,
                'finish_reason': response.get('choices', [{}])[0].get('finish_reason'),
            }
        }