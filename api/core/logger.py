"""
Comprehensive logging configuration for the STL Analysis API.

This module provides colored logging with class and function name highlighting,
structured logging, and different log levels for different components.
"""

import logging
import sys
import os
from datetime import datetime
from typing import Optional, Dict, Any
import json
from pathlib import Path

# Color codes for terminal output
class Colors:
    # Basic colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Bright colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'
    
    # Formatting
    BOLD = '\033[1m'
    DIM = '\033[2m'
    UNDERLINE = '\033[4m'
    BLINK = '\033[5m'
    REVERSE = '\033[7m'
    HIDDEN = '\033[8m'
    
    # Reset
    END = '\033[0m'
    RESET = '\033[0m'

# Log level colors
LOG_LEVEL_COLORS = {
    'DEBUG': Colors.BRIGHT_BLUE,
    'INFO': Colors.BRIGHT_GREEN,
    'WARNING': Colors.BRIGHT_YELLOW,
    'ERROR': Colors.BRIGHT_RED,
    'CRITICAL': Colors.BRIGHT_MAGENTA,
}

# Component colors for class and function names
COMPONENT_COLORS = {
    'RateLimiter': Colors.BRIGHT_CYAN,
    'SessionManager': Colors.BRIGHT_MAGENTA,
    'STLTools': Colors.BRIGHT_GREEN,
    'FastAPI': Colors.BRIGHT_BLUE,
    'Uvicorn': Colors.BRIGHT_YELLOW,
    'default': Colors.BRIGHT_WHITE,
}

class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds colors to log messages.
    
    Features:
    - Colored log levels
    - Colored class and function names
    - Structured formatting
    - Timestamp formatting
    """
    
    def __init__(self, use_colors: bool = True, include_timestamp: bool = True):
        """
        Initialize the colored formatter.
        
        Args:
            use_colors: Whether to use colors in output
            include_timestamp: Whether to include timestamps
        """
        self.use_colors = use_colors
        self.include_timestamp = include_timestamp
        
        # Define format string
        if include_timestamp:
            format_string = '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
        else:
            format_string = '%(levelname)-8s | %(name)s | %(message)s'
        
        super().__init__(format_string, datefmt='%Y-%m-%d %H:%M:%S')
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record with colors.
        
        Args:
            record: Log record to format
            
        Returns:
            Formatted log message with colors
        """
        if not self.use_colors:
            return super().format(record)
        
        # Color the log level
        level_color = LOG_LEVEL_COLORS.get(record.levelname, Colors.WHITE)
        record.levelname = f"{level_color}{record.levelname}{Colors.END}"
        
        # Color the logger name (component)
        logger_color = COMPONENT_COLORS.get(record.name, COMPONENT_COLORS['default'])
        record.name = f"{logger_color}{record.name}{Colors.END}"
        
        # Color class and function names in the message
        if hasattr(record, 'funcName') and record.funcName:
            func_color = Colors.BRIGHT_CYAN
            record.msg = str(record.msg).replace(
                record.funcName, 
                f"{func_color}{record.funcName}{Colors.END}"
            )
        
        # Color class names (extract from logger name or message)
        for class_name, color in COMPONENT_COLORS.items():
            if class_name in str(record.msg):
                record.msg = str(record.msg).replace(
                    class_name, 
                    f"{color}{class_name}{Colors.END}"
                )
        
        # Add emojis for different log levels
        emoji_map = {
            'DEBUG': '🔍',
            'INFO': 'ℹ️',
            'WARNING': '⚠️',
            'ERROR': '❌',
            'CRITICAL': '🚨',
        }
        
        emoji = emoji_map.get(record.levelname.replace(level_color, '').replace(Colors.END, ''), '')
        if emoji:
            record.msg = f"{emoji} {record.msg}"
        
        return super().format(record)

class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.
    
    Useful for log aggregation and analysis.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON.
        
        Args:
            record: Log record to format
            
        Returns:
            JSON formatted log message
        """
        log_entry = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add extra fields if present
        extra_fields = getattr(record, 'extra_fields', None)
        if extra_fields:
            log_entry.update(extra_fields)
        elif hasattr(record, '__dict__'):
            # Extract extra fields from record attributes
            extra_fields = {k: v for k, v in record.__dict__.items() 
                          if k not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                                      'filename', 'module', 'lineno', 'funcName', 'created', 
                                      'msecs', 'relativeCreated', 'thread', 'threadName', 
                                      'processName', 'process', 'getMessage', 'exc_info', 
                                      'exc_text', 'stack_info']}
            if extra_fields:
                log_entry['extra_fields'] = extra_fields
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)

class StructuredLogger:
    """
    Structured logger that provides context-aware logging.
    
    Features:
    - Request ID tracking
    - User context
    - Performance metrics
    - Structured data logging
    """
    
    def __init__(self, name: str, logger: Optional[logging.Logger] = None):
        """
        Initialize the structured logger.
        
        Args:
            name: Logger name
            logger: Existing logger instance (optional)
        """
        self.name = name
        self.logger = logger or logging.getLogger(name)
        self.context: Dict[str, Any] = {}
    
    def bind(self, **kwargs) -> 'StructuredLogger':
        """
        Bind context data to the logger.
        
        Args:
            **kwargs: Context data to bind
            
        Returns:
            Self for chaining
        """
        new_logger = StructuredLogger(self.name, self.logger)
        new_logger.context = {**self.context, **kwargs}
        return new_logger
    
    def _format_message(self, message: str, **kwargs) -> str:
        """
        Format message with context and extra data.
        
        Args:
            message: Base message
            **kwargs: Extra data
            
        Returns:
            Formatted message
        """
        all_data = {**self.context, **kwargs}
        if all_data:
            data_str = ' | '.join(f"{k}={v}" for k, v in all_data.items())
            return f"{message} | {data_str}"
        return message
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(self._format_message(message, **kwargs))
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(self._format_message(message, **kwargs))
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(self._format_message(message, **kwargs))
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(self._format_message(message, **kwargs))
    
    def critical(self, message: str, **kwargs):
        """Log critical message."""
        self.logger.critical(self._format_message(message, **kwargs))
    
    def exception(self, message: str, **kwargs):
        """Log exception with traceback."""
        self.logger.exception(self._format_message(message, **kwargs))

def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    use_colors: bool = True,
    json_format: bool = False,
    include_timestamp: bool = True
) -> None:
    """
    Setup logging configuration for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (optional)
        use_colors: Whether to use colors in console output
        json_format: Whether to use JSON format for file logging
        include_timestamp: Whether to include timestamps
    """
    # Create logs directory if it doesn't exist
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    if json_format:
        console_formatter = JSONFormatter()
    else:
        console_formatter = ColoredFormatter(use_colors=use_colors, include_timestamp=include_timestamp)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        if json_format:
            file_formatter = JSONFormatter()
        else:
            file_formatter = logging.Formatter(
                '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
    
    # Set specific logger levels
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('fastapi').setLevel(logging.INFO)
    
    # Log the setup
    logger = logging.getLogger(__name__)
    logger.info(f"{Colors.BRIGHT_GREEN}✓{Colors.END} {Colors.BOLD}Logger{Colors.END}: Logging configured", 
                extra={'log_level': log_level, 'log_file': log_file, 'use_colors': use_colors})

def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name
        
    Returns:
        Structured logger instance
    """
    return StructuredLogger(name)

# Performance logging utilities
class PerformanceLogger:
    """
    Utility for logging performance metrics.
    """
    
    def __init__(self, logger: StructuredLogger, operation: str):
        """
        Initialize performance logger.
        
        Args:
            logger: Structured logger instance
            operation: Operation name
        """
        self.logger = logger
        self.operation = operation
        self.start_time = None
    
    def __enter__(self):
        """Start timing."""
        self.start_time = datetime.now()
        self.logger.info(f"Starting {self.operation}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """End timing and log duration."""
        if self.start_time:
            duration = (datetime.now() - self.start_time).total_seconds()
            if exc_type:
                self.logger.error(f"Failed {self.operation}", duration_ms=duration * 1000)
            else:
                self.logger.info(f"Completed {self.operation}", duration_ms=duration * 1000)

def log_performance(logger: StructuredLogger, operation: str):
    """
    Decorator for logging function performance.
    
    Args:
        logger: Structured logger instance
        operation: Operation name
        
    Returns:
        Decorator function
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            try:
                result = func(*args, **kwargs)
                duration = (datetime.now() - start_time).total_seconds()
                logger.info(f"Completed {operation}", duration_ms=duration * 1000)
                return result
            except Exception as e:
                duration = (datetime.now() - start_time).total_seconds()
                logger.error(f"Failed {operation}", duration_ms=duration * 1000, error=str(e))
                raise
        return wrapper
    return decorator

# Initialize logging on module import
if not logging.getLogger().handlers:
    setup_logging() 