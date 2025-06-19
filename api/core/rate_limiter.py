"""
Rate limiting implementation for the STL Analysis API.

This module provides rate limiting functionality using Redis (preferred) or in-memory storage.
It includes different rate limits for different endpoints and user types.
"""

import time
import asyncio
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
import logging
from functools import wraps
import redis.asyncio as redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)

# Color codes for logging
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

class RateLimiter:
    """
    Rate limiter implementation with Redis support and fallback to in-memory storage.
    
    Features:
    - Redis-based rate limiting (preferred)
    - In-memory fallback
    - Different limits for different endpoints
    - User-based rate limiting
    - Comprehensive logging with colors
    """
    
    def __init__(self, redis_url: Optional[str] = None, fallback_to_memory: bool = True):
        """
        Initialize the rate limiter.
        
        Args:
            redis_url: Redis connection URL (optional)
            fallback_to_memory: Whether to fallback to in-memory storage
        """
        self.redis_url = redis_url
        self.fallback_to_memory = fallback_to_memory
        self.redis_client: Optional[redis.Redis] = None
        self.memory_storage: Dict[str, list] = {}
        
        # Rate limit configurations
        self.rate_limits = {
            'default': {'requests': 100, 'window': 3600},  # 100 requests per hour
            'upload': {'requests': 10, 'window': 3600},    # 10 uploads per hour
            'analysis': {'requests': 50, 'window': 3600},  # 50 analysis requests per hour
            'electroplating': {'requests': 30, 'window': 3600},  # 30 electroplating calculations per hour
            'admin': {'requests': 1000, 'window': 3600},   # 1000 requests per hour for admin
        }
        
        self._setup_redis()
    
    def _setup_redis(self):
        """Setup Redis connection if available."""
        if self.redis_url:
            try:
                self.redis_client = redis.from_url(self.redis_url)
                logger.info(f"{Colors.GREEN}✓{Colors.END} {Colors.BOLD}RateLimiter{Colors.END}: Redis connection established")
            except Exception as e:
                logger.warning(f"{Colors.YELLOW}⚠{Colors.END} {Colors.BOLD}RateLimiter{Colors.END}: Redis connection failed: {e}")
                self.redis_client = None
        
        if not self.redis_client and self.fallback_to_memory:
            logger.info(f"{Colors.BLUE}ℹ{Colors.END} {Colors.BOLD}RateLimiter{Colors.END}: Using in-memory rate limiting")
    
    async def _get_redis_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting."""
        return f"rate_limit:{identifier}:{endpoint}"
    
    async def _check_redis_rate_limit(self, identifier: str, endpoint: str, limit_config: Dict) -> Tuple[bool, Dict]:
        """
        Check rate limit using Redis.
        
        Args:
            identifier: User identifier (IP, user ID, etc.)
            endpoint: API endpoint
            limit_config: Rate limit configuration
            
        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        if not self.redis_client:
            return True, {}
        
        try:
            key = await self._get_redis_key(identifier, endpoint)
            current_time = int(time.time())
            window_start = current_time - limit_config['window']
            
            # Get current requests in window
            async with self.redis_client.pipeline() as pipe:
                await pipe.zremrangebyscore(key, 0, window_start)
                await pipe.zcard(key)
                await pipe.zadd(key, {str(current_time): current_time})
                await pipe.expire(key, limit_config['window'])
                results = await pipe.execute()
            
            current_requests = results[1]
            allowed = current_requests < limit_config['requests']
            
            rate_limit_info = {
                'limit': limit_config['requests'],
                'remaining': max(0, limit_config['requests'] - current_requests),
                'reset_time': current_time + limit_config['window'],
                'window': limit_config['window']
            }
            
            logger.debug(f"{Colors.CYAN}🔍{Colors.END} {Colors.BOLD}RateLimiter._check_redis_rate_limit{Colors.END}: "
                        f"Identifier: {identifier}, Endpoint: {endpoint}, "
                        f"Current: {current_requests}, Limit: {limit_config['requests']}, Allowed: {allowed}")
            
            return allowed, rate_limit_info
            
        except Exception as e:
            logger.error(f"{Colors.RED}❌{Colors.END} {Colors.BOLD}RateLimiter._check_redis_rate_limit{Colors.END}: "
                        f"Redis error: {e}")
            return True, {}
    
    def _check_memory_rate_limit(self, identifier: str, endpoint: str, limit_config: Dict) -> Tuple[bool, Dict]:
        """
        Check rate limit using in-memory storage.
        
        Args:
            identifier: User identifier (IP, user ID, etc.)
            endpoint: API endpoint
            limit_config: Rate limit configuration
            
        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        key = f"{identifier}:{endpoint}"
        current_time = time.time()
        window_start = current_time - limit_config['window']
        
        # Clean old entries
        if key in self.memory_storage:
            self.memory_storage[key] = [
                timestamp for timestamp in self.memory_storage[key]
                if timestamp > window_start
            ]
        else:
            self.memory_storage[key] = []
        
        # Check if limit exceeded
        current_requests = len(self.memory_storage[key])
        allowed = current_requests < limit_config['requests']
        
        if allowed:
            self.memory_storage[key].append(current_time)
        
        rate_limit_info = {
            'limit': limit_config['requests'],
            'remaining': max(0, limit_config['requests'] - current_requests),
            'reset_time': int(current_time + limit_config['window']),
            'window': limit_config['window']
        }
        
        logger.debug(f"{Colors.CYAN}🔍{Colors.END} {Colors.BOLD}RateLimiter._check_memory_rate_limit{Colors.END}: "
                    f"Identifier: {identifier}, Endpoint: {endpoint}, "
                    f"Current: {current_requests}, Limit: {limit_config['requests']}, Allowed: {allowed}")
        
        return allowed, rate_limit_info
    
    async def check_rate_limit(self, identifier: str, endpoint: str, user_type: str = 'default') -> Tuple[bool, Dict]:
        """
        Check rate limit for a request.
        
        Args:
            identifier: User identifier (IP, user ID, etc.)
            endpoint: API endpoint
            user_type: Type of user (default, admin, etc.)
            
        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        limit_config = self.rate_limits.get(user_type, self.rate_limits['default'])
        
        logger.info(f"{Colors.BLUE}📊{Colors.END} {Colors.BOLD}RateLimiter.check_rate_limit{Colors.END}: "
                   f"Checking rate limit for {Colors.PURPLE}{identifier}{Colors.END} on {Colors.PURPLE}{endpoint}{Colors.END}")
        
        if self.redis_client:
            allowed, rate_limit_info = await self._check_redis_rate_limit(identifier, endpoint, limit_config)
        else:
            allowed, rate_limit_info = self._check_memory_rate_limit(identifier, endpoint, limit_config)
        
        if not allowed:
            logger.warning(f"{Colors.YELLOW}⚠{Colors.END} {Colors.BOLD}RateLimiter.check_rate_limit{Colors.END}: "
                          f"Rate limit exceeded for {Colors.PURPLE}{identifier}{Colors.END} on {Colors.PURPLE}{endpoint}{Colors.END}")
        else:
            logger.debug(f"{Colors.GREEN}✓{Colors.END} {Colors.BOLD}RateLimiter.check_rate_limit{Colors.END}: "
                        f"Rate limit check passed for {Colors.PURPLE}{identifier}{Colors.END}")
        
        return allowed, rate_limit_info
    
    async def get_rate_limit_info(self, identifier: str, endpoint: str, user_type: str = 'default') -> Dict:
        """
        Get current rate limit information without consuming a request.
        
        Args:
            identifier: User identifier
            endpoint: API endpoint
            user_type: Type of user
            
        Returns:
            Rate limit information
        """
        limit_config = self.rate_limits.get(user_type, self.rate_limits['default'])
        
        if self.redis_client:
            allowed, rate_limit_info = await self._check_redis_rate_limit(identifier, endpoint, limit_config)
        else:
            allowed, rate_limit_info = self._check_memory_rate_limit(identifier, endpoint, limit_config)
        
        return rate_limit_info
    
    def get_endpoint_limit(self, endpoint: str) -> Dict:
        """
        Get rate limit configuration for an endpoint.
        
        Args:
            endpoint: API endpoint
            
        Returns:
            Rate limit configuration
        """
        # Map endpoints to rate limit types
        endpoint_mapping = {
            'upload': 'upload',
            'analysis': 'analysis',
            'electroplating': 'electroplating',
            'validation': 'analysis',
            'cost': 'analysis',
            'scale': 'analysis',
            'translate': 'analysis',
        }
        
        limit_type = endpoint_mapping.get(endpoint, 'default')
        return self.rate_limits[limit_type]
    
    async def cleanup(self):
        """Cleanup resources."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info(f"{Colors.GREEN}✓{Colors.END} {Colors.BOLD}RateLimiter{Colors.END}: Redis connection closed")


# Global rate limiter instance
rate_limiter: Optional[RateLimiter] = None

def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    global rate_limiter
    if rate_limiter is None:
        # Initialize with environment variables
        import os
        redis_url = os.getenv('REDIS_URL')
        rate_limiter = RateLimiter(redis_url=redis_url)
    return rate_limiter

def rate_limit_decorator(endpoint: str, user_type: str = 'default'):
    """
    Decorator for rate limiting endpoints.
    
    Args:
        endpoint: API endpoint name
        user_type: Type of user
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get client IP (you might want to extract this from the request)
            import os
            identifier = os.getenv('REMOTE_ADDR', 'unknown')
            
            limiter = get_rate_limiter()
            allowed, rate_limit_info = await limiter.check_rate_limit(identifier, endpoint, user_type)
            
            if not allowed:
                raise RateLimitExceeded(
                    retry_after=rate_limit_info['reset_time'] - int(time.time())
                )
            
            # Add rate limit headers to response
            response = await func(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(rate_limit_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_limit_info['remaining'])
                response.headers['X-RateLimit-Reset'] = str(rate_limit_info['reset_time'])
            
            return response
        
        return wrapper
    return decorator 