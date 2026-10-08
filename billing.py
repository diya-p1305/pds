import uuid
import calendar
from datetime import datetime
from database import get_db_connection
from analytics import calculate_consumer_analytics

CURRENCY_SYMBOL = "₹"
CURRENCY_CODE = "INR"

# Indian Electricity Tariff Slab Rates (LT-1 Residential Domestic Schedule)
TARIFF_SLABS = [
    {
        "name": "Slab 1 (Lifeline / Subsidized)",
        "min_kwh": 0,
        "max_kwh": 100,
        "rate_per_unit": 3.80,
        "description": "First 100 units @ ₹3.80 / unit"
    },
    {
        "name": "Slab 2 (Standard Domestic)",
        "min_kwh": 100,
        "max_kwh": 300,
        "rate_per_unit": 6.50,
        "description": "Next 200 units (101-300) @ ₹6.50 / unit"
    },
    {
        "name": "Slab 3 (High Consumption)",
        "min_kwh": 300,
        "max_kwh": 99999,
        "rate_per_unit": 8.90,
        "description": "Above 300 units @ ₹8.90 / unit"
    }
]

FUEL_SURCHARGE_PER_UNIT = 0.85   # ₹0.85 per kWh (FPPPA / Fuel Adjustment Charge)
FIXED_METER_CHARGE = 110.00       # ₹110.00 per month (Fixed Demand & Meter Charge)
ELECTRICITY_DUTY_PCT = 0.06      # 6.0% State Electricity Regulatory Duty

def calculate_per_unit_breakdown(units: float):
    """
    Computes precise per-unit slab charges, fuel surcharges, fixed charges, and taxes in INR (₹).
    """
    remaining = units
    slab_breakdowns = []
    total_energy_charge = 0.0

    # Slab 1: 0 - 100 kWh @ ₹3.80
    s1_units = min(remaining, 100.0)
    s1_amount = round(s1_units * 3.80, 2)
    slab_breakdowns.append({
        "slab": "Slab 1 (0-100 units)",
        "units": round(s1_units, 1),
        "rate": 3.80,
        "amount": s1_amount
    })
    total_energy_charge += s1_amount
    remaining = max(0.0, remaining - s1_units)

    # Slab 2: 101 - 300 kWh @ ₹6.50
    s2_units = min(remaining, 200.0)
    s2_amount = round(s2_units * 6.50, 2)
    slab_breakdowns.append({
        "slab": "Slab 2 (101-300 units)",
        "units": round(s2_units, 1),
        "rate": 6.50,
        "amount": s2_amount
    })
    total_energy_charge += s2_amount
    remaining = max(0.0, remaining - s2_units)

    # Slab 3: > 300 kWh @ ₹8.90
    s3_units = remaining
    s3_amount = round(s3_units * 8.90, 2)
    slab_breakdowns.append({
        "slab": "Slab 3 (>300 units)",
        "units": round(s3_units, 1),
        "rate": 8.90,
        "amount": s3_amount
    })
    total_energy_charge += s3_amount

    fuel_surcharge = round(units * FUEL_SURCHARGE_PER_UNIT, 2)
    subtotal = round(total_energy_charge + fuel_surcharge + FIXED_METER_CHARGE, 2)
    tax_amount = round(subtotal * ELECTRICITY_DUTY_PCT, 2)
    grand_total = round(subtotal + tax_amount, 2)
    effective_rate_per_unit = round(grand_total / units, 2) if units > 0 else 6.50

    return {
        "currency": "INR",
        "currency_symbol": "₹",
        "units": units,
        "slabs": slab_breakdowns,
        "energy_charge": round(total_energy_charge, 2),
        "fuel_surcharge": fuel_surcharge,
        "fixed_meter_charge": FIXED_METER_CHARGE,
        "subtotal": subtotal,
        "tax_rate_pct": "6.0%",
        "tax_amount": tax_amount,
        "grand_total": grand_total,
        "effective_rate_per_unit": effective_rate_per_unit
    }

def get_consumer_billing_details(consumer_id: str):
    """
    Returns full billing overview in INR (₹): Estimated Amount, Per-Unit Breakdown, Active Bill, and Transactions.
    """
    analytics = calculate_consumer_analytics(consumer_id)
    creds = analytics["credentials"]
    consumer = analytics["consumer"]

    month_to_date_units = creds["average_consumption_month"]["total_recorded_kwh"]
    projected_month_units = creds["estimated_consumption"]["value"]

    # Calculate accrued vs projected amounts using INR tiered slab model
    accrued_calc = calculate_per_unit_breakdown(month_to_date_units)
    estimated_calc = calculate_per_unit_breakdown(projected_month_units)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch latest active or pending bill
    cursor.execute("""
    SELECT * FROM bills 
    WHERE consumer_id = ? 
    ORDER BY generated_at DESC LIMIT 1
    """, (consumer_id,))
    active_bill_row = cursor.fetchone()
    active_bill = dict(active_bill_row) if active_bill_row else None

    # Fetch all transactions
    cursor.execute("""
    SELECT * FROM transactions 
    WHERE consumer_id = ? 
    ORDER BY txn_date DESC
    """, (consumer_id,))
    txns = [dict(r) for r in cursor.fetchall()]

    # Fetch all bills history
    cursor.execute("""
    SELECT * FROM bills 
    WHERE consumer_id = ? 
    ORDER BY generated_at DESC
    """, (consumer_id,))
    bills_history = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "currency": "INR",
        "currency_symbol": "₹",
        "consumer": consumer,
        "period": analytics["period"],
        "estimated_amount_details": {
            "current_accrued_bill": f"₹{accrued_calc['grand_total']:,.2f}",
            "current_accrued_units": f"{month_to_date_units} kWh",
            "estimated_month_end_amount": f"₹{estimated_calc['grand_total']:,.2f}",
            "estimated_month_units": f"{projected_month_units} kWh",
            "due_date": "October 05, 2026",
            "payment_status": active_bill["status"] if active_bill else "PENDING",
            "days_remaining_in_cycle": creds["estimated_consumption"]["remaining_days"]
        },
        "per_unit_calculation": {
            "slab_definitions": TARIFF_SLABS,
            "fixed_meter_charge": FIXED_METER_CHARGE,
            "fuel_surcharge_per_kwh": FUEL_SURCHARGE_PER_UNIT,
            "tax_duty_pct": 6.0,
            "accrued_breakdown": accrued_calc,
            "estimated_breakdown": estimated_calc
        },
        "active_bill": active_bill,
        "bills_history": bills_history,
        "transactions": txns
    }

def generate_bill_invoice(consumer_id: str):
    """
    Generates a new official bill invoice in INR (₹) for the consumer based on month-to-date telemetry.
    """
    analytics = calculate_consumer_analytics(consumer_id)
    units = analytics["credentials"]["average_consumption_month"]["total_recorded_kwh"]
    calc = calculate_per_unit_breakdown(units)

    bill_id = f"INV-2026-09-{consumer_id.split('-')[-1]}"
    period_label = "September 2026 (Live Statement)"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT OR REPLACE INTO bills (
        bill_id, consumer_id, billing_period, units_kwh, base_amount, 
        fixed_charges, taxes, total_amount, due_date, status, generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2026-10-05', 'PENDING', ?)
    """, (
        bill_id, consumer_id, period_label, calc["units"], 
        calc["energy_charge"], calc["fixed_meter_charge"], calc["tax_amount"], 
        calc["grand_total"], now_str
    ))
    conn.commit()

    cursor.execute("SELECT * FROM bills WHERE bill_id = ?", (bill_id,))
    new_bill = dict(cursor.fetchone())
    conn.close()

    return {
        "success": True,
        "currency": "INR",
        "currency_symbol": "₹",
        "message": "Bill successfully generated in INR (₹)",
        "bill": new_bill,
        "breakdown": calc
    }

def process_bill_payment(consumer_id: str, bill_id: str, payment_method: str):
    """
    Processes payment for a bill in INR (₹), marks bill as PAID, and registers transaction receipt.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM bills WHERE bill_id = ?", (bill_id,))
    bill_row = cursor.fetchone()
    if not bill_row:
        conn.close()
        return {"success": False, "message": f"Bill {bill_id} not found."}

    bill = dict(bill_row)
    amount = bill["total_amount"]
    txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    ref_no = f"REF-{payment_method.split()[0].upper()}-{uuid.uuid4().hex[:6].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update bill status
    cursor.execute("UPDATE bills SET status = 'PAID' WHERE bill_id = ?", (bill_id,))

    # Insert transaction
    cursor.execute("""
    INSERT INTO transactions (txn_id, consumer_id, bill_id, txn_date, payment_method, amount, status, reference_no)
    VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)
    """, (txn_id, consumer_id, bill_id, now_str, payment_method, amount, ref_no))

    conn.commit()

    cursor.execute("SELECT * FROM transactions WHERE txn_id = ?", (txn_id,))
    txn = dict(cursor.fetchone())
    conn.close()

    return {
        "success": True,
        "currency": "INR",
        "currency_symbol": "₹",
        "message": f"Payment of ₹{amount:,.2f} processed successfully!",
        "transaction": txn,
        "updated_bill_status": "PAID"
    }
