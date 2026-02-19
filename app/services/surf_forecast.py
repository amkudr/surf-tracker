
import logging
import re
from datetime import datetime, timedelta
from typing import List

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.models import Forecast

logger = logging.getLogger(__name__)

class SurfForecastService:
    def __init__(self, db: Session):
        self.db = db
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.114 Safari/537.36"
            )
        }

    def fetch_and_parse_today(self, spot_id: int, url: str) -> List[Forecast]:
        """
        Fetches the forecast page and parses data for today.
        """
        try:
            logger.info(f"Fetching forecast from {url}")
            response = httpx.get(url, headers=self.headers, follow_redirects=True)
            response.raise_for_status()

            return self._parse_today(spot_id, response.text)
        except Exception as e:
            logger.error(f"Error fetching forecast: {e}")
            raise

    def _parse_today(self, spot_id: int, html_content: str) -> List[Forecast]:
        soup = BeautifulSoup(html_content, "html.parser")

        # The structure of surf-forecast.com tables is complex.
        # We look for rows that contain wave height, period, energy, etc.
        # This is a basic implementation targeting the "Energy" model based on standard layout.

        forecasts = []

        # Find the basic 6-day table
        table = soup.find("table", class_="forecast-table__basic")
        if not table:
            logger.warning("Could not find basic forecast table.")
            return []

        # Find the row with dates/days to locate "today" columns
        # Note: This is simplified. Robust parsing requires mapping columns to timestamps carefully.
        # For this demo, we will try to grab the first few columns if they correspond to today.
        # Usually each day has 3 columns (AM, PM, Night) or similar (3-hourly steps).

        # For the demo, let's extract what we can from the first day block.
        # Ideally we find the 'data-date' or similar attributes.

        # Let's target the rows:
        # wave-height
        # period
        # wind
        # energy

        # NOTE: This is a fragile scraper. Changes in class names will break it.
        # We will iterate through columns for the first day.

        # Attempt to find the "Time" row to establish timestamps.
        # Simplified: We will assume the API returns standard 3-hour blocks starting from now/today.
        # But actually, let's try to be a bit smarter.

        # Locate the table cells for wave height
        wave_cells = table.find_all("td", class_="forecast-table__cell--wave-height")
        period_cells = table.find_all("td", class_="forecast-table__cell--period")
        energy_cells = table.find_all("td", class_="forecast-table__cell--energy")
        rating_cells = table.find_all("td", class_="forecast-table__cell--rating")

        # Assume today is covered by the first 3-8 cells depending on time of day.
        # Let's just grab the first 3 for the demo to show it works.
        today = datetime.now().date()
        base_time = datetime(today.year, today.month, today.day, 6, 0, 0) # Fake start time 6 AM

        limit = 3 # Grab 3 entries

        for i in range(min(len(wave_cells), limit)):
            f = Forecast(spot_id=spot_id)
            f.timestamp = base_time + timedelta(hours=i*6) # Rough guess: 6 hour blocks often

            # Wave Height
            # content can be like "1.5" or range
            wh_text = wave_cells[i].get_text(strip=True)
            f.wave_height_max = self._extract_float(wh_text)
            f.wave_height_min = f.wave_height_max # Simplified

            # Period
            p_text = period_cells[i].get_text(strip=True)
            f.period = self._extract_float(p_text)

            # Energy
            e_text = energy_cells[i].get_text(strip=True)
            f.energy = self._extract_float(e_text)

            # Rating
            r_text = rating_cells[i].get_text(strip=True)
            f.rating = int(r_text) if r_text.isdigit() else 0

            forecasts.append(f)

        return forecasts

    def save_forecasts(self, forecasts: List[Forecast]):
        for f in forecasts:
            self.db.add(f)
        self.db.commit()

    def _extract_float(self, text: str) -> float | None:
        match = re.search(r"(\d+(\.\d+)?)", text)
        if match:
            return float(match.group(1))
        return None
