import unittest
from unittest.mock import patch, MagicMock
import pytest
import requests
import aiohttp
import asyncio
import time

from ..src.adapters.model_adapter import (
    ModelAdapter, 
    MockModelAdapter, 
    ModelAdapterError, 
    ModelTimeoutError, 
    ModelAuthenticationError, 
    ModelRateLimitError, 
    ModelContentFilterError,
    create_model_adapter
)
from ..src.adapters.openrouter_adapter import OpenRouterAdapter
from ..src.config.settings import DEFAULT_MODEL, MODEL_CONFIGS


class TestModelAdapter(unittest.TestCase):
    """Test cases for the abstract ModelAdapter class and factory function"""

    def test_create_model_adapter_openrouter(self):
        """Test creating an OpenRouterAdapter instance"""
        config = {'provider': 'openrouter', 'api_key': 'test_key'}
        adapter = create_model_adapter(config)
        self.assertIsInstance(adapter, OpenRouterAdapter)
        self.assertEqual(adapter.provider_name, 'openrouter')

    def test_create_model_adapter_mock(self):
        """Test creating a MockModelAdapter instance"""
        config = {'provider': 'mock'}
        adapter = create_model_adapter(config)
        self.assertIsInstance(adapter, MockModelAdapter)
        self.assertEqual(adapter.provider_name, 'mock')

    def test_create_model_adapter_default(self):
        """Test creating an adapter with default provider"""
        config = {'api_key': 'test_key'}
        adapter = create_model_adapter(config)
        self.assertIsInstance(adapter, OpenRouterAdapter)
        self.assertEqual(adapter.provider_name, 'openrouter')

    def test_create_model_adapter_invalid(self):
        """Test creating an adapter with invalid provider"""
        config = {'provider': 'invalid'}
        with self.assertRaises(ValueError) as context:
            create_model_adapter(config)
        self.assertIn('Supported providers', str(context.exception))


class TestMockModelAdapter(unittest.TestCase):
    """Test cases for the MockModelAdapter implementation"""

    def setUp(self):
        """Set up test environment"""
        self.config = {'provider': 'mock'}
        self.adapter = MockModelAdapter(self.config)

    def test_generate_text(self):
        """Test generating text with MockModelAdapter"""
        test_prompt = "Test prompt"
        test_response = "Test response"
        self.adapter.set_response(test_prompt, test_response)
        
        response = self.adapter.generate_text(test_prompt)
        self.assertEqual(response, test_response)

    def test_generate_text_default_response(self):
        """Test generating text without a predefined response"""
        test_prompt = "Unknown prompt"
        response = self.adapter.generate_text(test_prompt)
        
        self.assertTrue(response)  # Should return a non-empty string
        self.assertIn(test_prompt, response)  # Default response contains the prompt

    def test_generate_chat_completion(self):
        """Test generating chat completion with MockModelAdapter"""
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello, who are you?"}
        ]
        
        self.adapter.set_response("Hello, who are you?", "I am a helpful AI assistant.")
        
        response = self.adapter.generate_chat_completion(messages)
        self.assertIn("choices", response)
        self.assertIn("message", response["choices"][0])
        self.assertEqual(response["choices"][0]["message"]["content"], "I am a helpful AI assistant.")

    def test_generate_chat_completion_default_response(self):
        """Test generating chat completion without a predefined response"""
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Tell me something interesting"}
        ]
        
        response = self.adapter.generate_chat_completion(messages)
        self.assertIn("choices", response)
        self.assertIn("message", response["choices"][0])
        self.assertIn("Tell me something interesting", response["choices"][0]["message"]["content"])

    def test_async_generate_text(self):
        """Test asynchronously generating text with MockModelAdapter"""
        test_prompt = "Async test prompt"
        test_response = "Async test response"
        self.adapter.set_response(test_prompt, test_response)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(self.adapter.async_generate_text(test_prompt))
        self.assertEqual(response, test_response)
        
        loop.close()

    def test_async_generate_chat_completion(self):
        """Test asynchronously generating chat completion with MockModelAdapter"""
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello async"}
        ]
        
        self.adapter.set_response("Hello async", "Async response")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(self.adapter.async_generate_chat_completion(messages))
        self.assertIn("choices", response)
        self.assertEqual(response["choices"][0]["message"]["content"], "Async response")
        
        loop.close()

    def test_set_failure_mode(self):
        """Test setting failure mode on MockModelAdapter"""
        custom_exception = ValueError("Test failure")
        
        # Set failure mode
        self.adapter.set_failure_mode(True, custom_exception)
        
        # Verify generate_text raises the exception
        with self.assertRaises(ValueError) as context:
            self.adapter.generate_text("test")
        self.assertEqual(str(context.exception), "Test failure")
        
        # Verify generate_chat_completion raises the exception
        with self.assertRaises(ValueError) as context:
            self.adapter.generate_chat_completion([{"role": "user", "content": "test"}])
        self.assertEqual(str(context.exception), "Test failure")
        
        # Reset failure mode
        self.adapter.set_failure_mode(False)
        
        # Verify normal operation is restored
        response = self.adapter.generate_text("test")
        self.assertTrue(response)

    def test_context_manager(self):
        """Test using MockModelAdapter as a context manager"""
        with self.adapter as adapter:
            # Test operations inside context
            response = adapter.generate_text("test")
            self.assertTrue(response)
        
        # Adapter should be closed now
        self.assertEqual(len(self.adapter._responses), 0)  # Responses should be cleared

    def test_async_context_manager(self):
        """Test using MockModelAdapter as an async context manager"""
        async def test_async_context():
            async with self.adapter as adapter:
                # Test operations inside context
                response = await adapter.async_generate_text("test")
                self.assertTrue(response)
            
            # Adapter should be closed now
            self.assertEqual(len(self.adapter._responses), 0)  # Responses should be cleared
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(test_async_context())
        loop.close()


class TestOpenRouterAdapter(unittest.TestCase):
    """Test cases for the OpenRouterAdapter implementation"""

    def setUp(self):
        """Set up test fixtures before each test"""
        self.config = {'provider': 'openrouter', 'api_key': 'test_key'}
        
        # Mock responses
        self.mock_completion_response = {
            "id": "cmpl-123",
            "object": "text_completion",
            "created": 1598069254,
            "model": "gpt-3.5-turbo",
            "choices": [
                {
                    "text": "This is a mock response",
                    "index": 0,
                    "finish_reason": "length"
                }
            ],
            "usage": {
                "prompt_tokens": 5,
                "completion_tokens": 7,
                "total_tokens": 12
            }
        }
        
        self.mock_chat_completion_response = {
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1598069254,
            "model": "gpt-3.5-turbo",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "This is a mock chat response"
                    },
                    "index": 0,
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 8,
                "total_tokens": 18
            }
        }
        
        # Set up patches
        self.requests_patch = patch('requests.Session')
        self.aiohttp_patch = patch('aiohttp.ClientSession')
        
        # Start patches
        self.mock_requests_session = self.requests_patch.start()
        self.mock_aiohttp_session = self.aiohttp_patch.start()

    def tearDown(self):
        """Clean up test fixtures after each test"""
        self.requests_patch.stop()
        self.aiohttp_patch.stop()

    def test_initialization(self):
        """Test initializing OpenRouterAdapter"""
        adapter = OpenRouterAdapter(self.config)
        self.assertEqual(adapter.provider_name, 'openrouter')
        self.assertEqual(adapter.api_key, 'test_key')
        self.assertTrue(hasattr(adapter, 'api_url'))
        self.assertTrue(hasattr(adapter, 'session'))

    def test_initialization_missing_api_key(self):
        """Test initialization with missing API key"""
        config = {'provider': 'openrouter'}
        with self.assertRaises(ValueError) as context:
            OpenRouterAdapter(config)
        self.assertIn('API key is required', str(context.exception))

    @patch('requests.Session.post')
    def test_generate_text(self, mock_post):
        """Test generating text with OpenRouterAdapter"""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_completion_response
        mock_post.return_value = mock_response
        
        adapter = OpenRouterAdapter(self.config)
        response = adapter.generate_text("Test prompt")
        
        # Verify correct URL and payload used
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        payload = mock_post.call_args[1]['json']
        
        self.assertIn("/api/v1/completions", url)
        self.assertEqual(payload["prompt"], "Test prompt")
        
        # Check response
        self.assertEqual(response, "This is a mock response")

    @patch('requests.Session.post')
    def test_generate_chat_completion(self, mock_post):
        """Test generating chat completion with OpenRouterAdapter"""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_chat_completion_response
        mock_post.return_value = mock_response
        
        adapter = OpenRouterAdapter(self.config)
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello, who are you?"}
        ]
        
        response = adapter.generate_chat_completion(messages)
        
        # Verify correct URL and payload used
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        payload = mock_post.call_args[1]['json']
        
        self.assertIn("/api/v1/chat/completions", url)
        self.assertEqual(len(payload["messages"]), 2)
        
        # Check response format
        self.assertIn("message", response)
        self.assertEqual(response["message"]["content"], "This is a mock chat response")
        self.assertIn("usage", response)
        self.assertIn("metadata", response)

    @patch('aiohttp.ClientSession.post')
    def test_async_generate_text(self, mock_post):
        """Test asynchronously generating text with OpenRouterAdapter"""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json = asyncio.coroutine(lambda: self.mock_completion_response)
        mock_response.__aenter__.return_value = mock_response
        mock_post.return_value = mock_response
        
        adapter = OpenRouterAdapter(self.config)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(adapter.async_generate_text("Test prompt"))
        
        # Verify correct URL and payload used
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        payload = mock_post.call_args[1]['json']
        
        self.assertIn("/api/v1/completions", url)
        self.assertEqual(payload["prompt"], "Test prompt")
        
        # Check response
        self.assertEqual(response, "This is a mock response")
        
        loop.close()

    @patch('aiohttp.ClientSession.post')
    def test_async_generate_chat_completion(self, mock_post):
        """Test asynchronously generating chat completion with OpenRouterAdapter"""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json = asyncio.coroutine(lambda: self.mock_chat_completion_response)
        mock_response.__aenter__.return_value = mock_response
        mock_post.return_value = mock_response
        
        adapter = OpenRouterAdapter(self.config)
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello, who are you?"}
        ]
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(adapter.async_generate_chat_completion(messages))
        
        # Verify correct URL and payload used
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        payload = mock_post.call_args[1]['json']
        
        self.assertIn("/api/v1/chat/completions", url)
        self.assertEqual(len(payload["messages"]), 2)
        
        # Check response format
        self.assertIn("message", response)
        self.assertEqual(response["message"]["content"], "This is a mock chat response")
        self.assertIn("usage", response)
        self.assertIn("metadata", response)
        
        loop.close()

    def test_handle_error_timeout(self):
        """Test handling timeout errors"""
        adapter = OpenRouterAdapter(self.config)
        
        # Test requests.Timeout
        timeout_error = requests.Timeout("Request timed out")
        with self.assertRaises(ModelTimeoutError):
            adapter.handle_error(timeout_error, "generate_text", "gpt-3.5-turbo")
        
        # Test aiohttp.ClientTimeout
        client_timeout = aiohttp.ClientTimeout(total=10)  # Creating a ClientTimeout object
        with self.assertRaises(ModelTimeoutError):
            adapter.handle_error(client_timeout, "generate_text", "gpt-3.5-turbo")

    def test_handle_error_authentication(self):
        """Test handling authentication errors"""
        adapter = OpenRouterAdapter(self.config)
        
        # Create mock response for 401
        mock_response = MagicMock()
        mock_response.status_code = 401
        
        # Create HTTPError with the mock response
        http_error_401 = requests.HTTPError("Unauthorized", response=mock_response)
        with self.assertRaises(ModelAuthenticationError):
            adapter.handle_error(http_error_401, "generate_text", "gpt-3.5-turbo")
        
        # Test 403 error
        mock_response.status_code = 403
        http_error_403 = requests.HTTPError("Forbidden", response=mock_response)
        with self.assertRaises(ModelAuthenticationError):
            adapter.handle_error(http_error_403, "generate_text", "gpt-3.5-turbo")

    def test_handle_error_rate_limit(self):
        """Test handling rate limit errors"""
        adapter = OpenRouterAdapter(self.config)
        
        # Create mock response with 429 status code and retry-after header
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {'retry-after': '30'}
        
        http_error = requests.HTTPError("Too Many Requests", response=mock_response)
        with self.assertRaises(ModelRateLimitError) as context:
            adapter.handle_error(http_error, "generate_text", "gpt-3.5-turbo")
        
        # Verify retry-after information is captured
        self.assertEqual(context.exception.retry_after, 30)

    def test_handle_error_content_filter(self):
        """Test handling content filter errors"""
        adapter = OpenRouterAdapter(self.config)
        
        # Create mock response with 400 status code and content filter message
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'error': {
                'type': 'content_filter',
                'message': 'Content violates usage policies'
            }
        }
        
        http_error = requests.HTTPError("Bad Request", response=mock_response)
        with self.assertRaises(ModelContentFilterError) as context:
            adapter.handle_error(http_error, "generate_text", "gpt-3.5-turbo")
        
        # Verify filter reason is captured
        self.assertEqual(context.exception.filter_reason, 'Content violates usage policies')

    def test_format_response(self):
        """Test formatting raw API responses"""
        adapter = OpenRouterAdapter(self.config)
        
        formatted_response = adapter.format_response(self.mock_completion_response, "gpt-3.5-turbo")
        
        # Verify the response structure
        self.assertIn('text', formatted_response)
        self.assertIn('usage', formatted_response)
        self.assertIn('metadata', formatted_response)
        
        # Verify content
        self.assertEqual(formatted_response['text'], "This is a mock response")
        self.assertEqual(formatted_response['usage']['total_tokens'], 12)
        self.assertEqual(formatted_response['metadata']['model'], "gpt-3.5-turbo")
        self.assertEqual(formatted_response['metadata']['provider'], "openrouter")

    def test_format_chat_response(self):
        """Test formatting raw chat API responses"""
        adapter = OpenRouterAdapter(self.config)
        
        formatted_response = adapter.format_chat_response(self.mock_chat_completion_response, "gpt-3.5-turbo")
        
        # Verify the response structure
        self.assertIn('message', formatted_response)
        self.assertIn('usage', formatted_response)
        self.assertIn('metadata', formatted_response)
        
        # Verify content
        self.assertEqual(formatted_response['message']['role'], "assistant")
        self.assertEqual(formatted_response['message']['content'], "This is a mock chat response")
        self.assertEqual(formatted_response['usage']['total_tokens'], 18)
        self.assertEqual(formatted_response['metadata']['model'], "gpt-3.5-turbo")
        self.assertEqual(formatted_response['metadata']['provider'], "openrouter")

    @patch('requests.Session.post')
    @patch('time.sleep')
    def test_retry_logic(self, mock_sleep, mock_post):
        """Test retry logic for transient errors"""
        # First call fails with a transient error, second call succeeds
        mock_error_response = MagicMock()
        mock_error_response.raise_for_status.side_effect = requests.ConnectionError("Connection failed")
        
        mock_success_response = MagicMock()
        mock_success_response.json.return_value = self.mock_completion_response
        
        mock_post.side_effect = [mock_error_response, mock_success_response]
        
        adapter = OpenRouterAdapter(self.config)
        response = adapter.generate_text("Test prompt")
        
        # Verify the post method was called twice (initial + retry)
        self.assertEqual(mock_post.call_count, 2)
        
        # Verify sleep was called for backoff
        mock_sleep.assert_called_once()
        
        # Verify final response is successful
        self.assertEqual(response, "This is a mock response")

    @patch('requests.Session.close')
    def test_context_manager(self, mock_close):
        """Test using OpenRouterAdapter as a context manager"""
        with OpenRouterAdapter(self.config) as adapter:
            # Test operations inside context
            self.assertEqual(adapter.provider_name, 'openrouter')
        
        # Verify session was closed
        mock_close.assert_called_once()

    @patch('aiohttp.ClientSession.close')
    def test_async_context_manager(self, mock_close):
        """Test using OpenRouterAdapter as an async context manager"""
        mock_close.return_value = asyncio.Future()
        mock_close.return_value.set_result(None)
        
        async def test_async_context():
            async with OpenRouterAdapter(self.config) as adapter:
                # Test operations inside context
                self.assertEqual(adapter.provider_name, 'openrouter')
                await adapter.ensure_async_session()  # Create async session
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(test_async_context())
        
        # Verify session was closed
        mock_close.assert_called_once()
        
        loop.close()