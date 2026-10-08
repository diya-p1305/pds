let monthlyChartInstance = null;
let hourlyChartInstance = null;

// Parse consumer ID from URL parameter or default to 'CNS-849201'
const urlParams = new URLSearchParams(window.location.search);
let currentConsumerId = urlParams.get('consumer_id') || 'CNS-849201';

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
    loadConsumptionData(currentConsumerId);
  });
}

async function loadConsumptionData(consumerId) {
  try {
    const response = await fetch(`/api/consumption/${consumerId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    renderConsumerMetadata(data.consumer, data.period);
    renderCredentials(data.credentials);
    renderMonthlyChart(data.daily_history, data.credentials);
    renderHourlyChart(data.hourly_telemetry);
    renderTable(data.daily_history, data.consumer.tariff_rate);
  } catch (error) {
    console.error('Error fetching consumption analytics:', error);
  }
}

function renderConsumerMetadata(consumer, period) {
  document.getElementById('displayConsumerName').textContent = consumer.name;
  document.getElementById('displayConsumerId').textContent = `ID: ${consumer.consumer_id}`;
  document.getElementById('displayMeterNo').textContent = consumer.meter_number;
  document.getElementById('displayTariff').textContent = `₹${consumer.tariff_rate.toFixed(2)} / kWh`;
  document.getElementById('currentMonthLabel').textContent = `${period.month_name} (${period.days_elapsed}/${period.days_in_month} days)`;
}

function renderCredentials(creds) {
  // 1. Daily Consumption
  document.getElementById('valDaily').textContent = creds.daily_consumption.value.toFixed(1);
  document.getElementById('diffDaily').textContent = `${creds.daily_consumption.diff_vs_yesterday_pct} vs yesterday`;
  document.getElementById('costDaily').textContent = `₹${creds.daily_consumption.cost.toFixed(2)}`;

  // 2. Average Consumption of Month
  document.getElementById('valAvg').textContent = creds.average_consumption_month.value.toFixed(1);
  document.getElementById('totalRecordedKwh').textContent = `${creds.average_consumption_month.total_recorded_kwh} kWh`;
  document.getElementById('daysCounted').textContent = `${creds.average_consumption_month.days_counted} days logged`;

  // 3. Maximum Consumption
  document.getElementById('valMax').textContent = creds.maximum_consumption.value.toFixed(1);
  document.getElementById('maxPeakKw').textContent = `${creds.maximum_consumption.peak_load_kw} kW`;
  document.getElementById('maxDate').textContent = `On ${creds.maximum_consumption.recorded_date}`;

  // 4. Minimum Consumption
  document.getElementById('valMin').textContent = creds.minimum_consumption.value.toFixed(1);
  document.getElementById('minBaseKw').textContent = `${creds.minimum_consumption.standby_load_kw} kW`;
  document.getElementById('minDate').textContent = `On ${creds.minimum_consumption.recorded_date}`;

  // 5. Estimated Consumption
  document.getElementById('valEstimated').textContent = creds.estimated_consumption.value.toFixed(1);
  document.getElementById('estBill').textContent = creds.estimated_consumption.estimated_bill;
  document.getElementById('remainingDays').textContent = `${creds.estimated_consumption.remaining_days} days remaining`;
}

function renderMonthlyChart(history, creds) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  
  const labels = history.map(h => h.reading_date.split('-').slice(1).join('/'));
  const values = history.map(h => h.total_kwh);
  const avgVal = creds.average_consumption_month.value;
  const maxVal = creds.maximum_consumption.value;
  const minVal = creds.minimum_consumption.value;

  if (monthlyChartInstance) monthlyChartInstance.destroy();

  // Create gradient for bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
  gradient.addColorStop(1, 'rgba(0, 136, 255, 0.15)');

  monthlyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Daily kWh',
          data: values,
          backgroundColor: gradient,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.65
        },
        {
          label: 'Month Average',
          data: new Array(values.length).fill(avgVal),
          type: 'line',
          borderColor: '#60a5fa',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Max Peak',
          data: new Array(values.length).fill(maxVal),
          type: 'line',
          borderColor: '#fb923c',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Min Eco',
          data: new Array(values.length).fill(minVal),
          type: 'line',
          borderColor: '#34d399',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#00f0ff',
          bodyColor: '#fff',
          borderColor: 'rgba(0, 240, 255, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.parsed.y} kWh`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: 'Energy (kWh)', color: '#64748b', font: { size: 12 } }
        }
      }
    }
  });
}

function renderHourlyChart(hourly) {
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  const labels = hourly.map(h => h.hour_label);
  const powers = hourly.map(h => h.power_kw);

  if (hourlyChartInstance) hourlyChartInstance.destroy();

  const fillGradient = ctx.createLinearGradient(0, 0, 0, 240);
  fillGradient.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
  fillGradient.addColorStop(1, 'rgba(0, 255, 136, 0.0)');

  hourlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Active Load (kW)',
        data: powers,
        borderColor: '#00ff88',
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: '#00ff88',
        pointRadius: 2,
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: fillGradient
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#00ff88',
          bodyColor: '#fff',
          borderColor: 'rgba(0, 255, 136, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (item) => `Load: ${item.parsed.y} kW`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#94a3b8', maxTicksLimit: 8, font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: 'Power (kW)', color: '#64748b', font: { size: 12 } }
        }
      }
    }
  });
}

function renderTable(history, tariff) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  // Show in reverse chronological order (newest first)
  const reversed = [...history].reverse();

  reversed.forEach(row => {
    let statusClass = 'normal';
    let statusText = 'Normal';

    if (row.total_kwh >= 35) {
      statusClass = 'peak';
      statusText = 'High Peak';
    } else if (row.total_kwh <= 18) {
      statusClass = 'optimal';
      statusText = 'Eco Saver';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${row.reading_date}</strong></td>
      <td><span style="color: #00f0ff; font-weight: 700;">${row.total_kwh.toFixed(1)} kWh</span></td>
      <td>${row.max_peak_kw.toFixed(2)} kW</td>
      <td>${row.min_base_kw.toFixed(2)} kW</td>
      <td>₹${row.cost.toFixed(2)}</td>
      <td><span class="badge-status ${statusClass}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Initial fetch on page load
document.addEventListener('DOMContentLoaded', () => {
  loadConsumptionData(currentConsumerId);
});
