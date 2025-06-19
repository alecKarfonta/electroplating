"""
Session manager for handling STL file uploads and maintaining session state.
"""

import os
import uuid
import time
import tempfile
import shutil
from typing import Dict, Optional, Tuple
from datetime import datetime
import aiofiles
from pathlib import Path
import asyncio
from functools import lru_cache

from .stl_tools import STLTools


class SessionManager:
    """
    Manages file uploads and STL processing sessions to avoid redundant file processing.
    
    This class handles:
    - File upload and storage
    - Session creation and management
    - STL tools instance caching
    - Automatic cleanup of expired sessions
    - Performance optimization with caching
    """
    
    def __init__(self, upload_dir: Optional[str] = None, session_timeout: int = 3600, max_sessions: int = 1000):
        """
        Initialize the session manager.
        
        Args:
            upload_dir: Directory to store uploaded files (default: temp directory)
            session_timeout: Session timeout in seconds (default: 1 hour)
            max_sessions: Maximum number of concurrent sessions (default: 1000)
        """
        self.upload_dir = upload_dir or tempfile.mkdtemp(prefix="stl_api_")
        self.session_timeout = session_timeout
        self.max_sessions = max_sessions
        self.sessions: Dict[str, Dict] = {}
        self.stl_instances: Dict[str, STLTools] = {}
        self._cache_stats = {"hits": 0, "misses": 0}
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def create_session(self, file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Create a new session for an uploaded STL file.
        
        Args:
            file_content: Raw file content
            filename: Original filename
            
        Returns:
            Tuple of (session_id, file_path)
        """
        # Check session limit
        if len(self.sessions) >= self.max_sessions:
            # Clean up expired sessions first
            self.cleanup_expired_sessions()
            if len(self.sessions) >= self.max_sessions:
                raise RuntimeError("Maximum number of sessions reached")
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Create session directory
        session_dir = os.path.join(self.upload_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(session_dir, filename)
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        
        # Create session record
        current_time = datetime.now().isoformat()
        self.sessions[session_id] = {
            'filename': filename,
            'file_path': file_path,
            'file_size': len(file_content),
            'upload_time': current_time,
            'last_accessed': current_time,
            'session_dir': session_dir
        }
        
        return session_id, file_path
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Get session information.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session information or None if not found
        """
        if session_id not in self.sessions:
            return None
        
        # Update last accessed time
        self.sessions[session_id]['last_accessed'] = datetime.now().isoformat()
        return self.sessions[session_id]
    
    @lru_cache(maxsize=100)
    def _get_stl_tools_cached(self, session_id: str) -> Optional[STLTools]:
        """
        Cached version of STL tools creation.
        
        Args:
            session_id: Session identifier
            
        Returns:
            STLTools instance or None if session not found
        """
        if session_id not in self.sessions:
            return None
        
        # Create new instance
        session = self.sessions[session_id]
        try:
            stl_tools = STLTools()
            stl_tools.load_file(session['file_path'])
            return stl_tools
        except Exception as e:
            print(f"Error loading STL file for session {session_id}: {e}")
            return None
    
    def get_stl_tools(self, session_id: str) -> Optional[STLTools]:
        """
        Get or create STLTools instance for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            STLTools instance or None if session not found
        """
        if session_id not in self.sessions:
            self._cache_stats["misses"] += 1
            return None
        
        # Return cached instance if available
        if session_id in self.stl_instances:
            self._cache_stats["hits"] += 1
            return self.stl_instances[session_id]
        
        # Create new instance using cache
        stl_tools = self._get_stl_tools_cached(session_id)
        if stl_tools:
            self.stl_instances[session_id] = stl_tools
            self._cache_stats["hits"] += 1
        else:
            self._cache_stats["misses"] += 1
        
        return stl_tools
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and clean up associated files.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if successful, False otherwise
        """
        if session_id not in self.sessions:
            return False
        
        try:
            # Remove STL instance from cache
            if session_id in self.stl_instances:
                del self.stl_instances[session_id]
            
            # Clear cache for this session
            self._get_stl_tools_cached.cache_clear()
            
            # Remove session directory
            session = self.sessions[session_id]
            if os.path.exists(session['session_dir']):
                shutil.rmtree(session['session_dir'])
            
            # Remove session record
            del self.sessions[session_id]
            return True
        except Exception as e:
            print(f"Error deleting session {session_id}: {e}")
            return False
    
    def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired sessions.
        
        Returns:
            Number of sessions cleaned up
        """
        current_time = time.time()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            last_accessed = datetime.fromisoformat(session['last_accessed']).timestamp()
            if current_time - last_accessed > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            self.delete_session(session_id)
        
        return len(expired_sessions)
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """
        Get session information for API response.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session information formatted for API response
        """
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            'session_id': session_id,
            'filename': session['filename'],
            'file_size': session['file_size'],
            'upload_time': session['upload_time'],
            'last_accessed': session['last_accessed']
        }
    
    def list_sessions(self) -> Dict[str, Optional[Dict]]:
        """
        List all active sessions.
        
        Returns:
            Dictionary of session information
        """
        return {
            session_id: self.get_session_info(session_id)
            for session_id in self.sessions.keys()
        }
    
    def get_stats(self) -> Dict:
        """
        Get session manager statistics.
        
        Returns:
            Dictionary with session statistics
        """
        current_time = time.time()
        active_sessions = 0
        expired_sessions = 0
        
        for session in self.sessions.values():
            last_accessed = datetime.fromisoformat(session['last_accessed']).timestamp()
            if current_time - last_accessed > self.session_timeout:
                expired_sessions += 1
            else:
                active_sessions += 1
        
        total_size = sum(session['file_size'] for session in self.sessions.values())
        
        return {
            'sessions': {
                'total_sessions': len(self.sessions),
                'active_sessions': active_sessions,
                'expired_sessions': expired_sessions,
                'max_sessions': self.max_sessions
            },
            'storage': {
                'total_size_bytes': total_size,
                'total_size_mb': total_size / (1024 * 1024),
                'upload_directory': self.upload_dir
            },
            'cache': {
                'stl_instances_cached': len(self.stl_instances),
                'cache_hits': self._cache_stats["hits"],
                'cache_misses': self._cache_stats["misses"],
                'cache_hit_rate': self._cache_stats["hits"] / max(1, self._cache_stats["hits"] + self._cache_stats["misses"])
            }
        } 