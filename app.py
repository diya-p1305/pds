import os
from flask import Flask, jsonify, request, send_from_directory
from database import init_db, get_db_connection
from analytics import calculate_consumer_analytics, calculate_graphs_analytics
from billing import (
    get_consumer_billing_details,
    generate_bill_invoice,
    process_bill_payment,
    calculate_per_unit_breakdown
)
from settings_service import (
    get_settings_data,
    update_profile_info,
    reset_consumer_password,
    link_new_account,
    unlink_account,
    set_primary_account
)

app = Flask(__name__, static_folder='frontend', static_url_path='')

# Ensure database is initialized on startup
init_db()

@app.route('/')
def index():
    """Serves the front authentication page"""
    return send_from_directory('frontend', 'index.html')

@app.route('/consumption')
def consumption_page():
    """Serves the electricity consumption analytics page"""
    return send_from_directory('frontend', 'consumption.html')

@app.route('/graphs')
def graphs_page():
    """Serves the dedicated graphical bar charts interface page"""
    return send_from_directory('frontend', 'graphs.html')

@app.route('/billing')
def billing_page():
    """Serves the electricity billing, payment, and per-unit calculation page"""
    return send_from_directory('frontend', 'billing.html')

@app.route('/settings')
def settings_page():
    """Serves the profile settings, account manager, and password reset page"""
    return send_from_directory('frontend', 'settings.html')

@app.route('/context')
@app.route('/context.md')
def context_file():
    """Serves the mobile-ready context card file"""
    return send_from_directory('.', 'context.md', mimetype='text/markdown')

@app.route('/api/login', methods=['POST'])
def api_login():
    """Validates consumer ID and provides credentials"""
    data = request.get_json(silent=True) or {}
    consumer_id = data.get('consumer_id', '').strip()
    password = data.get('password', '').strip()

    if not consumer_id:
        return jsonify({"success": False, "message": "Consumer ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consumers WHERE consumer_id = ?", (consumer_id,))
    consumer = cursor.fetchone()

    if consumer:
        stored_pwd = consumer["password"] if consumer["password"] else "pass123"
        if password != stored_pwd:
            conn.close()
            return jsonify({
                "success": False,
                "message": f"Invalid password. Demo password is '{stored_pwd}'."
            }), 401
    else:
        # For convenience in demonstration: if consumer ID doesn't exist, create a demo profile
        name = "Consumer " + consumer_id.replace("CNS-", "")
        cursor.execute("""
        INSERT INTO consumers (consumer_id, name, meter_number, tariff_rate_per_kwh, sanctioned_load_kw, password)
        VALUES (?, ?, ?, 6.50, 5.0, ?)
        """, (consumer_id, name, f"MTR-{consumer_id[-4:]}", password or "pass123"))
        conn.commit()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Authentication successful",
        "consumer_id": consumer_id,
        "redirect_url": f"/consumption?consumer_id={consumer_id}"
    })

@app.route('/api/consumption/<consumer_id>', methods=['GET'])
def api_consumption(consumer_id):
    """
    Returns all Electricity Consumption credentials:
    - Daily Consumption
    - Average Consumption of Month
    - Maximum Consumption
    - Minimum Consumption
    - Estimated Consumption
    Plus detailed time-series telemetry
    """
    data = calculate_consumer_analytics(consumer_id)
    return jsonify(data)

@app.route('/api/graphs/<consumer_id>', methods=['GET'])
def api_graphs(consumer_id):
    """
    Returns dedicated graphical bar chart datasets for all electricity consumption metrics
    """
    data = calculate_graphs_analytics(consumer_id)
    return jsonify(data)

@app.route('/api/billing/<consumer_id>', methods=['GET'])
def api_billing(consumer_id):
    """
    Returns billing credentials:
    - Estimated amount details (accrued vs projected month-end total)
    - Per unit calculation (tiered slabs, fuel surcharge, taxes)
    - Active bill & past transactions
    """
    data = get_consumer_billing_details(consumer_id)
    return jsonify(data)

@app.route('/api/billing/generate', methods=['POST'])
def api_generate_bill():
    """
    Generates a new official bill invoice for the consumer
    """
    data = request.get_json(silent=True) or {}
    consumer_id = data.get('consumer_id', 'CNS-849201')
    result = generate_bill_invoice(consumer_id)
    return jsonify(result)

@app.route('/api/billing/pay', methods=['POST'])
def api_pay_bill():
    """
    Processes bill payment and creates transaction record
    """
    data = request.get_json(silent=True) or {}
    consumer_id = data.get('consumer_id', 'CNS-849201')
    bill_id = data.get('bill_id', '')
    payment_method = data.get('payment_method', 'UPI / SmartPay')
    result = process_bill_payment(consumer_id, bill_id, payment_method)
    return jsonify(result)

@app.route('/api/billing/calculate', methods=['POST'])
def api_calculate_units():
    """
    Interactive simulation helper: returns per-unit slab calculation for any custom units
    """
    data = request.get_json(silent=True) or {}
    units = float(data.get('units', 100))
    result = calculate_per_unit_breakdown(units)
    return jsonify(result)

# ==================== SETTINGS API ROUTES ====================
@app.route('/api/settings/<consumer_id>', methods=['GET'])
def api_get_settings(consumer_id):
    """
    Returns consumer profile, linked smart meters, and security metadata
    """
    data = get_settings_data(consumer_id)
    return jsonify(data)

@app.route('/api/settings/profile', methods=['POST'])
def api_update_profile():
    """
    Updates consumer profile information and notification preferences
    """
    data = request.get_json(silent=True) or {}
    consumer_id = data.get('consumer_id', 'CNS-849201')
    result = update_profile_info(consumer_id, data)
    return jsonify(result)

@app.route('/api/settings/password', methods=['POST'])
def api_reset_password():
    """
    Validates current password and updates to new password
    """
    data = request.get_json(silent=True) or {}
    consumer_id = data.get('consumer_id', 'CNS-849201')
    current_pwd = data.get('current_password', '')
    new_pwd = data.get('new_password', '')
    result = reset_consumer_password(consumer_id, current_pwd, new_pwd)
    return jsonify(result)

@app.route('/api/settings/accounts/link', methods=['POST'])
def api_link_account():
    """
    Links a new smart meter account to the user profile
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'CNS-849201')
    target_id = data.get('consumer_id', '').strip()
    nickname = data.get('nickname', '').strip()
    result = link_new_account(user_id, target_id, nickname)
    return jsonify(result)

@app.route('/api/settings/accounts/unlink', methods=['POST'])
def api_unlink_account():
    """
    Unlinks a secondary account
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'CNS-849201')
    link_id = int(data.get('link_id', 0))
    result = unlink_account(user_id, link_id)
    return jsonify(result)

@app.route('/api/settings/accounts/primary', methods=['POST'])
def api_set_primary_account():
    """
    Sets a linked account as primary
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'CNS-849201')
    link_id = int(data.get('link_id', 0))
    result = set_primary_account(user_id, link_id)
    return jsonify(result)

@app.route('/api/consumers', methods=['GET'])
def list_consumers():
    """Returns list of registered consumers for fast switching"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT consumer_id, name, meter_number FROM consumers")
    consumers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(consumers)

if __name__ == '__main__':
    print("[VOLTGRID] Starting Electricity Consumption Backend on http://localhost:4444")
    app.run(host='0.0.0.0', port=4444, debug=True)
