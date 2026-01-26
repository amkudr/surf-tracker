import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime

URL = "https://www.surf-forecast.com/breaks/Fishermans-Sri-Lanka/forecasts/latest"

async def get_hourly_forecast():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

        await page.goto(URL, wait_until="domcontentloaded", timeout=45000)

        # await page.evaluate("document.querySelector('.forecast-table-days__button').click();")
        await page.wait_for_timeout(2500)
        
        await page.evaluate("document.querySelector('.forecast-table-days__button').click();")
        await page.wait_for_timeout(2000)
        
        content = await page.content()
        await browser.close()
        
        return parse_html(content)


def parse_html(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table", class_="forecast-table__table")
    
    if not table:
        return []

    def find_row_by_class(class_name):
        cell = table.find("td", class_=class_name)
        return cell.find_parent("tr") if cell else None

    time_row = table.find("tr", class_="forecast-table-time")
    day_row = table.find("tr", class_="forecast-table-days")
    rating_row = table.find("tr", class_="forecast-table-rating")
    wh_row = find_row_by_class("forecast-table-wave-height__cell")
    energy_row = find_row_by_class("forecast-table-energy__cell")
    wind_row = find_row_by_class("forecast-table-wind__cell")
    period_row = wh_row.find_next_sibling("tr") if wh_row else None

    if not all([time_row, wh_row, energy_row, wind_row]):
        return []

    time_cells = time_row.find_all("td")
    wh_cells = wh_row.find_all("td")
    period_cells = period_row.find_all("td") if period_row else []
    energy_cells = energy_row.find_all("td")
    wind_cells = wind_row.find_all("td")
    rating_cells = rating_row.find_all("td") if rating_row else []

    num_cols = len(wh_cells)

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

    forecasts = []
    for i in range(num_cols):
        time_text = time_cells[i].get_text(strip=True) if i < len(time_cells) else ""
        date_text = col_date_map[i]

        # print(time_text)
        wh_text = wh_cells[i].get_text(strip=True) if i < len(wh_cells) else ""
        match = re.search(r"(\d+(\.\d+)?)", wh_text)
        
        period_text = period_cells[i].get_text(strip=True) if i < len(period_cells) else ""
        energy_text = energy_cells[i].get_text(strip=True) if i < len(energy_cells) else ""
        wind_text = wind_cells[i].get_text(strip=True) if i < len(wind_cells) else ""
        rating_text = rating_cells[i].get_text(strip=True) if i < len(rating_cells) else ""
        
        forecasts.append({
            'time': f"{date_text} {time_text}",
            'wave_height_text': wh_text,
            'wave_height_m': float(match.group(1)) if match else None,
            'period_s': float(period_text) if period_text.replace('.', '', 1).isdigit() else period_text,
            'energy_kj': float(energy_text) if energy_text.replace('.', '', 1).isdigit() else energy_text,
            'wind_text': wind_text,
            'rating': int(rating_text) if rating_text.isdigit() else 0
        })

    today = datetime.now().strftime("%A %d")
    today_forecasts = [f for f in forecasts if f['time'].startswith(today)]
    
    return today_forecasts if today_forecasts else forecasts[:24]


if __name__ == "__main__":
    data = asyncio.run(get_hourly_forecast())
    print(json.dumps(data, indent=2, ensure_ascii=False))
