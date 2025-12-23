"""
In-memory cache for scraped match data
Handles caching with different TTLs for live/scheduled/finished matches
"""

import logging
from datetime import datetime, timezone
from threading import Lock
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)


class MatchCache:
    """Thread-safe in-memory cache for match data"""
    
    def __init__(self):
        self._matches: Dict[str, Dict[str, Any]] = {}
        self._leagues: Dict[str, Dict[str, Any]] = {}
        self._last_update: Optional[str] = None
        self._lock = Lock()
    
    def update_matches(self, matches: List[Dict[str, Any]]):
        """Update cache with new match data"""
        with self._lock:
            for match in matches:
                match_id = match.get("id")
                if not match_id:
                    continue
                
                # Store match
                self._matches[match_id] = match
                
                # Update league index
                league_id = match.get("leagueId")
                if league_id:
                    if league_id not in self._leagues:
                        self._leagues[league_id] = {
                            "id": league_id,
                            "name": match.get("leagueName", "Unknown"),
                            "country": match.get("country", ""),
                            "matches": []
                        }
                    
                    # Add match ID to league (avoid duplicates)
                    if match_id not in self._leagues[league_id]["matches"]:
                        self._leagues[league_id]["matches"].append(match_id)
            
            self._last_update = datetime.now(timezone.utc).isoformat()
            logger.debug(f"Cache updated: {len(self._matches)} matches, {len(self._leagues)} leagues")
    
    def get_all_matches(self) -> List[Dict[str, Any]]:
        """Get all cached matches"""
        with self._lock:
            return list(self._matches.values())
    
    def get_live_matches(self) -> List[Dict[str, Any]]:
        """Get only live and half-time matches"""
        with self._lock:
            return [
                match for match in self._matches.values()
                if match.get("status") in ("LIVE", "HT")
            ]
    
    def get_match(self, match_id: str) -> Optional[Dict[str, Any]]:
        """Get single match by ID"""
        with self._lock:
            return self._matches.get(match_id)
    
    def get_leagues(self) -> List[Dict[str, Any]]:
        """Get all leagues with their matches"""
        with self._lock:
            result = []
            for league_id, league in self._leagues.items():
                league_data = {
                    "id": league["id"],
                    "name": league["name"],
                    "country": league["country"],
                    "matches": [
                        self._matches[mid] 
                        for mid in league["matches"] 
                        if mid in self._matches
                    ]
                }
                if league_data["matches"]:
                    result.append(league_data)
            return result
    
    def get_match_count(self) -> int:
        """Get total number of cached matches"""
        with self._lock:
            return len(self._matches)
    
    def get_last_update(self) -> Optional[str]:
        """Get last update timestamp"""
        with self._lock:
            return self._last_update
    
    def clear(self):
        """Clear all cached data"""
        with self._lock:
            self._matches.clear()
            self._leagues.clear()
            self._last_update = None
