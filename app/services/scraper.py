import asyncio
import logging
import re
from datetime import datetime
from typing import List, Dict, Any
from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SurfScraper:
    def __init__(self):
        self.browser: Browser | None = None
        self.playwright = None

    async def start(self):
        # Initialize Playwright and launch the browser
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True, # Run in headless mode for server environments
            args=["--disable-blink-features=AutomationControlled"]
        )

    async def stop(self):
        # Cleanup resources
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def scrape_spot(self, url: str) -> Dict[str, Any]:
        # Scrapes URL and returns dict with 'forecasts' and 'tides'
        # 1. Ensure browser is running
        is_own_browser = False
        if not self.browser:
            await self.start()
            is_own_browser = True
        
        # 2. Create a new page context
        page = await self.browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

        try:
            # 3. Navigate to the forecast URL
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            
            try:
                # 4. Interact with the page: click 'Days' button to expand/load full data if needed
                await page.wait_for_timeout(2500)
                if await page.locator('.forecast-table-days__button').count() > 0:
                    await page.click('.forecast-table-days__button')
                    await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"Warning: Interaction failed for {url}: {e}")

            # 5. Extract HTML content
            content = await page.content()
            return self._parse_html(content)
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return {"forecasts": [], "tides": []}
        finally:
            # 6. Close the page (keeping browser open for other spots if reused)
            await page.close()
            if is_own_browser:
                await self.stop()

    def _parse_html(self, html_content: str) -> Dict[str, Any]:
        # 1. Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")
        table = soup.find("table", class_="forecast-table__table")
        
        if not table:
            return {"forecasts": [], "tides": []}

        def get_row_by_data_name(row_name: str):
            return table.select_one(f'tr[data-row-name="{row_name}"]')

        # 2. Locate key data rows
        time_row = table.find("tr", class_="forecast-table-time")
        day_row = table.find("tr", class_="forecast-table-days")
        rating_row = table.find("tr", class_="forecast-table-rating")

        wh_row = get_row_by_data_name("wave-height")
        period_row = get_row_by_data_name("periods")
        energy_row = get_row_by_data_name("energy-maxenergy")
        wind_row = get_row_by_data_name("wind")
        high_tide_row = get_row_by_data_name("high-tide")
        low_tide_row = get_row_by_data_name("low-tide")

        if not all([time_row, wh_row, wind_row]):
             return {"forecasts": [], "tides": []}

        # 3. Extract cells from rows
        time_cells = time_row.find_all("td")
        wh_cells = wh_row.find_all("td")
        period_cells = period_row.find_all("td") if period_row else []
        energy_cells = energy_row.find_all("td") if energy_row else []
        wind_cells = wind_row.find_all("td")
        rating_cells = rating_row.find_all("td") if rating_row else []
        tide_high_cells = high_tide_row.find_all("td") if high_tide_row else []
        tide_low_cells = low_tide_row.find_all("td") if low_tide_row else []

        num_cols = len(wh_cells)

        # 4. Map columns to dates (handling 'colspan' for days spanning multiple hours)
        col_date_map = []
        if day_row:
            day_cells = day_row.find_all("td")
            for cell in day_cells:
                date_text = cell.get_text(strip=True)
                date_text = re.sub(r"([a-zA-Z]+)(\d+)", r"\1 \2", date_text)
                colspan = int(cell.get("colspan", 1))
                col_date_map.extend([date_text] * colspan)
        
        if len(col_date_map) < num_cols:
            col_date_map.extend(["Unknown"] * (num_cols - len(col_date_map)))

        # 5. Extract Tides Logic
        def build_tide_list(tide_cells, tide_type: str) -> List[Dict[str, Any]]:
            tides = []
            extracted_tides = []
            for i, cell in enumerate(tide_cells):
                raw = cell.get_text(" ", strip=True)
                if not raw:
                    continue
                
                date_text = col_date_map[i] if i < len(col_date_map) else "Unknown"
                
                time_match = re.search(r"(\d{1,2}:\d{2}\s*[AP]M)", raw)
                height_text = ""
                height_span = cell.select_one(".heighttide")
                
                if height_span:
                    height_text = height_span.get_text(strip=True)
                else:
                    all_numbers = re.findall(r"-?\d+(?:\.\d+)?", raw)
                    if all_numbers:
                        height_text = all_numbers[-1]

                if not time_match and not height_text:
                    continue
                
                raw_time = time_match.group(1).replace(" ", "") if time_match else ""
                formatted_time = self._convert_to_24h(raw_time)
                
                height_val = self._safe_float(height_text)
                
                if formatted_time and height_val is not None:
                    full_time_str = f"{date_text} {formatted_time}"
                    timestamp = self._parse_datetime(full_time_str)
                    if timestamp is None:
                        logger.info(
                            "Skipping tide row: unparseable timestamp (tide_type=%s, full_time_str=%r, column_index=%s)",
                            tide_type, full_time_str, i,
                        )
                        continue
                    extracted_tides.append({
                        "timestamp": timestamp,
                        "height": height_val,
                        "tide_type": tide_type
                    })
            return extracted_tides

        high_tides = build_tide_list(tide_high_cells, "HIGH")
        low_tides = build_tide_list(tide_low_cells, "LOW")
        all_tides = high_tides + low_tides

        forecasts = []
        # 6. Iterate through each column to extract hourly data
        for i in range(num_cols):
            try:
                # 6a. Construct the full timestamp
                time_text = time_cells[i].get_text(strip=True) if i < len(time_cells) else ""
                date_text = col_date_map[i]
                
                time_24h = self._convert_to_24h(time_text)
                full_time_str = f"{date_text} {time_24h}"
                timestamp = self._parse_datetime(full_time_str)
                if timestamp is None:
                    logger.info(
                        "Skipping forecast row: unparseable timestamp (column_index=%s, full_time_str=%r)",
                        i, full_time_str,
                    )
                    continue

                # 6b. Extract Wave Height and Direction
                wh_text = wh_cells[i].get_text(strip=True) if i < len(wh_cells) else ""
                wh_match = re.search(r"(\d+(\.\d+)?)", wh_text)
                wave_height = None
                wave_direction = ""
                if wh_match:
                    wave_height = float(wh_match.group(1))
                    wave_direction = wh_text.replace(wh_match.group(1), "").strip()

                # 6c. Extract Period
                period_text = period_cells[i].get_text(strip=True) if i < len(period_cells) else ""
                period_value = self._safe_float(period_text)

                # 6d. Extract Energy
                energy_text = energy_cells[i].get_text(strip=True) if i < len(energy_cells) else ""
                energy_value = self._safe_float(energy_text)

                # 6e. Extract Wind Speed and Direction
                wind_text = wind_cells[i].get_text(strip=True) if i < len(wind_cells) else ""
                wind_match = re.search(r"(\d+)", wind_text)
                wind_speed = None
                wind_direction = ""
                if wind_match:
                    wind_speed = float(wind_match.group(1))
                    wind_direction = wind_text.replace(wind_match.group(1), "").strip()

                # 6f. Extract Rating
                rating_text = rating_cells[i].get_text(strip=True) if i < len(rating_cells) else ""
                rating = int(rating_text) if rating_text.isdigit() else 0

                forecasts.append({
                    "timestamp": timestamp,
                    "wave_height": wave_height,
                    "wave_direction": wave_direction,
                    "period": period_value,
                    "energy": energy_value,
                    "wind_speed": wind_speed,
                    "wind_direction": wind_direction,
                    "rating": rating
                })
            except Exception as e:
                print(f"Error parsing column {i}: {e}")
                continue

        return {"forecasts": forecasts, "tides": all_tides}

    def _convert_to_24h(self, time_str: str) -> str:
        # Helper to convert "6PM" or "6:00PM" to "18:00"
        if not time_str:
            return ""
        cleaned = time_str.strip().upper()
        try:
            dt = datetime.strptime(cleaned, "%I:%M%p")
            return dt.strftime("%H:%M")
        except ValueError:
            pass
        try:
            dt = datetime.strptime(cleaned, "%I%p")
            return dt.strftime("%H:%M")
        except ValueError:
            return time_str

    def _safe_float(self, text: str) -> float | None:
        stripped = text.strip()
        return float(stripped) if re.fullmatch(r"-?\d+(?:\.\d+)?", stripped) else None

    def _parse_datetime(self, time_str: str) -> datetime | None:
        """Parse 'DayName DayNum HH:MM' (e.g. 'Sun 1 08:00') to datetime. Returns None on failure."""
        try:
            parts = time_str.split()
            day_num = int(parts[1])
            time_parts = parts[2].split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1])

            current_date = datetime.now()
            month = current_date.month
            year = current_date.year

            if day_num < current_date.day and (current_date.day - day_num) > 15:
                month += 1
                if month > 12:
                    month = 1
                    year += 1

            return datetime(year, month, day_num, hour, minute)
        except Exception as e:
            logger.info(
                "Timestamp parse failed, row will be skipped (time_str=%r, error=%s)",
                time_str, e,
            )
            return None
