var feeChart = null;

function initDashboard() {
    if (typeof tracker === 'undefined') {
        setTimeout(initDashboard, 100);
        return;
    }
    
    updateBalances();
    updateRecentTransactions();
    initializeFeeChart('day');
    setupEventListeners();
}

function updateBalances() {
    document.getElementById('gcashBalance').textContent = tracker.formatCurrency(tracker.gcashBalance);
    document.getElementById('cashOnHand').textContent = tracker.formatCurrency(tracker.cashOnHand);
    
    var todayTransactions = tracker.getTodayTransactions();
    var todayFees = tracker.getTotalFees(todayTransactions);
    document.getElementById('totalFees').textContent = tracker.formatCurrency(todayFees);
}

function updateRecentTransactions() {
    var container = document.getElementById('transactionsList');
    var todayTransactions = tracker.getTodayTransactions();

    if (todayTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No transactions yet. Add your first transaction to get started.</p></div>';
        return;
    }

    var recentTransactions = todayTransactions.slice(-3).reverse();
    var html = '';
    for (var i = 0; i < recentTransactions.length; i++) {
        var transaction = recentTransactions[i];
        var amount = transaction.type === 'cash-out' 
            ? '+' + tracker.formatCurrency(transaction.amount)
            : '-' + tracker.formatCurrency(transaction.amount);
        var amountClass = transaction.type === 'cash-out' ? '' : 'negative';

        html += '<div class="transaction-item">' +
                '<div class="transaction-info">' +
                '<div class="transaction-type">' + tracker.getTransactionTypeLabel(transaction.type) + '</div>' +
                '<div class="transaction-meta">' + transaction.mobileNumber + ' • ' + transaction.timestamp + '</div>' +
                '</div>' +
                '<div class="transaction-amount ' + amountClass + '">' + amount + '</div>' +
                '</div>';
    }
    container.innerHTML = html;
}

function setupEventListeners() {
    var periodBtns = document.querySelectorAll('.period-btn');
    for (var i = 0; i < periodBtns.length; i++) {
        periodBtns[i].addEventListener('click', function(e) {
            for (var j = 0; j < periodBtns.length; j++) {
                periodBtns[j].classList.remove('active');
            }
            e.target.classList.add('active');
            var period = e.target.getAttribute('data-period');
            updateFeeChart(period);
        });
    }
}

function initializeFeeChart(period) {
    var ctx = document.getElementById('feeChart').getContext('2d');
    var data = getChartData(period);

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
    var data = getChartData(period);
    
    if (feeChart) {
        feeChart.data.labels = data.labels;
        feeChart.data.datasets[0].data = data.fees;
        feeChart.update();
    }

    var labels = { 'day': 'Today', 'week': 'This Week', 'month': 'This Month' };
    document.getElementById('feesPeriod').textContent = labels[period];
}

function getChartData(period) {
    var transactions = [];
    var labels = [];

    if (period === 'day') {
        transactions = tracker.getTodayTransactions();
        var today = new Date();
        for (var i = 23; i >= 0; i--) {
            var time = new Date(today);
            time.setHours(today.getHours() - i);
            labels.push(time.getHours() + ':00');
        }
    } else if (period === 'week') {
        transactions = tracker.getWeekTransactions();
        var today = new Date();
        for (var i = 6; i >= 0; i--) {
            var date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
    } else if (period === 'month') {
        transactions = tracker.getMonthTransactions();
        var today = new Date();
        for (var i = 29; i >= 0; i--) {
            var date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    }

    var fees = new Array(labels.length).fill(0);

    for (var i = 0; i < transactions.length; i++) {
        var transaction = transactions[i];
        var index = -1;
        var transDate = new Date(transaction.date);

        if (period === 'day') {
            var hour = transDate.getHours();
            var currentHour = new Date().getHours();
            index = (hour - currentHour + 24) % 24;
        } else {
            var daysDiff = Math.floor((new Date() - transDate) / (1000 * 60 * 60 * 24));
            if (period === 'week' && daysDiff < 7) {
                index = 6 - daysDiff;
            } else if (period === 'month' && daysDiff < 30) {
                index = 29 - daysDiff;
            }
        }

        if (index >= 0 && index < labels.length) {
            fees[index] += transaction.fee;
        }
    }

    return { labels: labels, fees: fees };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}