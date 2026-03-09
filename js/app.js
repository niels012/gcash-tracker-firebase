var feeStructure = {
    '1-100': 5, '101-500': 10, '501-1000': 15, '1001-1500': 20, '1501-2000': 30,
    '2001-2500': 40, '2501-3000': 50, '3001-3600': 60, '3601-4000': 70, '4001-4500': 80,
    '4501-5000': 90, '5001-5500': 100, '5501-6000': 110, '6001-6500': 120, '6501-7000': 130,
    '7001-7500': 140, '7501-8000': 150, '8001-8500': 160, '8501-9000': 170, '9001-9500': 180,
    '9501-10000': 190, '10001-10500': 200, '10501-11000': 210, '11001-11500': 220,
    '11501-12000': 230, '12001-12500': 240, '12501-13000': 250, '13001-13500': 260
};

function GCashTracker() {
    this.userId = null;
    this.transactions = [];
    this.gcashBalance = 10000;
    this.cashOnHand = 5000;
    this.dbRef = null;
    this.listeners = [];
}

GCashTracker.prototype.setUserId = function(uid) {
    this.userId = uid;
    this.dbRef = firebase.database().ref('users/' + uid);
    this.loadFromFirebase();
};

GCashTracker.prototype.loadFromFirebase = function() {
    var self = this;
    this.dbRef.once('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            self.transactions = data.transactions || [];
            self.gcashBalance = data.gcashBalance || 10000;
            self.cashOnHand = data.cashOnHand || 5000;
        } else {
            self.saveToFirebase();
        }
        self.notifyListeners();
    });
};

GCashTracker.prototype.saveToFirebase = function() {
    if (!this.userId) return;
    this.dbRef.set({
        transactions: this.transactions,
        gcashBalance: this.gcashBalance,
        cashOnHand: this.cashOnHand,
        lastUpdated: new Date().toISOString()
    });
};

GCashTracker.prototype.onDataChange = function(callback) {
    this.listeners.push(callback);
    var self = this;
    this.dbRef.on('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            self.transactions = data.transactions || [];
            self.gcashBalance = data.gcashBalance || 10000;
            self.cashOnHand = data.cashOnHand || 5000;
            self.notifyListeners();
        }
    });
};

GCashTracker.prototype.notifyListeners = function() {
    for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i]();
    }
};

GCashTracker.prototype.calculateFee = function(amount, type) {
    if (type === 'load-bill') return 0;
    for (var range in feeStructure) {
        var parts = range.split('-').map(Number);
        if (amount >= parts[0] && amount <= parts[1]) {
            return feeStructure[range];
        }
    }
    return 0;
};

GCashTracker.prototype.addTransaction = function(formData) {
    var transaction = {
        id: Date.now().toString(),
        date: formData.date,
        type: formData.transaction,
        mobileNumber: formData.mobileNumber,
        amount: parseFloat(formData.amount),
        fee: parseFloat(formData.fee),
        referenceNumber: formData.referenceNumber || '',
        timestamp: new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        })
    };

    if (transaction.type === 'cash-in' || transaction.type === 'load-bill') {
        this.gcashBalance -= transaction.amount;
        this.cashOnHand += transaction.amount;
    } else if (transaction.type === 'cash-out') {
        this.gcashBalance += transaction.amount;
        this.cashOnHand -= transaction.amount;
    }

    this.transactions.push(transaction);
    this.saveToFirebase();
    this.notifyListeners();
    return transaction;
};

GCashTracker.prototype.getTransaction = function(id) {
    for (var i = 0; i < this.transactions.length; i++) {
        if (this.transactions[i].id === id) return this.transactions[i];
    }
    return null;
};

GCashTracker.prototype.deleteTransaction = function(id) {
    var transaction = this.getTransaction(id);
    if (!transaction) return false;

    if (transaction.type === 'cash-in' || transaction.type === 'load-bill') {
        this.gcashBalance += transaction.amount;
        this.cashOnHand -= transaction.amount;
    } else if (transaction.type === 'cash-out') {
        this.gcashBalance -= transaction.amount;
        this.cashOnHand += transaction.amount;
    }

    this.transactions = this.transactions.filter(function(t) { return t.id !== id; });
    this.saveToFirebase();
    this.notifyListeners();
    return true;
};

GCashTracker.prototype.getTodayTransactions = function() {
    var today = new Date().toISOString().split('T')[0];
    return this.transactions.filter(function(t) { return t.date === today; });
};

GCashTracker.prototype.getWeekTransactions = function() {
    var now = new Date();
    var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.transactions.filter(function(t) {
        var tDate = new Date(t.date);
        return tDate >= weekAgo && tDate <= now;
    });
};

GCashTracker.prototype.getMonthTransactions = function() {
    var now = new Date();
    var monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.transactions.filter(function(t) {
        var tDate = new Date(t.date);
        return tDate >= monthAgo && tDate <= now;
    });
};

GCashTracker.prototype.getTotalFees = function(transactions) {
    var sum = 0;
    for (var i = 0; i < transactions.length; i++) {
        sum += transactions[i].fee;
    }
    return sum;
};

GCashTracker.prototype.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

GCashTracker.prototype.formatDate = function(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

GCashTracker.prototype.getTransactionTypeLabel = function(type) {
    var labels = {
        'cash-in': 'Cash In',
        'cash-out': 'Cash Out',
        'load-bill': 'Load/Bill'
    };
    return labels[type] || type;
};

GCashTracker.prototype.getTransactionTypeColor = function(type) {
    var colors = {
        'cash-in': '#06d6a0',
        'cash-out': '#ef476f',
        'load-bill': '#ffd60a'
    };
    return colors[type] || '#00b4d8';
};

var tracker = new GCashTracker();

function showNotification(message, type) {
    var notification = document.createElement('div');
    var bgColor = type === 'success' ? '#06d6a0' : type === 'error' ? '#ef476f' : '#00b4d8';
    var shadowColor = type === 'success' ? 'rgba(6, 214, 160, 0.3)' : type === 'error' ? 'rgba(239, 71, 111, 0.3)' : 'rgba(0, 180, 216, 0.3)';

    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + bgColor + '; color: white; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 8px 24px ' + shadowColor + '; z-index: 1000; font-weight: 600; max-width: 400px; animation: slideIn 0.3s ease;';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() { notification.remove(); }, 300);
    }, type === 'error' ? 4000 : 3000);
}