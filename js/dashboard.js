let feeChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase initialization
    setTimeout(() => {
        if (tracker && tracker.userId) {
            initializeDashboard();
        }
    }, 500);
});

function initializeDashboard() {
    // Set up real-time listeners
    tracker.onDataChange(() => {
        updateBalances();
        updateRecentTransactions();
        if (feeChart) {
            const period = document.querySelector('.period-btn.active').getAttribute('data-period');
            updateFeeChart(period);
        }
    });

    updateBalances();
    updateRecentTransactions();
    initializeFeeChart('day');
    setupEventListeners();
}

function updateBalances() {
    document.getElementById('gcashBalance').textContent = tracker.formatCurrency(tracker.gcashBalance);
    document.getElementById('cashOnHand').textContent = tracker.formatCurrency(tracker.cashOnHand);
    
    const todayTransactions = tracker.getTodayTransactions();
    const todayFees = tracker.getTotalFees(todayTransactions);
    document.getElementById('totalFees').textContent = tracker.formatCurrency(todayFees);
}

function updateRecentTransactions() {
    const container = document.getElementById('transactionsList');
    const todayTransactions = tracker.getTodayTransactions();

    if (todayTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No transactions yet. Add your first transaction to get started.</p>
            </div>
        `;
        return;
    }

    const recentTransactions = todayTransactions.slice(-3).reverse();
    container.innerHTML = recentTransactions.map(transaction => {
        const amount = transaction.type === 'cash-out' 
            ? `+${tracker.formatCurrency(transaction.amount)}`
            : `-${tracker.formatCurrency(transaction.amount)}`;
        const amountClass = transaction.type === 'cash-out' ? '' : 'negative';

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type">${tracker.getTransactionTypeLabel(transaction.type)}</div>
                    <div class="transaction-meta">${transaction.mobileNumber} • ${transaction.timestamp}</div>
                </div>
                <div class="transaction-amount ${amountClass}">${amount}</div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            periodBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = e.target.getAttribute('data-period');
            updateFeeChart(period);
        });
    });
}

function initializeFeeChart(period) {
    const ctx = document.getElementById('feeChart').getContext('2d');
    const data = getChartData(period);

    feeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Fees Received',
                    data: data.fees,
                    borderColor: '#ffd60a',
                    backgroundColor: 'rgba(255, 214, 10, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#ffd60a',
                    pointBorderColor: '#0a1428',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                },
                {
                    label: 'Cash In',
                    data: data.cashIn,
                    borderColor: '#06d6a0',
                    backgroundColor: 'rgba(6, 214, 160, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#06d6a0',
                    borderDash: [5, 5]
                },
                {
                    label: 'Cash Out',
                    data: data.cashOut,
                    borderColor: '#ef476f',
                    backgroundColor: 'rgba(239, 71, 111, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef476f',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: {
                        color: '#b0b9c1',
                        font: { size: 12, weight: '600' },
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b9c1',
                        font: { size: 11 },
                        callback: function(value) {
                            return '₱' + value.toFixed(0);
                        }
                    },
                    grid: { color: 'rgba(44, 69, 99, 0.2)', drawBorder: false }
                },
                x: {
                    ticks: { color: '#b0b9c1', font: { size: 11 } },
                    grid: { color: 'rgba(44, 69, 99, 0.1)', drawBorder: false }
                }
            }
        }
    });
}

function updateFeeChart(period) {
    const data = getChartData(period);
    
    if (feeChart) {
        feeChart.data.labels = data.labels;
        feeChart.data.datasets[0].data = data.fees;
        feeChart.data.datasets[1].data = data.cashIn;
        feeChart.data.datasets[2].data = data.cashOut;
        feeChart.update();
    }

    const labels = { 'day': 'Today', 'week': 'This Week', 'month': 'This Month' };
    document.getElementById('feesPeriod').textContent = labels[period];
}

function getChartData(period) {
    let transactions = [];
    let labels = [];

    if (period === 'day') {
        transactions = tracker.getTodayTransactions();
        const today = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(today);
            time.setHours(today.getHours() - i);
            labels.push(time.getHours() + ':00');
        }
    } else if (period === 'week') {
        transactions = tracker.getWeekTransactions();
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
    } else if (period === 'month') {
        transactions = tracker.getMonthTransactions();
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    }

    const fees = new Array(labels.length).fill(0);
    const cashIn = new Array(labels.length).fill(0);
    const cashOut = new Array(labels.length).fill(0);

    transactions.forEach(transaction => {
        let index = -1;
        const transDate = new Date(transaction.date);

        if (period === 'day') {
            const hour = transDate.getHours();
            const currentHour = new Date().getHours();
            index = (hour - currentHour + 24) % 24;
        } else {
            const daysDiff = Math.floor((new Date() - transDate) / (1000 * 60 * 60 * 24));
            if (period === 'week' && daysDiff < 7) {
                index = 6 - daysDiff;
            } else if (period === 'month' && daysDiff < 30) {
                index = 29 - daysDiff;
            }
        }

        if (index >= 0 && index < labels.length) {
            fees[index] += transaction.fee;
            if (transaction.type === 'cash-in' || transaction.type === 'load-bill') {
                cashIn[index] += transaction.amount;
            } else if (transaction.type === 'cash-out') {
                cashOut[index] += transaction.amount;
            }
        }
    });

    return { labels, fees, cashIn, cashOut };
}
