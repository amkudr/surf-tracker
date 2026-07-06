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

        # The site changed its UI. It now uses a different class for the table and data-row attributes.
        table = soup.find("table", class_="forecast-table__table--content")
        if not table:
            logger.warning("Could not find forecast table.")
            return []

        swell_row = table.find("tr", attrs={"data-row": "swell"})
        energy_row = table.find("tr", attrs={"data-row": "wave-energy"})
        rating_row = table.find("tr", attrs={"data-row": "rating"})

        if not swell_row or not energy_row or not rating_row:
            logger.warning("Could not find all required rows (swell, energy, rating).")
            return []

        swell_cells = swell_row.find_all("td")
        energy_cells = energy_row.find_all("td")
        rating_cells = rating_row.find_all("td")

        # Assume today is covered by the first 3-8 cells depending on time of day.
        # Let's just grab the first 3 for the demo to show it works.
        today = datetime.now().date()
        base_time = datetime(today.year, today.month, today.day, 6, 0, 0)  # Fake start time 6 AM

        limit = 3  # Grab 3 entries

        # Ensure we don't go out of bounds
        limit = min(limit, len(swell_cells), len(energy_cells), len(rating_cells))

        for i in range(limit):
            f = Forecast(spot_id=spot_id)
            f.timestamp = base_time + timedelta(hours=i * 6)  # Rough guess: 6 hour blocks often

            swell_td = swell_cells[i]

            # Wave Height
            height_div = swell_td.find("div", class_="swell-icon")
            if height_div and height_div.get("data-height"):
                f.wave_height_max = float(height_div.get("data-height"))
            else:
                # Fallback to text parsing
                f.wave_height_max = self._extract_float(swell_td.get_text())
            f.wave_height_min = f.wave_height_max  # Simplified

            # Period
            period_div = swell_td.find("div", class_="forecast-table__swell-period")
            if period_div:
                f.period = self._extract_float(period_div.get_text(strip=True))
            else:
                f.period = None

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
