<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
  :root {
    --bg-dark: #070b14;
    --card-bg: #0e172a;
    --card-border: rgba(0, 240, 255, 0.25);
    --electric-cyan: #00f0ff;
    --electric-green: #00ff88;
    --electric-orange: #f97316;
    --electric-blue: #3b82f6;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
  }

  .mobile-container {
    max-width: 100%;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--text-primary);
  }

  .mobile-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin: 18px 0;
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 16px 18px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .card:hover {
    border-color: var(--electric-cyan);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-cyan { background: rgba(0, 240, 255, 0.15); color: var(--electric-cyan); border: 1px solid var(--electric-cyan); }
  .badge-green { background: rgba(0, 255, 136, 0.15); color: var(--electric-green); border: 1px solid var(--electric-green); }
  .badge-orange { background: rgba(249, 115, 22, 0.15); color: var(--electric-orange); border: 1px solid var(--electric-orange); }
  .badge-blue { background: rgba(59, 130, 246, 0.15); color: var(--electric-blue); border: 1px solid var(--electric-blue); }

  .metric-hero {
    font-size: 1.85rem;
    font-weight: 800;
    color: var(--electric-cyan);
    margin: 6px 0;
    letter-spacing: -0.5px;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .metric-unit {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .card-data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
    font-size: 0.86rem;
  }
  .card-data-row:last-child {
    border-bottom: none;
  }

  .card-label {
    color: var(--text-secondary);
    font-size: 0.82rem;
  }

  .card-value {
    color: #f8fafc;
    font-weight: 600;
    text-align: right;
  }

  .code-pill {
    background: rgba(0, 0, 0, 0.4);
    color: var(--electric-cyan);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(0, 240, 255, 0.2);
    font-size: 0.84rem;
  }

  @media (max-width: 600px) {
    .mobile-card-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .card {
      padding: 14px;
    }
    .metric-hero {
      font-size: 1.6rem;
    }
  }
</style>

<div class="mobile-container">

# ⚡ VOLTGRID System Context & Mobile Data Cards

> **System Overview**: Intelligent Smart Grid Electricity Analytics, Bar Chart Visual Telemetry, Multi-Slab Domestic Billing (INR ₹), Printable A4 Invoices with UPI QR, and Multi-Meter Management Portal.  
> **Server Port**: `http://localhost:4444/`  
> **Active Environment**: Python 3.14 + Flask 3.1.3 + SQLite (`electricity.db`)

---

## 📱 Mobile Cards View: Customer Credentials & Identity

<div class="mobile-card-grid">

  <!-- Card 1: User Login Credentials -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🔑 Customer Credentials</span>
      <span class="badge badge-cyan">Active Login</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Customer / User ID</span>
      <span class="card-value"><code class="code-pill">CNS-849201</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Account Password</span>
      <span class="card-value"><code class="code-pill">pass123</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Account Holder</span>
      <span class="card-value">Alex Mercer</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Access Portal URL</span>
      <span class="card-value"><a href="http://localhost:4444/" style="color: #00f0ff;">http://localhost:4444/</a></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">One-Click Auto-Fill</span>
      <span class="card-value" style="color: #00ff88;">Enabled on Login Page</span>
    </div>
  </div>

  <!-- Card 2: Consumer Identity & Physical Premises -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">👤 Consumer Profile</span>
      <span class="badge badge-blue">Verified</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Registered Name</span>
      <span class="card-value">Alex Mercer</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Registered Mobile</span>
      <span class="card-value">+91 98765 43210</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Registered Email</span>
      <span class="card-value">alex.mercer@voltgrid.in</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Physical Premises</span>
      <span class="card-value" style="max-width: 60%; font-size: 0.78rem;">Plot 42, Sec 18, Vadodara, Gujarat - 390007</span>
    </div>
  </div>

  <!-- Card 3: Technical Grid & Smart Meter Specs -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">⚙️ Grid Specifications</span>
      <span class="badge badge-green">Connected</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Smart Meter Serial</span>
      <span class="card-value"><code class="code-pill">MTR-2026-991</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Sanctioned Load</span>
      <span class="card-value" style="color: #00ff88; font-weight: 700;">5.00 kW</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Tariff Schedule</span>
      <span class="card-value">LT-1 Domestic Slabs</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Supply Phase & Frequency</span>
      <span class="card-value">1-Phase 230V / 50.02 Hz</span>
    </div>
  </div>

</div>

---

## 📱 Mobile Cards View: Electricity Consumption (5 Core Credentials)

<div class="mobile-card-grid">

  <!-- Card 4: Daily Consumption -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">⚡ 1. Daily Consumption</span>
      <span class="badge badge-cyan">Today</span>
    </div>
    <div class="metric-hero">
      25.6 <span class="metric-unit">kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Reading Timestamp</span>
      <span class="card-value">15-Sep-2026 (Live)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Day-on-Day Variance</span>
      <span class="card-value" style="color: #00ff88;">+7.1% vs yesterday</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Accrued Daily Energy Cost</span>
      <span class="card-value" style="color: #00f0ff; font-weight: 700;">₹166.40</span>
    </div>
  </div>

  <!-- Card 5: Average Consumption of Month -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">📊 2. Average Consumption</span>
      <span class="badge badge-blue">Month-to-Date</span>
    </div>
    <div class="metric-hero">
      27.5 <span class="metric-unit">kWh / day</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Total Logged Energy</span>
      <span class="card-value" style="color: #00f0ff; font-weight: 700;">413.0 kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Days Counted in Period</span>
      <span class="card-value">15 Days (Sep 1–15)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Average Daily Energy Cost</span>
      <span class="card-value">₹178.75 / day</span>
    </div>
  </div>

  <!-- Card 6: Maximum Consumption (Peak) -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🔥 3. Maximum Consumption</span>
      <span class="badge badge-orange">Peak Spike</span>
    </div>
    <div class="metric-hero" style="color: var(--electric-orange);">
      41.2 <span class="metric-unit">kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Recorded Date</span>
      <span class="card-value">08-Sep-2026</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Peak Instantaneous Demand</span>
      <span class="card-value" style="color: #fb923c; font-weight: 700;">4.90 kW</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Single Day Peak Cost</span>
      <span class="card-value">₹267.80</span>
    </div>
  </div>

  <!-- Card 7: Minimum Consumption (Eco) -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🌱 4. Minimum Consumption</span>
      <span class="badge badge-green">Eco Saver</span>
    </div>
    <div class="metric-hero" style="color: var(--electric-green);">
      12.1 <span class="metric-unit">kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Recorded Date</span>
      <span class="card-value">03-Sep-2026</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Standby Base Load</span>
      <span class="card-value" style="color: #00ff88; font-weight: 700;">0.38 kW</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Single Day Eco Cost</span>
      <span class="card-value">₹78.65</span>
    </div>
  </div>

  <!-- Card 8: Estimated Consumption (Month-End) -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">📈 5. Estimated Consumption</span>
      <span class="badge badge-cyan">Forecast</span>
    </div>
    <div class="metric-hero">
      825.9 <span class="metric-unit">kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Projected Total Monthly Bill</span>
      <span class="card-value" style="color: #00f0ff; font-weight: 700;">₹5,368.35</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Cycle Progress</span>
      <span class="card-value">15 of 30 Days (50% Elapsed)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Forecast Model Basis</span>
      <span class="card-value">15-Day Weighted Diurnal Run Rate</span>
    </div>
  </div>

</div>

---

## 📱 Mobile Cards View: Billing, INR Slabs & Payment QR

<div class="mobile-card-grid">

  <!-- Card 9: Active Month-to-Date Bill -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">💳 Active Bill (Sep 2026)</span>
      <span class="badge badge-orange">Payment Pending</span>
    </div>
    <div class="metric-hero" style="color: #fb923c;">
      ₹3,334.49 <span class="metric-unit">INR</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Invoice Reference Number</span>
      <span class="card-value"><code class="code-pill">INV-2026-09-849</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Billed Energy Volume</span>
      <span class="card-value">413.0 kWh</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Statutory Payment Due Date</span>
      <span class="card-value" style="color: #fb923c; font-weight: 700;">05-Oct-2026</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Effective Unit Rate</span>
      <span class="card-value">₹8.07 / kWh</span>
    </div>
  </div>

  <!-- Card 10: Tiered Tariff Slab Breakdown -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">📋 LT-1 Slab Calculation</span>
      <span class="badge badge-blue">Tariff Schedule</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Slab 1: 0 – 100 units @ ₹3.80</span>
      <span class="card-value">100.0 kWh → ₹380.00</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Slab 2: 101 – 300 units @ ₹6.50</span>
      <span class="card-value">200.0 kWh → ₹1,300.00</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Slab 3: >300 units @ ₹8.90</span>
      <span class="card-value">113.0 kWh → ₹1,005.70</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Fuel Surcharge (FPPPA) @ ₹0.85</span>
      <span class="card-value">413.0 kWh → ₹351.05</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Fixed Meter Charges</span>
      <span class="card-value">Monthly Flat → ₹110.00</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">State Electricity Duty (6.0%)</span>
      <span class="card-value">Statutory Tax → ₹187.74</span>
    </div>
  </div>

  <!-- Card 11: Printable A4 Invoice & UPI Bharat QR -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🖨️ A4 Monochrome Invoice</span>
      <span class="badge badge-green">Ready to Print</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Aspect Ratio & Layout</span>
      <span class="card-value">A4 Portrait (1 : 1.414)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Color Palette</span>
      <span class="card-value">Pure Black & White (#000000 / #ffffff)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Integrated Payment QR</span>
      <span class="card-value">Vector SVG UPI Bharat QR</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Virtual Payment Address (VPA)</span>
      <span class="card-value"><code class="code-pill">voltgrid.discom@sbi</code></span>
    </div>
  </div>

  <!-- Card 12: Payment History & Verified Transactions -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🏦 Transaction History</span>
      <span class="badge badge-cyan">Settled</span>
    </div>
    <div class="card-data-row">
      <span class="card-label"><code class="code-pill">TXN-9842109</code> (03-Sep)</span>
      <span class="card-value" style="color: #00ff88;">₹5,639.20 (UPI) ✓</span>
    </div>
    <div class="card-data-row">
      <span class="card-label"><code class="code-pill">TXN-8741002</code> (04-Aug)</span>
      <span class="card-value" style="color: #00ff88;">₹5,420.00 (Visa) ✓</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Payment Gateway Status</span>
      <span class="card-value">Instant Webhook Settlement</span>
    </div>
  </div>

</div>

---

## 📱 Mobile Cards View: Multi-Meter Accounts & Security Settings

<div class="mobile-card-grid">

  <!-- Card 13: Primary Residence Connection -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🏠 Primary Smart Meter</span>
      <span class="badge badge-cyan">PRIMARY</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Consumer ID</span>
      <span class="card-value"><code class="code-pill">CNS-849201</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Meter Serial No.</span>
      <span class="card-value">MTR-2026-991</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Sanctioned Load</span>
      <span class="card-value">5.0 kW</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Connection Nickname</span>
      <span class="card-value">Primary Residence (Home)</span>
    </div>
  </div>

  <!-- Card 14: Secondary Commercial Connection -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🏢 Secondary Connection</span>
      <span class="badge badge-blue">LINKED</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Consumer ID</span>
      <span class="card-value"><code class="code-pill">CNS-102948</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Meter Serial No.</span>
      <span class="card-value">MTR-2026-442</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Sanctioned Load</span>
      <span class="card-value">7.0 kW</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Connection Nickname</span>
      <span class="card-value">Commercial Workshop</span>
    </div>
  </div>

  <!-- Card 15: Security & Password Reset -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🔒 Security & Authentication</span>
      <span class="badge badge-orange">Secured</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Password Policy</span>
      <span class="card-value">Min 6 characters (Enforced)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Password Strength Engine</span>
      <span class="card-value">Entropy Bar (Weak/Med/Strong)</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Current Active Session</span>
      <span class="card-value">Chrome on Windows 11</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Connected Remote IP</span>
      <span class="card-value" style="color: #00ff88;">127.0.0.1 (Localhost)</span>
    </div>
  </div>

</div>

---

## 📱 Mobile Cards View: 4 Portal Pages & REST API Architecture

<div class="mobile-card-grid">

  <!-- Card 16: Front Authentication Page -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">🌐 Page 0: Login Portal</span>
      <span class="badge badge-cyan">Route: /</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">File Reference</span>
      <span class="card-value"><code class="code-pill">frontend/index.html</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Theme Background</span>
      <span class="card-value">Canvas Particles & Electric City</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Features Included</span>
      <span class="card-value">Consumer ID, Password, Show/Hide Eye, Auto Fill</span>
    </div>
  </div>

  <!-- Card 17: Page 1: Consumption Overview -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">⚡ Page 1: Overview</span>
      <span class="badge badge-cyan">Route: /consumption</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">File Reference</span>
      <span class="card-value"><code class="code-pill">frontend/consumption.html</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">API Data Source</span>
      <span class="card-value"><code class="code-pill">GET /api/consumption/&lt;id&gt;</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Features Included</span>
      <span class="card-value">5 Core Cards, 24h Curve, 15-day Table</span>
    </div>
  </div>

  <!-- Card 18: Page 2: Graphical Bar Charts Interface -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">📊 Page 2: Bar Charts</span>
      <span class="badge badge-blue">Route: /graphs</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">File Reference</span>
      <span class="card-value"><code class="code-pill">frontend/graphs.html</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">API Data Source</span>
      <span class="card-value"><code class="code-pill">GET /api/graphs/&lt;id&gt;</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Features Included</span>
      <span class="card-value">5 Bar Charts, kWh/₹ Toggle, Delta Variance</span>
    </div>
  </div>

  <!-- Card 19: Page 3: Billing & Payments in INR -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">💳 Page 3: Billing (INR)</span>
      <span class="badge badge-orange">Route: /billing</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">File Reference</span>
      <span class="card-value"><code class="code-pill">frontend/billing.html</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">API Data Source</span>
      <span class="card-value"><code class="code-pill">GET /api/billing/&lt;id&gt;</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Features Included</span>
      <span class="card-value">Slab Simulator, Pay Modal, A4 Printable Invoice with QR</span>
    </div>
  </div>

  <!-- Card 20: Page 4: Settings & Multi-Meter Manager -->
  <div class="card">
    <div class="card-header">
      <span class="card-title">⚙️ Page 4: Settings</span>
      <span class="badge badge-green">Route: /settings</span>
    </div>
    <div class="card-data-row">
      <span class="card-label">File Reference</span>
      <span class="card-value"><code class="code-pill">frontend/settings.html</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">API Data Source</span>
      <span class="card-value"><code class="code-pill">GET /api/settings/&lt;id&gt;</code></span>
    </div>
    <div class="card-data-row">
      <span class="card-label">Features Included</span>
      <span class="card-value">Profile Save, Account Link/Unlink, Password Reset</span>
    </div>
  </div>

</div>

---

## 🚀 Quick Navigation Links (Port 4444)

* 🌐 **Front Sign-In**: [http://localhost:4444/](http://localhost:4444/)
* ⚡ **Page 1 — Consumption Overview**: [http://localhost:4444/consumption?consumer_id=CNS-849201](http://localhost:4444/consumption?consumer_id=CNS-849201)
* 📊 **Page 2 — Graphical Bar Charts**: [http://localhost:4444/graphs?consumer_id=CNS-849201](http://localhost:4444/graphs?consumer_id=CNS-849201)
* 💳 **Page 3 — Billing & A4 Invoice (INR)**: [http://localhost:4444/billing?consumer_id=CNS-849201](http://localhost:4444/billing?consumer_id=CNS-849201)
* ⚙️ **Page 4 — Profile & Settings**: [http://localhost:4444/settings?consumer_id=CNS-849201](http://localhost:4444/settings?consumer_id=CNS-849201)

</div>
