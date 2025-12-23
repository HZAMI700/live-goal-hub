"""
Flashscore Scraper using Playwright
Handles JavaScript rendering and anti-bot measures
"""

import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Flashscore URLs
FLASHSCORE_BASE = "https://www.flashscore.com"
FLASHSCORE_MATCHES = "https://www.flashscore.com/"


class FlashscoreScraper:
    """Playwright-based Flashscore scraper with anti-bot handling"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
    async def initialize(self):
        """Initialize Playwright browser with proper configuration"""
        try:
            self.playwright = await async_playwright().start()
            
            # Launch Chromium with optimized settings
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-gpu",
                    "--disable-extensions",
                ]
            )
            
            # Create context with realistic browser settings
            self.context = await self.browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US",
                timezone_id="UTC",
                # Block unnecessary resources for speed
                bypass_csp=True,
            )
            
            # Block images, fonts, media for faster loading
            await self.context.route(
                re.compile(r"\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|mp4|webm|mp3)$"),
                lambda route: route.abort()
            )
            
            # Block tracking/analytics
            await self.context.route(
                re.compile(r"(google-analytics|googletagmanager|facebook|analytics)"),
                lambda route: route.abort()
            )
            
            self.page = await self.context.new_page()
            
            logger.info("Playwright browser initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Playwright: {e}")
            raise
    
    async def close(self):
        """Clean up browser resources"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Playwright browser closed")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    async def scrape_matches(self) -> List[Dict[str, Any]]:
        """Scrape all matches from Flashscore homepage"""
        matches = []
        
        try:
            if not self.page:
                await self.initialize()
            
            # Navigate to Flashscore
            logger.info("Loading Flashscore...")
            await self.page.goto(FLASHSCORE_MATCHES, wait_until="domcontentloaded", timeout=30000)
            
            # Wait for match content to load
            try:
                await self.page.wait_for_selector(".event__match", timeout=15000)
            except:
                logger.warning("Timeout waiting for matches, trying alternative selector")
                try:
                    await self.page.wait_for_selector("[class*='event']", timeout=10000)
                except:
                    logger.error("No matches found on page")
                    return matches
            
            # Small delay to let JS finish
            await asyncio.sleep(2)
            
            # Get page HTML
            html = await self.page.content()
            matches = self._parse_matches(html)
            
            logger.info(f"Scraped {len(matches)} matches")
            
        except Exception as e:
            logger.error(f"Scrape error: {e}")
            # Try to recover
            try:
                await self.close()
                await self.initialize()
            except:
                pass
        
        return matches
    
    def _parse_matches(self, html: str) -> List[Dict[str, Any]]:
        """Parse matches from HTML using BeautifulSoup"""
        matches = []
        soup = BeautifulSoup(html, "lxml")
        
        current_league = None
        current_country = None
        
        # Find all event containers (leagues + matches)
        events = soup.find_all(class_=re.compile(r"event__"))
        
        for event in events:
            try:
                classes = event.get("class", [])
                class_str = " ".join(classes)
                
                # Check if this is a league header
                if "event__header" in class_str:
                    league_info = self._parse_league_header(event)
                    if league_info:
                        current_league = league_info.get("name")
                        current_country = league_info.get("country")
                    continue
                
                # Check if this is a match
                if "event__match" in class_str:
                    match = self._parse_match(event, current_league, current_country)
                    if match:
                        matches.append(match)
                        
            except Exception as e:
                logger.debug(f"Error parsing event: {e}")
                continue
        
        return matches
    
    def _parse_league_header(self, element) -> Optional[Dict[str, str]]:
        """Parse league header to extract league name and country"""
        try:
            # Try multiple selectors for league name
            league_name = None
            country = None
            
            # Primary selector
            title_elem = element.select_one(".event__title--name")
            if title_elem:
                league_name = title_elem.get_text(strip=True)
            
            # Fallback
            if not league_name:
                title_elem = element.select_one("[class*='title']")
                if title_elem:
                    league_name = title_elem.get_text(strip=True)
            
            # Country from flag or category
            country_elem = element.select_one(".event__title--type")
            if country_elem:
                country = country_elem.get_text(strip=True)
            
            if not country:
                # Try flag image alt text
                flag_img = element.select_one("img[class*='flag']")
                if flag_img:
                    country = flag_img.get("alt", "")
            
            if league_name:
                return {"name": league_name, "country": country or ""}
                
        except Exception as e:
            logger.debug(f"Error parsing league header: {e}")
        
        return None
    
    def _parse_match(self, element, league: str, country: str) -> Optional[Dict[str, Any]]:
        """Parse single match element"""
        try:
            # Get match ID from element
            match_id = element.get("id", "")
            if not match_id:
                # Try data attribute
                match_id = element.get("data-id", "")
            if not match_id:
                # Generate from content hash
                match_id = f"match_{hash(str(element))}"
            
            # Clean match ID
            match_id = match_id.replace("g_1_", "").replace("g_2_", "")
            
            # Parse teams
            home_team = self._get_text_safe(element, [
                ".event__participant--home",
                "[class*='participant--home']",
                ".event__homeParticipant"
            ])
            
            away_team = self._get_text_safe(element, [
                ".event__participant--away", 
                "[class*='participant--away']",
                ".event__awayParticipant"
            ])
            
            if not home_team or not away_team:
                return None
            
            # Parse scores
            home_score = self._get_score(element, "home")
            away_score = self._get_score(element, "away")
            
            # Parse status and minute
            status, minute = self._parse_status(element)
            
            # Parse time
            start_time = self._parse_time(element)
            
            # Get team logos (if available)
            home_logo = self._get_logo(element, "home")
            away_logo = self._get_logo(element, "away")
            
            return {
                "id": match_id,
                "homeTeam": {
                    "id": f"team_{hash(home_team)}",
                    "name": home_team,
                    "shortName": home_team[:3].upper() if home_team else "???",
                    "logo": home_logo or f"https://www.flashscore.com/res/image/empty-logo-team-share.gif"
                },
                "awayTeam": {
                    "id": f"team_{hash(away_team)}",
                    "name": away_team,
                    "shortName": away_team[:3].upper() if away_team else "???",
                    "logo": away_logo or f"https://www.flashscore.com/res/image/empty-logo-team-share.gif"
                },
                "homeScore": home_score,
                "awayScore": away_score,
                "status": status,
                "minute": minute,
                "startTime": start_time,
                "leagueId": f"league_{hash(league or 'unknown')}",
                "leagueName": league or "Unknown League",
                "country": country or ""
            }
            
        except Exception as e:
            logger.debug(f"Error parsing match: {e}")
            return None
    
    def _get_text_safe(self, element, selectors: List[str]) -> Optional[str]:
        """Try multiple selectors to get text content"""
        for selector in selectors:
            try:
                elem = element.select_one(selector)
                if elem:
                    text = elem.get_text(strip=True)
                    if text:
                        return text
            except:
                continue
        return None
    
    def _get_score(self, element, team: str) -> Optional[int]:
        """Parse score for home or away team"""
        selectors = [
            f".event__score--{team}",
            f"[class*='score--{team}']"
        ]
        
        for selector in selectors:
            try:
                elem = element.select_one(selector)
                if elem:
                    score_text = elem.get_text(strip=True)
                    if score_text and score_text.isdigit():
                        return int(score_text)
            except:
                continue
        
        return None
    
    def _parse_status(self, element) -> tuple:
        """Parse match status and minute"""
        status = "SCHEDULED"
        minute = None
        
        try:
            # Check for live indicator
            stage_elem = element.select_one(".event__stage--block")
            if not stage_elem:
                stage_elem = element.select_one("[class*='stage']")
            
            if stage_elem:
                stage_text = stage_elem.get_text(strip=True).upper()
                
                if "LIVE" in stage_text or stage_text.isdigit() or "'" in stage_text:
                    status = "LIVE"
                    # Extract minute
                    minute_match = re.search(r"(\d+)", stage_text)
                    if minute_match:
                        minute = int(minute_match.group(1))
                        
                elif "HT" in stage_text or "HALF" in stage_text:
                    status = "HT"
                    minute = 45
                    
                elif "FT" in stage_text or "FINISHED" in stage_text or "AET" in stage_text:
                    status = "FT"
                    
                elif "POSTP" in stage_text:
                    status = "POSTPONED"
                    
                elif "CANC" in stage_text:
                    status = "CANCELLED"
            
            # Also check for finished class
            classes = " ".join(element.get("class", []))
            if "event--finished" in classes or "finished" in classes.lower():
                status = "FT"
                
            # Check for live class
            if "event--live" in classes or "live" in classes.lower():
                if status == "SCHEDULED":
                    status = "LIVE"
                    
        except Exception as e:
            logger.debug(f"Error parsing status: {e}")
        
        return status, minute
    
    def _parse_time(self, element) -> str:
        """Parse match start time"""
        try:
            time_elem = element.select_one(".event__time")
            if not time_elem:
                time_elem = element.select_one("[class*='time']")
            
            if time_elem:
                time_text = time_elem.get_text(strip=True)
                # Parse HH:MM format
                time_match = re.search(r"(\d{1,2}):(\d{2})", time_text)
                if time_match:
                    hour, minute = int(time_match.group(1)), int(time_match.group(2))
                    now = datetime.now(timezone.utc)
                    return now.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat()
        except:
            pass
        
        return datetime.now(timezone.utc).isoformat()
    
    def _get_logo(self, element, team: str) -> Optional[str]:
        """Get team logo URL"""
        try:
            selectors = [
                f".event__logo--{team}",
                f"[class*='logo--{team}'] img",
                f"[class*='{team}'] img[class*='logo']"
            ]
            
            for selector in selectors:
                img = element.select_one(selector)
                if img:
                    src = img.get("src") or img.get("data-src")
                    if src:
                        if src.startswith("//"):
                            return f"https:{src}"
                        elif src.startswith("/"):
                            return urljoin(FLASHSCORE_BASE, src)
                        return src
        except:
            pass
        
        return None
