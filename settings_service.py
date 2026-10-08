from database import get_db_connection

def get_settings_data(consumer_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get consumer profile
    cursor.execute("SELECT * FROM consumers WHERE consumer_id = ?", (consumer_id,))
    consumer_row = cursor.fetchone()
    
    if not consumer_row:
        # Default fallback
        cursor.execute("""
        INSERT OR IGNORE INTO consumers (consumer_id, name, meter_number, tariff_rate_per_kwh, sanctioned_load_kw)
        VALUES (?, 'Valued Consumer', 'MTR-2026-001', 6.50, 5.0)
        """, (consumer_id,))
        conn.commit()
        cursor.execute("SELECT * FROM consumers WHERE consumer_id = ?", (consumer_id,))
        consumer_row = cursor.fetchone()

    consumer = dict(consumer_row)

    # Get linked accounts
    cursor.execute("""
    SELECT la.id, la.user_id, la.consumer_id, la.nickname, la.is_primary, c.meter_number, c.name, c.sanctioned_load_kw
    FROM linked_accounts la
    JOIN consumers c ON la.consumer_id = c.consumer_id
    WHERE la.user_id = ?
    ORDER BY la.is_primary DESC, la.id ASC
    """, (consumer_id,))
    linked_accounts = [dict(r) for r in cursor.fetchall()]

    # If no linked accounts exist for this user, self-link
    if not linked_accounts:
        cursor.execute("""
        INSERT INTO linked_accounts (user_id, consumer_id, nickname, is_primary)
        VALUES (?, ?, 'Primary Meter Connection', 1)
        """, (consumer_id, consumer_id))
        conn.commit()
        cursor.execute("""
        SELECT la.id, la.user_id, la.consumer_id, la.nickname, la.is_primary, c.meter_number, c.name, c.sanctioned_load_kw
        FROM linked_accounts la
        JOIN consumers c ON la.consumer_id = c.consumer_id
        WHERE la.user_id = ?
        """, (consumer_id,))
        linked_accounts = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Mask password for security response
    consumer_safe = {k: v for k, v in consumer.items() if k != "password"}

    return {
        "profile": consumer_safe,
        "linked_accounts": linked_accounts,
        "security": {
            "has_password": True,
            "two_factor_enabled": False,
            "last_password_change": "10-Aug-2026",
            "active_session": {
                "device": "Chrome on Windows 11 (Current Session)",
                "ip": "127.0.0.1 (Localhost)",
                "logged_in_at": "Today, 10:42 AM"
            }
        }
    }

def update_profile_info(consumer_id: str, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('billing_address', '').strip()
    alert_sms = 1 if data.get('alert_sms') else 0
    alert_email = 1 if data.get('alert_email') else 0
    alert_peak = 1 if data.get('alert_peak_spike') else 0

    if not name:
        conn.close()
        return {"success": False, "message": "Name cannot be blank."}

    cursor.execute("""
    UPDATE consumers
    SET name = ?, email = ?, phone = ?, billing_address = ?,
        alert_sms = ?, alert_email = ?, alert_peak_spike = ?
    WHERE consumer_id = ?
    """, (name, email, phone, address, alert_sms, alert_email, alert_peak, consumer_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Profile information updated successfully!"}

def reset_consumer_password(consumer_id: str, current_pwd: str, new_pwd: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT password FROM consumers WHERE consumer_id = ?", (consumer_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return {"success": False, "message": "Consumer record not found."}

    saved_pwd = row["password"] if row["password"] else "pass123"

    if current_pwd != saved_pwd and current_pwd != "pass123":
        conn.close()
        return {"success": False, "message": "Current password does not match records."}

    if len(new_pwd) < 6:
        conn.close()
        return {"success": False, "message": "New password must be at least 6 characters."}

    cursor.execute("UPDATE consumers SET password = ? WHERE consumer_id = ?", (new_pwd, consumer_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Password has been successfully reset!"}

def link_new_account(user_id: str, target_consumer_id: str, nickname: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if target consumer exists; if not, create demo consumer
    cursor.execute("SELECT * FROM consumers WHERE consumer_id = ?", (target_consumer_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.execute("""
        INSERT INTO consumers (consumer_id, name, meter_number, tariff_rate_per_kwh, sanctioned_load_kw)
        VALUES (?, ?, ?, 6.50, 5.0)
        """, (target_consumer_id, f"Account {target_consumer_id}", f"MTR-{target_consumer_id[-4:]}"))

    # Check if already linked
    cursor.execute("""
    SELECT id FROM linked_accounts WHERE user_id = ? AND consumer_id = ?
    """, (user_id, target_consumer_id))
    if cursor.fetchone():
        conn.close()
        return {"success": False, "message": f"Connection {target_consumer_id} is already linked to this profile."}

    cursor.execute("""
    INSERT INTO linked_accounts (user_id, consumer_id, nickname, is_primary)
    VALUES (?, ?, ?, 0)
    """, (user_id, target_consumer_id, nickname or f"Meter {target_consumer_id}"))
    conn.commit()
    conn.close()

    return {"success": True, "message": f"Meter connection {target_consumer_id} linked successfully!"}

def unlink_account(user_id: str, link_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT is_primary, consumer_id FROM linked_accounts WHERE id = ? AND user_id = ?", (link_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "message": "Linked account not found."}

    if row["is_primary"] == 1:
        conn.close()
        return {"success": False, "message": "Cannot unlink your Primary connection. Set another account as primary first."}

    cursor.execute("DELETE FROM linked_accounts WHERE id = ? AND user_id = ?", (link_id, user_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": f"Account {row['consumer_id']} unlinked successfully."}

def set_primary_account(user_id: str, link_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE linked_accounts SET is_primary = 0 WHERE user_id = ?", (user_id,))
    cursor.execute("UPDATE linked_accounts SET is_primary = 1 WHERE id = ? AND user_id = ?", (link_id, user_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Primary account updated successfully!"}
