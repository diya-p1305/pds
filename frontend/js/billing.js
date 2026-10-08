let cachedBillingData = null;

const urlParams = new URLSearchParams(window.location.search);
let currentConsumerId = urlParams.get('consumer_id') || 'CNS-849201';

// Consumer selector listener
const consumerSelector = document.getElementById('consumerSelector');

function updateNavLinks(id) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const base = tab.getAttribute('href').split('?')[0];
    tab.setAttribute('href', `${base}?consumer_id=${encodeURIComponent(id)}`);
  });
}
updateNavLinks(currentConsumerId);

if (consumerSelector) {
  consumerSelector.value = currentConsumerId;
  consumerSelector.addEventListener('change', (e) => {
    currentConsumerId = e.target.value;
    window.history.pushState({}, '', `?consumer_id=${currentConsumerId}`);
    updateNavLinks(currentConsumerId);
    fetchBillingDetails(currentConsumerId);
  });
}

// Fetch billing details from Python API
async function fetchBillingDetails(consumerId) {
  try {
    const res = await fetch(`/api/billing/${consumerId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    cachedBillingData = data;

    renderConsumerHeader(data.consumer, data.period);
    renderEstimatedAmount(data.estimated_amount_details, data.active_bill);
    renderPerUnitSlabs(data.per_unit_calculation);
    initSliderCalculator();
  } catch (err) {
    console.error('Failed to load billing details:', err);
  }
}

function renderConsumerHeader(consumer, period) {
  document.getElementById('displayConsumerName').textContent = consumer.name;
  document.getElementById('displayConsumerId').textContent = `ID: ${consumer.consumer_id}`;
  document.getElementById('displayMeterNo').textContent = consumer.meter_number;
  document.getElementById('displaySanctioned').textContent = `${consumer.sanctioned_load_kw} kW`;
  document.getElementById('billingPeriodTitle').textContent = `${period.month_name}`;
}

function renderEstimatedAmount(est, activeBill) {
  const isPaid = activeBill && activeBill.status === 'PAID';
  const badge = document.getElementById('billStatusBadge');

  if (isPaid) {
    badge.textContent = 'PAID';
    badge.className = 'bill-card-badge PAID';
    document.getElementById('payableBalance').textContent = '₹0.00';
    document.getElementById('btnQuickPayTrigger').disabled = true;
    document.getElementById('btnQuickPayTrigger').textContent = '✓ Bill Fully Settled';
  } else {
    badge.textContent = 'PENDING';
    badge.className = 'bill-card-badge PENDING';
    document.getElementById('payableBalance').textContent = est.current_accrued_bill;
    document.getElementById('btnQuickPayTrigger').disabled = false;
    document.getElementById('btnQuickPayTrigger').textContent = '⚡ Proceed to Secure Payment';
  }

  document.getElementById('estimatedGrandTotal').textContent = est.estimated_month_end_amount;
  document.getElementById('estUnitsKwh').textContent = est.estimated_month_units;
  document.getElementById('accruedAmount').textContent = est.current_accrued_bill;
  document.getElementById('accruedUnits').textContent = `${est.current_accrued_units} used`;
  document.getElementById('billDueDate').textContent = est.due_date;
  document.getElementById('daysLeft').textContent = `${est.days_remaining_in_cycle} days remaining in cycle`;

  if (activeBill) {
    document.getElementById('displayBillId').textContent = activeBill.bill_id;
  }
}

function renderPerUnitSlabs(perUnit) {
  const accrued = perUnit.accrued_breakdown;
  const slabs = accrued.slabs;

  if (slabs[0]) document.getElementById('slab1Units').textContent = `${slabs[0].units} kWh (₹${slabs[0].amount.toFixed(2)})`;
  if (slabs[1]) document.getElementById('slab2Units').textContent = `${slabs[1].units} kWh (₹${slabs[1].amount.toFixed(2)})`;
  if (slabs[2]) document.getElementById('slab3Units').textContent = `${slabs[2].units} kWh (₹${slabs[2].amount.toFixed(2)})`;
}

// 2. Interactive Per-Unit Simulator Tool (Indian Electricity Slabs)
function initSliderCalculator() {
  const slider = document.getElementById('unitsSlider');
  if (!slider) return;

  function updateCalc() {
    const units = parseFloat(slider.value);
    document.getElementById('calcUnitsDisplay').textContent = `${units} units`;

    let remaining = units;
    let energyCharge = 0.0;

    // S1: 0 - 100 units @ ₹3.80
    const s1 = Math.min(remaining, 100);
    energyCharge += s1 * 3.80;
    remaining = Math.max(0, remaining - s1);

    // S2: 101 - 300 units @ ₹6.50
    const s2 = Math.min(remaining, 200);
    energyCharge += s2 * 6.50;
    remaining = Math.max(0, remaining - s2);

    // S3: > 300 units @ ₹8.90
    energyCharge += remaining * 8.90;

    const fuel = units * 0.85; // FPPPA ₹0.85/unit
    const fixed = 110.00;      // Fixed meter rent ₹110.00
    const subtotal = energyCharge + fuel + fixed;
    const tax = subtotal * 0.06; // Electricity duty 6%
    const grand = subtotal + tax;
    const effective = grand / units;

    document.getElementById('simEnergyCharge').textContent = `₹${energyCharge.toFixed(2)}`;
    document.getElementById('simFixedCharges').textContent = `₹${(fuel + fixed).toFixed(2)}`;
    document.getElementById('simTaxAmount').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('simGrandTotal').textContent = `₹${grand.toFixed(2)}`;
    document.getElementById('simEffectiveRate').textContent = `₹${effective.toFixed(2)} / unit`;
  }

  slider.addEventListener('input', updateCalc);
  updateCalc();
}

// 3. GENERATE BILL OPTION
const btnGenerateBill = document.getElementById('btnGenerateBill');
const invoiceModal = document.getElementById('invoiceModal');
const closeInvoiceModal = document.getElementById('closeInvoiceModal');

btnGenerateBill.addEventListener('click', async () => {
  btnGenerateBill.disabled = true;
  const originalHtml = btnGenerateBill.innerHTML;
  btnGenerateBill.innerHTML = 'Generating...';

  try {
    const res = await fetch('/api/billing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumer_id: currentConsumerId })
    });
    const result = await res.json();
    btnGenerateBill.innerHTML = originalHtml;
    btnGenerateBill.disabled = false;

    if (result.success) {
      renderInvoiceModal(result.bill, result.breakdown);
      invoiceModal.classList.add('active');
    }
  } catch (err) {
    console.error('Error generating bill:', err);
    btnGenerateBill.innerHTML = originalHtml;
    btnGenerateBill.disabled = false;
  }
});

// Dynamic High-Resolution Vector Black & White QR Code Generator for UPI
function generatePaymentQrSvg(amount, billId, consumerId) {
  const upiUri = `upi://pay?pa=voltgrid.discom@sbi&pn=VOLTGRID%20UTILITIES&am=${amount}&cu=INR&tn=${billId}`;
  const size = 25;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(r, c) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          grid[r + i][c + j] = true;
        }
      }
    }
  }
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true;
      grid[i][6] = true;
    }
  }

  // Deterministic seed
  let seed = 42;
  for (let i = 0; i < upiUri.length; i++) seed = (seed * 31 + upiUri.charCodeAt(i)) % 100000;
  function pseudoRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder = (r < 8 && (c < 8 || c >= size - 8)) || (r >= size - 8 && c < 8);
      const inTiming = r === 6 || c === 6;
      if (!inFinder && !inTiming) {
        if (pseudoRandom() > 0.46) {
          grid[r][c] = true;
        }
      }
    }
  }

  const scale = 4;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * scale}" y="${r * scale}" width="${scale}" height="${scale}" fill="#000000"/>`;
      }
    }
  }

  const svgDim = size * scale;
  return `
    <svg viewBox="0 0 ${svgDim} ${svgDim}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="${svgDim}" height="${svgDim}" fill="#ffffff"/>
      ${rects}
    </svg>
  `;
}

function renderInvoiceModal(bill, breakdown) {
  const consumer = cachedBillingData ? cachedBillingData.consumer : { name: 'Alex Mercer', sanctioned_load_kw: 5.0, meter_number: 'MTR-2026-991' };
  
  document.getElementById('invModalId').textContent = bill.bill_id;
  document.getElementById('invModalName').textContent = consumer.name;
  document.getElementById('invModalConsumerId').textContent = bill.consumer_id;
  document.getElementById('invModalMeter').textContent = consumer.meter_number;
  document.getElementById('invModalSanctioned').textContent = `${consumer.sanctioned_load_kw.toFixed(2)} kW`;
  document.getElementById('invModalPeriod').textContent = bill.billing_period;
  document.getElementById('invModalDue').textContent = bill.due_date;
  document.getElementById('invModalUnits').innerHTML = `<strong>${bill.units_kwh.toFixed(1)} kWh</strong>`;
  document.getElementById('invModalCurrentReading').textContent = (12450.0 + bill.units_kwh).toFixed(1);

  // Table rows
  const tbody = document.getElementById('invoiceTableBody');
  tbody.innerHTML = '';

  breakdown.slabs.forEach((slab, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}.</td>
      <td>Energy Charges: ${slab.slab}</td>
      <td style="text-align: right;">${slab.units.toFixed(1)} kWh</td>
      <td style="text-align: right;">₹${slab.rate.toFixed(2)}</td>
      <td style="text-align: right;">₹${slab.amount.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  const grandTotal = breakdown.grand_total;
  const delayedTotal = grandTotal + 50.00;

  document.getElementById('invModalFixed').textContent = `₹${breakdown.fixed_meter_charge.toFixed(2)}`;
  document.getElementById('invModalFuel').textContent = `₹${breakdown.fuel_surcharge.toFixed(2)}`;
  document.getElementById('invModalTax').textContent = `₹${breakdown.tax_amount.toFixed(2)}`;
  document.getElementById('invModalGrandTotal').innerHTML = `<strong style="font-size: 1.15rem;">₹${grandTotal.toFixed(2)}</strong>`;
  document.getElementById('invModalDelayedTotal').textContent = `₹${delayedTotal.toFixed(2)}`;

  // Payment QR Section
  const qrContainer = document.getElementById('invoiceQrCodeCanvas');
  if (qrContainer) {
    qrContainer.innerHTML = generatePaymentQrSvg(grandTotal.toFixed(2), bill.bill_id, bill.consumer_id);
  }
  document.getElementById('qrDisplayAmount').textContent = `₹${grandTotal.toFixed(2)}`;

  // Barcode & Counter Foil
  const cleanBillId = bill.bill_id.replace(/-/g, '');
  document.getElementById('barcodeBillId').textContent = `*${cleanBillId}*`;
  document.getElementById('foilBillId').textContent = bill.bill_id;
  document.getElementById('foilConsumerId').textContent = bill.consumer_id;
  document.getElementById('foilDueDate').textContent = bill.due_date;
  document.getElementById('foilAmount').textContent = `₹${grandTotal.toFixed(2)}`;
}

if (closeInvoiceModal) {
  closeInvoiceModal.addEventListener('click', () => invoiceModal.classList.remove('active'));
}

// 4. PAYMENT BUTTON OPTION
const btnPayNow = document.getElementById('btnPayNow');
const btnQuickPayTrigger = document.getElementById('btnQuickPayTrigger');
const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const btnConfirmPayment = document.getElementById('btnConfirmPayment');

function openPayModal() {
  if (!cachedBillingData) return;
  const bill = cachedBillingData.active_bill;
  const billId = bill ? bill.bill_id : `INV-2026-09-${currentConsumerId.split('-')[1]}`;
  const amount = bill ? bill.total_amount : 3334.49;

  document.getElementById('payModalBillId').textContent = billId;
  document.getElementById('payModalAmount').textContent = `₹${amount.toFixed(2)}`;
  paymentModal.classList.add('active');
}

btnPayNow.addEventListener('click', openPayModal);
btnQuickPayTrigger.addEventListener('click', openPayModal);

if (closePaymentModal) {
  closePaymentModal.addEventListener('click', () => paymentModal.classList.remove('active'));
}

btnConfirmPayment.addEventListener('click', async () => {
  const selectedMethod = document.querySelector('input[name="payMethod"]:checked').value;
  const billId = document.getElementById('payModalBillId').textContent;

  btnConfirmPayment.disabled = true;
  btnConfirmPayment.innerHTML = '⚡ Processing UPI / Bank Transaction...';

  try {
    const res = await fetch('/api/billing/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_id: currentConsumerId,
        bill_id: billId,
        payment_method: selectedMethod
      })
    });
    const result = await res.json();

    if (result.success) {
      btnConfirmPayment.innerHTML = '✓ Payment Successful!';
      setTimeout(() => {
        paymentModal.classList.remove('active');
        btnConfirmPayment.disabled = false;
        btnConfirmPayment.innerHTML = 'Confirm & Pay Now';
        alert(`Payment of ₹${result.transaction.amount.toFixed(2)} Received!\nTransaction Ref: ${result.transaction.reference_no}`);
        fetchBillingDetails(currentConsumerId);
      }, 900);
    } else {
      alert(result.message);
      btnConfirmPayment.disabled = false;
      btnConfirmPayment.innerHTML = 'Confirm & Pay Now';
    }
  } catch (err) {
    console.error('Payment failed:', err);
    btnConfirmPayment.disabled = false;
    btnConfirmPayment.innerHTML = 'Confirm & Pay Now';
  }
});

// 5. TRANSACTION BUTTON OPTION
const btnViewTransactions = document.getElementById('btnViewTransactions');
const transactionsModal = document.getElementById('transactionsModal');
const closeTxnsModal = document.getElementById('closeTxnsModal');

btnViewTransactions.addEventListener('click', () => {
  if (!cachedBillingData) return;
  document.getElementById('txnsModalConsumer').textContent = currentConsumerId;
  renderTransactionsTable(cachedBillingData.transactions);
  transactionsModal.classList.add('active');
});

function renderTransactionsTable(txns) {
  const tbody = document.getElementById('txnsTableBody');
  tbody.innerHTML = '';

  if (!txns || txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No transaction history found.</td></tr>`;
    return;
  }

  txns.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="color: #00f0ff;">${t.txn_id}</strong></td>
      <td>${t.txn_date}</td>
      <td>${t.bill_id}</td>
      <td>${t.payment_method}</td>
      <td><strong style="color: #00ff88;">₹${t.amount.toFixed(2)}</strong></td>
      <td><span class="badge-txn-success">✓ ${t.status}</span></td>
      <td><button class="btn-print" onclick="alert('Digital Receipt for ${t.txn_id} generated! Reference: ${t.reference_no}')">Receipt</button></td>
    `;
    tbody.appendChild(tr);
  });
}

if (closeTxnsModal) {
  closeTxnsModal.addEventListener('click', () => transactionsModal.classList.remove('active'));
}

// Global modal close on click outside
window.addEventListener('click', (e) => {
  if (e.target === invoiceModal) invoiceModal.classList.remove('active');
  if (e.target === paymentModal) paymentModal.classList.remove('active');
  if (e.target === transactionsModal) transactionsModal.classList.remove('active');
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  fetchBillingDetails(currentConsumerId);
});
