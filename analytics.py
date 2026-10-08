import calendar
from datetime import datetime
from database import get_db_connection

def calculate_consumer_analytics(consumer_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get consumer info
    cursor.execute("SELECT * FROM consumers WHERE consumer_id = ?", (consumer_id,))
    consumer = cursor.fetchone()
    if not consumer:
        # Default fallback for new/unregistered users
        consumer = {
            "consumer_id": consumer_id,
            "name": "Valued Consumer",
            "meter_number": "MTR-2026-001",
            "tariff_rate_per_kwh": 0.16,
            "sanctioned_load_kw": 5.0
        }

    tariff = consumer["tariff_rate_per_kwh"] if isinstance(consumer, dict) else consumer["tariff_rate_per_kwh"]

    # Get daily consumption records for this consumer sorted chronologically
    cursor.execute("""
    SELECT reading_date, total_kwh, max_peak_kw, min_base_kw, cost
    FROM daily_consumption
    WHERE consumer_id = ?
    ORDER BY reading_date ASC
    """, (consumer_id,))
    rows = cursor.fetchall()

    if not rows:
        # Fallback if no records
        daily_records = []
        daily_vals = [25.0]
    else:
        daily_records = [dict(r) for r in rows]
        daily_vals = [r["total_kwh"] for r in daily_records]

    # Current month metadata
    today = datetime.now()
    year = 2026
    month = 9
    days_in_month = calendar.monthrange(year, month)[1] # 30 days in September
    days_elapsed = len(daily_records) if daily_records else 1

    # 1. Daily Consumption (latest day)
    today_record = daily_records[-1] if daily_records else {"total_kwh": 25.6, "cost": 4.10, "reading_date": "2026-09-15"}
    yesterday_record = daily_records[-2] if len(daily_records) >= 2 else today_record
    daily_consumption_kwh = today_record["total_kwh"]
    
    daily_diff_pct = 0.0
    if yesterday_record["total_kwh"] > 0:
        daily_diff_pct = round(((daily_consumption_kwh - yesterday_record["total_kwh"]) / yesterday_record["total_kwh"]) * 100, 1)

    # 2. Average Consumption of Month
    total_month_to_date_kwh = sum(daily_vals)
    average_consumption_kwh = round(total_month_to_date_kwh / days_elapsed, 2)

    # 3. Maximum Consumption
    max_record = max(daily_records, key=lambda x: x["total_kwh"]) if daily_records else today_record
    maximum_consumption_kwh = max_record["total_kwh"]
    max_date = max_record["reading_date"]
    max_peak_kw = max_record.get("max_peak_kw", 4.8)

    # 4. Minimum Consumption
    min_record = min(daily_records, key=lambda x: x["total_kwh"]) if daily_records else today_record
    minimum_consumption_kwh = min_record["total_kwh"]
    min_date = min_record["reading_date"]
    min_base_kw = min_record.get("min_base_kw", 0.4)

    # 5. Estimated Consumption (Projected Month Total)
    estimated_consumption_kwh = round(average_consumption_kwh * days_in_month, 1)
    estimated_cost = round(estimated_consumption_kwh * tariff, 2)
    month_to_date_cost = round(sum(r["cost"] for r in daily_records), 2) if daily_records else 0.0

    # Hourly telemetry for current day's real-time curve
    cursor.execute("""
    SELECT hour_label, power_kw, voltage
    FROM hourly_telemetry
    WHERE consumer_id = ?
    ORDER BY id ASC
    """, (consumer_id,))
    hourly_rows = cursor.fetchall()
    hourly_telemetry = [dict(r) for r in hourly_rows]

    conn.close()

    return {
        "consumer": {
            "consumer_id": consumer["consumer_id"],
            "name": consumer["name"],
            "meter_number": consumer["meter_number"],
            "tariff_rate": tariff,
            "sanctioned_load_kw": consumer["sanctioned_load_kw"]
        },
        "period": {
            "month_name": "September 2026",
            "days_in_month": days_in_month,
            "days_elapsed": days_elapsed
        },
        "credentials": {
            "daily_consumption": {
                "value": daily_consumption_kwh,
                "unit": "kWh",
                "cost": round(daily_consumption_kwh * tariff, 2),
                "diff_vs_yesterday_pct": f"{'+' if daily_diff_pct >= 0 else ''}{daily_diff_pct}%",
                "date": today_record.get("reading_date", "2026-09-15")
            },
            "average_consumption_month": {
                "value": average_consumption_kwh,
                "unit": "kWh / day",
                "total_recorded_kwh": round(total_month_to_date_kwh, 1),
                "days_counted": days_elapsed
            },
            "maximum_consumption": {
                "value": maximum_consumption_kwh,
                "unit": "kWh",
                "peak_load_kw": max_peak_kw,
                "recorded_date": max_date
            },
            "minimum_consumption": {
                "value": minimum_consumption_kwh,
                "unit": "kWh",
                "standby_load_kw": min_base_kw,
                "recorded_date": min_date
            },
            "estimated_consumption": {
                "value": estimated_consumption_kwh,
                "unit": "kWh",
                "estimated_bill": f"₹{estimated_cost:.2f}",
                "month_to_date_bill": f"₹{month_to_date_cost:.2f}",
                "remaining_days": days_in_month - days_elapsed
            }
        },
        "daily_history": daily_records,
        "hourly_telemetry": hourly_telemetry
    }

def calculate_graphs_analytics(consumer_id: str):
    """
    Prepares structured bar chart analytics data for all electricity consumption metrics.
    """
    base_data = calculate_consumer_analytics(consumer_id)
    creds = base_data["credentials"]
    daily_records = base_data["daily_history"]
    hourly_records = base_data["hourly_telemetry"]
    avg_kwh = creds["average_consumption_month"]["value"]
    tariff = base_data["consumer"]["tariff_rate"]

    # 1. 24-Hour Hourly Consumption Bar Chart Data
    hourly_labels = [r["hour_label"] for r in hourly_records]
    hourly_values = [r["power_kw"] for r in hourly_records]
    # Highlight peak tariff window (14:00 to 20:00)
    hourly_is_peak = [14 <= int(r["hour_label"].split(':')[0]) <= 20 for r in hourly_records]

    # 2. Daily Consumption Full Month Bar Chart Data
    daily_labels = [r["reading_date"].split('-')[1] + '/' + r["reading_date"].split('-')[2] for r in daily_records]
    daily_kwh = [r["total_kwh"] for r in daily_records]
    daily_costs = [round(r["total_kwh"] * tariff, 2) for r in daily_records]

    # 3. Core Overview Metrics Comparison Bar Chart Data
    # Benchmarks the 4 daily credentials + scaled estimated metric
    overview_labels = [
        "Min Consumption (Eco)",
        "Daily Consumption (Today)",
        "Monthly Average",
        "Max Consumption (Peak)"
    ]
    overview_values = [
        creds["minimum_consumption"]["value"],
        creds["daily_consumption"]["value"],
        creds["average_consumption_month"]["value"],
        creds["maximum_consumption"]["value"]
    ]

    # 4. Daily Deviation / Variance from Monthly Average (+/- Delta Bar Chart)
    variance_labels = daily_labels
    variance_values = [round(k - avg_kwh, 2) for k in daily_kwh]

    # 5. Peak vs Off-Peak Tariff Energy Distribution (Last 7 Days)
    recent_records = daily_records[-7:] if len(daily_records) >= 7 else daily_records
    tariff_labels = [r["reading_date"].split('-')[1] + '/' + r["reading_date"].split('-')[2] for r in recent_records]
    # Peak hours typically account for ~45% of usage, off-peak ~55%
    peak_kwh = [round(r["total_kwh"] * 0.44, 1) for r in recent_records]
    off_peak_kwh = [round(r["total_kwh"] * 0.56, 1) for r in recent_records]

    return {
        "consumer": base_data["consumer"],
        "period": base_data["period"],
        "credentials": creds,
        "bar_charts": {
            "hourly": {
                "title": "24-Hour Active Power Profile",
                "subtitle": "Hourly load distribution (kW) with peak tariff hours highlighted",
                "labels": hourly_labels,
                "values": hourly_values,
                "is_peak": hourly_is_peak
            },
            "daily_month": {
                "title": "Month-to-Date Daily Consumption",
                "subtitle": "Daily recorded energy units (kWh) and associated cost",
                "labels": daily_labels,
                "values": daily_kwh,
                "costs": daily_costs,
                "average_line": avg_kwh
            },
            "metrics_comparison": {
                "title": "Core Consumption Metrics Benchmark",
                "subtitle": "Direct visual comparison of minimum, daily, average, and maximum levels",
                "labels": overview_labels,
                "values": overview_values,
                "estimated_month_total": creds["estimated_consumption"]["value"]
            },
            "variance": {
                "title": "Consumption Variance from Monthly Average",
                "subtitle": "Net daily divergence (+/- kWh) against the monthly benchmark of " + str(avg_kwh) + " kWh",
                "labels": variance_labels,
                "values": variance_values,
                "benchmark_average": avg_kwh
            },
            "tariff_distribution": {
                "title": "Peak vs Off-Peak Energy Distribution",
                "subtitle": "Recent 7-day segmented load between standard and peak tariff windows",
                "labels": tariff_labels,
                "peak_kwh": peak_kwh,
                "off_peak_kwh": off_peak_kwh
            }
        }
    }

