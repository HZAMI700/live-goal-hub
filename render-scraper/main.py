"""
Flashscore Scraper - FastAPI Backend
Deploy this on Render as a Python Web Service
"""

import asyncio
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from scraper import FlashscoreScraper
from cache import MatchCache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
scraper: Optional[FlashscoreScraper] = None
cache = MatchCache()
scraper_task: Optional[asyncio.Task] = None


async def scraper_loop():
    """Background scraper loop - runs continuously"""
    global scraper, cache
    
    while True:
        try:
            if scraper is None:
                scraper = FlashscoreScraper()
                await scraper.initialize()
            
            # Scrape all matches
            matches = await scraper.scrape_matches()
            
            if matches:
                cache.update_matches(matches)
                logger.info(f"Updated {len(matches)} matches in cache")
            else:
                logger.warning("No matches scraped, keeping cached data")
            
            # Wait before next scrape (15 seconds for live updates)
            await asyncio.sleep(15)
            
        except Exception as e:
            logger.error(f"Scraper loop error: {e}")
            
            # Try to restart scraper
            if scraper:
                try:
                    await scraper.close()
                except:
                    pass
                scraper = None
            
            # Wait before retry
            await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown handlers"""
    global scraper_task, scraper
    
    logger.info("Starting Flashscore scraper...")
    
    # Start background scraper
    scraper_task = asyncio.create_task(scraper_loop())
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down scraper...")
    
    if scraper_task:
        scraper_task.cancel()
        try:
            await scraper_task
        except asyncio.CancelledError:
            pass
    
    if scraper:
        await scraper.close()


# Create FastAPI app
app = FastAPI(
    title="Flashscore Scraper API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow all origins for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cached_matches": cache.get_match_count(),
        "last_update": cache.get_last_update()
    }


@app.get("/api/live")
async def get_live_matches():
    """Get only live matches"""
    try:
        matches = cache.get_live_matches()
        return JSONResponse(content={
            "matches": matches,
            "count": len(matches),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting live matches: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to get live matches", "matches": []}
        )


@app.get("/api/today")
async def get_today_matches():
    """Get all today's matches"""
    try:
        matches = cache.get_all_matches()
        return JSONResponse(content={
            "matches": matches,
            "count": len(matches),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting today matches: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to get matches", "matches": []}
        )


@app.get("/api/leagues")
async def get_leagues():
    """Get all leagues with matches"""
    try:
        leagues = cache.get_leagues()
        return JSONResponse(content={
            "leagues": leagues,
            "count": len(leagues),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting leagues: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to get leagues", "leagues": []}
        )


@app.get("/api/match/{match_id}")
async def get_match(match_id: str):
    """Get single match by ID"""
    try:
        match = cache.get_match(match_id)
        if match:
            return JSONResponse(content={"match": match})
        return JSONResponse(
            status_code=404,
            content={"error": "Match not found"}
        )
    except Exception as e:
        logger.error(f"Error getting match {match_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to get match"}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
