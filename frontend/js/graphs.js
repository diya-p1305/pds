let chartInstances = {};
let cachedGraphData = null;
let currentUnitMode = 'kwh'; // 'kwh' or 'cost'

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
    fetchAndRenderGraphs(currentConsumerId);
  });
}

// Unit Mode Toggle (kWh vs Cost)
const btnUnitKwh = document.getElementById('btnUnitKwh');
const btnUnitCost = document.getElementById('btnUnitCost');

if (btnUnitKwh && btnUnitCost) {
  btnUnitKwh.addEventListener('click', () => {
    if (currentUnitMode === 'kwh') return;
    currentUnitMode = 'kwh';
    btnUnitKwh.classList.add('active');
    btnUnitCost.classList.remove('active');
    if (cachedGraphData) renderAllBarCharts(cachedGraphData.bar_charts, cachedGraphData.consumer);
  });

  btnUnitCost.addEventListener('click', () => {
    if (currentUnitMode === 'cost') return;
    currentUnitMode = 'cost';
    btnUnitCost.classList.add('active');
    btnUnitKwh.classList.remove('active');
    if (cachedGraphData) renderAllBarCharts(cachedGraphData.bar_charts, cachedGraphData.consumer);
  });
}

async function fetchAndRenderGraphs(consumerId) {
  try {
    const res = await fetch(`/api/graphs/${consumerId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    cachedGraphData = data;

    renderConsumerHeader(data.consumer, data.period);
    renderSummaryRibbon(data.credentials);
    renderAllBarCharts(data.bar_charts, data.consumer);
  } catch (err) {
    console.error('Failed to load graphs analytics:', err);
  }
}

function renderConsumerHeader(consumer, period) {
  document.getElementById('displayConsumerName').textContent = consumer.name;
  document.getElementById('displayConsumerId').textContent = `ID: ${consumer.consumer_id}`;
  document.getElementById('currentMonthLabel').textContent = `${period.month_name} (${period.days_elapsed}/${period.days_in_month} days)`;
}

function renderSummaryRibbon(creds) {
  document.getElementById('ribbonDaily').textContent = `${creds.daily_consumption.value.toFixed(1)} kWh`;
  document.getElementById('ribbonAvg').textContent = `${creds.average_consumption_month.value.toFixed(1)} kWh/d`;
  document.getElementById('ribbonMax').textContent = `${creds.maximum_consumption.value.toFixed(1)} kWh`;
  document.getElementById('ribbonMin').textContent = `${creds.minimum_consumption.value.toFixed(1)} kWh`;
  document.getElementById('ribbonEst').textContent = `${creds.estimated_consumption.value.toFixed(1)} kWh`;
}

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function renderAllBarCharts(charts, consumer) {
  const tariff = consumer.tariff_rate;

  // 1. Month-to-Date Daily Bar Chart
  renderDailyMonthBarChart(charts.daily_month, tariff);

  // 2. Overview Credentials Benchmark Bar Chart
  renderOverviewMetricsBarChart(charts.metrics_comparison, tariff);

  // 3. 24-Hour Active Power Hourly Bar Chart
  renderHourlyBarChart(charts.hourly);

  // 4. Daily Variance Diverging Bar Chart
  renderVarianceBarChart(charts.variance, tariff);

  // 5. Peak vs Off-Peak Tariff Grouped Bar Chart
  renderTariffGroupedBarChart(charts.tariff_distribution, tariff);
}

// 1. Month-to-Date Daily Consumption Bar Chart
function renderDailyMonthBarChart(data, tariff) {
  destroyChart('dailyMonth');
  const ctx = document.getElementById('barChartDailyMonth').getContext('2d');

  const values = currentUnitMode === 'kwh' ? data.values : data.costs;
  const unitLabel = currentUnitMode === 'kwh' ? 'kWh' : '₹';

  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
  gradient.addColorStop(1, 'rgba(0, 136, 255, 0.25)');

  chartInstances['dailyMonth'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: currentUnitMode === 'kwh' ? 'Daily Energy' : 'Daily Cost',
        data: values,
        backgroundColor: gradient,
        borderColor: '#00f0ff',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.65
      }]
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
            label: (item) => `${item.parsed.y.toFixed(2)} ${unitLabel}`
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
          title: { display: true, text: unitLabel, color: '#64748b' }
        }
      }
    }
  });
}

// 2. Overview Credentials Benchmark Bar Chart
function renderOverviewMetricsBarChart(data, tariff) {
  destroyChart('overviewMetrics');
  const ctx = document.getElementById('barChartOverviewMetrics').getContext('2d');

  const values = currentUnitMode === 'kwh' 
    ? data.values 
    : data.values.map(v => Number((v * tariff).toFixed(2)));
  const unitLabel = currentUnitMode === 'kwh' ? 'kWh' : '₹';

  // Distinct color per benchmark
  const barColors = [
    'rgba(16, 185, 129, 0.85)', // Min (Emerald)
    'rgba(0, 240, 255, 0.85)',  // Daily (Cyan)
    'rgba(59, 130, 246, 0.85)',  // Average (Blue)
    'rgba(249, 115, 22, 0.85)'   // Max (Orange)
  ];
  const borderColors = ['#10b981', '#00f0ff', '#3b82f6', '#f97316'];

  chartInstances['overviewMetrics'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Min (Eco)', 'Daily (Today)', 'Month Avg', 'Max (Peak)'],
      datasets: [{
        label: 'Metric Benchmark',
        data: values,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 8,
        barPercentage: 0.55
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          bodyColor: '#fff',
          callbacks: {
            label: (item) => `${item.label}: ${item.parsed.y.toFixed(1)} ${unitLabel}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#e2e8f0', font: { size: 11, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: unitLabel, color: '#64748b' }
        }
      }
    }
  });
}

// 3. 24-Hour Hourly Power Load Profile Bar Chart
function renderHourlyBarChart(data) {
  destroyChart('hourly');
  const ctx = document.getElementById('barChartHourly').getContext('2d');

  // Peak hours (2PM-8PM) styled in orange, others in neon green
  const barColors = data.is_peak.map(isPeak => 
    isPeak ? 'rgba(249, 115, 22, 0.85)' : 'rgba(0, 255, 136, 0.75)'
  );
  const borderColors = data.is_peak.map(isPeak => 
    isPeak ? '#fb923c' : '#00ff88'
  );

  chartInstances['hourly'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Active Load',
        data: data.values,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7
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
          callbacks: {
            label: (item) => {
              const isPeak = data.is_peak[item.dataIndex];
              return `${item.parsed.y} kW ${isPeak ? '(Peak Tariff Window)' : '(Off-Peak Window)'}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', maxTicksLimit: 12, font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: 'Active Power (kW)', color: '#64748b' }
        }
      }
    }
  });
}

// 4. Daily Consumption Variance (Diverging Bar Chart)
function renderVarianceBarChart(data, tariff) {
  destroyChart('variance');
  const ctx = document.getElementById('barChartVariance').getContext('2d');

  const values = currentUnitMode === 'kwh'
    ? data.values
    : data.values.map(v => Number((v * tariff).toFixed(2)));
  const unitLabel = currentUnitMode === 'kwh' ? 'kWh' : '₹';

  // Above average -> Orange, Below average -> Green
  const bgColors = values.map(v => v >= 0 ? 'rgba(249, 115, 22, 0.85)' : 'rgba(16, 185, 129, 0.85)');
  const borderColors = values.map(v => v >= 0 ? '#fb923c' : '#34d399');

  chartInstances['variance'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Variance from Avg',
        data: values,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.65
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          callbacks: {
            label: (item) => {
              const prefix = item.parsed.y >= 0 ? '+' : '';
              return `Delta: ${prefix}${item.parsed.y.toFixed(2)} ${unitLabel} vs Monthly Average`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: `± Delta (${unitLabel})`, color: '#64748b' }
        }
      }
    }
  });
}

// 5. Peak vs Off-Peak Tariff Energy Distribution (Grouped Bar Chart)
function renderTariffGroupedBarChart(data, tariff) {
  destroyChart('tariff');
  const ctx = document.getElementById('barChartTariff').getContext('2d');

  const peakVals = currentUnitMode === 'kwh'
    ? data.peak_kwh
    : data.peak_kwh.map(v => Number((v * tariff * 1.35).toFixed(2))); // peak tariff 35% higher

  const offPeakVals = currentUnitMode === 'kwh'
    ? data.off_peak_kwh
    : data.off_peak_kwh.map(v => Number((v * tariff * 0.85).toFixed(2))); // off-peak discount

  const unitLabel = currentUnitMode === 'kwh' ? 'kWh' : '₹';

  chartInstances['tariff'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Peak Hours (2 PM - 8 PM)',
          data: peakVals,
          backgroundColor: 'rgba(249, 115, 22, 0.8)',
          borderColor: '#fb923c',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        },
        {
          label: 'Off-Peak Hours (All Other)',
          data: offPeakVals,
          backgroundColor: 'rgba(0, 240, 255, 0.75)',
          borderColor: '#00f0ff',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#e2e8f0', font: { size: 12, weight: '600' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(1)} ${unitLabel}`
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
          title: { display: true, text: unitLabel, color: '#64748b' }
        }
      }
    }
  });
}

// Initial load on page ready
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderGraphs(currentConsumerId);
});
