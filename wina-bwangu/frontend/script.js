// ========================== AUTH CHECK ==========================
if (!localStorage.getItem('loggedInUser')) {
    window.location.href = 'login.html';
}

// Logout button
const logoutBtn = document.createElement('button');
logoutBtn.id = 'logoutBtn'
logoutBtn.innerHTML = 'Logout <i class="bi bi-box-arrow-right"></i>';
logoutBtn.style.float = 'right';
logoutBtn.style.margin = '10px';
document.body.prepend(logoutBtn);

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
});

// ========================== DATA ==========================
const booths = {
    "Wina1": { location: "Lusaka CPD", services: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"] },
    "Wina2": { location: "Libala", services: ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"] },
    "Wina3": { location: "Kabwata", services: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"] },
    "Wina4": { location: "Mandevu", services: ["Airtel Money", "MTN Money", "Zamtel Money"] },
    "Wina5": { location: "Woodlands", services: ["Airtel Money", "MTN Money", "Zanaco", "FNB"] },
    "Wina6": { location: "Matero East", services: ["Airtel Money", "MTN Money", "Zamtel Money"] }
};

const servicesData = {
    "Airtel Money": { limit: 350000, revenue: 0.05 },
    "MTN Money": { limit: 160000, revenue: 0.06 },
    "Zamtel Money": { limit: 70000, revenue: 0.045 },
    "Zanaco": { limit: 80000, revenue: 0.035 },
    "FNB": { limit: 80000, revenue: 0.04 }
};

// Transactions (start empty)
let transactions = [];

// ========================== ELEMENTS ==========================
const boothSelect = document.getElementById('booth');
Object.keys(booths).forEach(b => {
    const option = document.createElement('option');
    option.value = b;
    option.textContent = b;
    boothSelect.appendChild(option);
});

const locationSpan = document.getElementById('location');
const serviceSelect = document.getElementById('service');
const revenueSpan = document.getElementById('revenue');
const amountInput = document.getElementById('amount');
const taxInput = document.getElementById('tax');
const addBtn = document.getElementById('addTransaction');

// Dashboard elements
const serviceTotalsBody = document.querySelector('#serviceTotals tbody');
const frequencyBody = document.querySelector('#frequencyTable tbody');
const pieCanvas = document.getElementById('revenuePie').getContext('2d');
const taxChartCanvas = document.getElementById('taxChart')?.getContext('2d');

let revenuePieChart;   // pie chart instance
let taxChartInstance;  // bar chart instance

// ========================== FORM LOGIC ==========================
boothSelect.addEventListener('change', () => {
    const booth = boothSelect.value;
    if (!booth) return;
    locationSpan.textContent = booths[booth].location;

    // Update services
    serviceSelect.innerHTML = '<option value="">--Select Service--</option>';
    booths[booth].services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        serviceSelect.appendChild(opt);
    });
    revenueSpan.textContent = "0";
});

serviceSelect.addEventListener('change', () => {
    const service = serviceSelect.value;
    if (service) revenueSpan.textContent = servicesData[service].revenue;
});

addBtn.addEventListener('click', () => {
    const booth = boothSelect.value;
    const location = locationSpan.textContent;
    const service = serviceSelect.value;
    const amount = parseFloat(amountInput.value);
    const taxPercent = parseFloat(taxInput.value);

    if (!booth || !service || isNaN(amount)) {
        alert("Fill all fields correctly!");
        return;
    }

    // Transaction ID
    const transactionID = 'WB' + String(transactions.length + 1).padStart(7, '0');
    const taxAmount = (taxPercent / 100) * amount;
    const amountAfterTax = amount - taxAmount;

    const transaction = { transactionID, booth, location, service, amount, taxPercent, taxAmount, amountAfterTax };
    transactions.push(transaction);

    updateDashboard();
});

// ========================== DASHBOARD ==========================
function updateDashboard() {
    // Service Totals
    const serviceTotals = {};
    Object.keys(servicesData).forEach(s => {
        serviceTotals[s] = { totalTrans: 0, cumulative: 0, limit: servicesData[s].limit };
    });

    const frequency = {};
    let totalRevenue = 0;
    let totalCapital = 0;

    transactions.forEach(t => {
        serviceTotals[t.service].totalTrans += 1;
        serviceTotals[t.service].cumulative += t.amount;
        totalRevenue += t.amountAfterTax;
        totalCapital += t.amount;

        const key = t.booth + '|' + t.service;
        frequency[key] = (frequency[key] || 0) + 1;
    });

    // Update service totals table
    serviceTotalsBody.innerHTML = '';
    for (const s in serviceTotals) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s}</td>
            <td>${serviceTotals[s].totalTrans}</td>
            <td>${serviceTotals[s].cumulative.toFixed(2)}</td>
            <td>${serviceTotals[s].limit}</td>
            <td>${(serviceTotals[s].limit - serviceTotals[s].cumulative).toFixed(2)}</td>
        `;
        serviceTotalsBody.appendChild(row);
    }

    // Update frequency table
    frequencyBody.innerHTML = '';
    for (const key in frequency) {
        const [booth, service] = key.split('|');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booth}</td>
            <td>${service}</td>
            <td>${frequency[key]}</td>
        `;
        frequencyBody.appendChild(row);
    }

    // ================== TAX OBLIGATIONS CHART ==================
    if (taxChartCanvas) {
        const taxByBooth = {};
        transactions.forEach(t => {
            taxByBooth[t.booth] = (taxByBooth[t.booth] || 0) + t.taxAmount;
        });

        const taxLabels = Object.keys(taxByBooth);
        const taxValues = Object.values(taxByBooth);

        if (taxChartInstance) taxChartInstance.destroy();
        taxChartInstance = new Chart(taxChartCanvas, {
            type: 'bar',
            data: {
                labels: taxLabels,
                datasets: [{
                    label: 'Total Tax Obligations (ZMW)',
                    data: taxValues,
                    backgroundColor: '#FF9800'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'ZMW' }
                    }
                }
            }
        });
    }

    // ================== REVENUE PIE CHART ==================
    if (revenuePieChart) revenuePieChart.destroy();
    revenuePieChart = new Chart(pieCanvas, {
        type: 'pie',
        data: {
            labels: ['Capital (Before Tax)', 'Revenue (After Tax)'],
            datasets: [{
                data: [totalCapital, totalRevenue],
                backgroundColor: ['#FF6384', '#36A2EB']
            }]
        }
    });
}

// ========================== AUTO-GENERATE 170 TRANSACTIONS ==========================
(function generateSampleTransactions() {
    for (let i = 1; i <= 170; i++) {
        const boothKeys = Object.keys(booths);
        const booth = boothKeys[Math.floor(Math.random() * boothKeys.length)];
        const service = booths[booth].services[Math.floor(Math.random() * booths[booth].services.length)];
        const amount = Math.floor(Math.random() * 5000) + 100; // 100–5000
        const taxPercent = 16;
        const taxAmount = (taxPercent / 100) * amount;
        const amountAfterTax = amount - taxAmount;

        transactions.push({
            transactionID: 'WB' + String(i).padStart(7, '0'),
            booth,
            location: booths[booth].location,
            service,
            amount,
            taxPercent,
            taxAmount,
            amountAfterTax
        });
    }
    updateDashboard();
})();

function animateCounter(id, target, duration = 2000) {
  let start = 0;
  const element = document.getElementById(id);
  const increment = target / (duration / 50);

  const counterInterval = setInterval(() => {
    start += increment;
    if(start >= target) {
      start = target;
      clearInterval(counterInterval);
    }
    element.innerText = Math.floor(start);
  }, 50);
}

// Example usage
animateCounter('totalRevenue', 12500); // Total revenue today
animateCounter('activeBooths', 12); // Active booths
animateCounter('transactionsCount', 342); // Transactions processed
animateCounter('taxCollected', 2034); // Taxes collected
