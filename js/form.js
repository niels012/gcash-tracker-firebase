function initForm() {
    var dateInput = document.getElementById('date');
    var today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

function setupFormEventListeners() {
    var form = document.getElementById('transactionForm');
    var transactionSelect = document.getElementById('transaction');
    var amountInput = document.getElementById('amount');
    var feeInput = document.getElementById('fee');
    var mobileInput = document.getElementById('mobileNumber');
    var referenceGroup = document.getElementById('referenceGroup');

    transactionSelect.addEventListener('change', function(e) {
        var type = e.target.value;
        var feeNote = document.getElementById('feeNote');

        if (type === 'load-bill') {
            feeInput.removeAttribute('readonly');
            feeInput.value = '';
            feeNote.textContent = 'Enter the fee/charge for this transaction';
            referenceGroup.classList.remove('hidden');
        } else if (type === 'cash-in' || type === 'cash-out') {
            feeInput.setAttribute('readonly', '');
            feeNote.textContent = 'Fee will be calculated automatically';
            referenceGroup.classList.remove('hidden');
            recalculateFee();
        } else {
            feeInput.value = '';
            feeInput.setAttribute('readonly', '');
            feeNote.textContent = 'Select a transaction type';
            referenceGroup.classList.add('hidden');
        }
    });

    amountInput.addEventListener('input', function() {
        recalculateFee();
    });

    mobileInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
}

function recalculateFee() {
    var transactionType = document.getElementById('transaction').value;
    var amount = parseFloat(document.getElementById('amount').value) || 0;
    var feeInput = document.getElementById('fee');

    if (transactionType === 'cash-in' || transactionType === 'cash-out') {
        var fee = tracker.calculateFee(amount, transactionType);
        feeInput.value = fee.toFixed(2);
    }
}

function submitForm() {
    var form = document.getElementById('transactionForm');
    var formData = new FormData(form);

    if (!formData.get('transaction')) {
        showNotification('Please select a transaction type', 'error');
        return;
    }

    if (!formData.get('amount') || parseFloat(formData.get('amount')) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    if (!formData.get('mobileNumber') || formData.get('mobileNumber').length !== 11) {
        showNotification('Please enter a valid 11-digit mobile number', 'error');
        return;
    }

    if (!formData.get('fee') || parseFloat(formData.get('fee')) < 0) {
        showNotification('Please enter a valid fee', 'error');
        return;
    }

    var amount = parseFloat(formData.get('amount'));
    var type = formData.get('transaction');

    if (type === 'cash-in' || type === 'load-bill') {
        if (tracker.gcashBalance < amount) {
            showNotification('Insufficient GCash balance. Current: ' + tracker.formatCurrency(tracker.gcashBalance), 'error');
            return;
        }
    } else if (type === 'cash-out') {
        if (tracker.cashOnHand < amount) {
            showNotification('Insufficient cash on hand. Current: ' + tracker.formatCurrency(tracker.cashOnHand), 'error');
            return;
        }
    }

    tracker.addTransaction({
        date: formData.get('date'),
        transaction: formData.get('transaction'),
        mobileNumber: formData.get('mobileNumber'),
        amount: formData.get('amount'),
        fee: formData.get('fee'),
        referenceNumber: formData.get('referenceNumber')
    });

    showNotification('Transaction added successfully!', 'success');
    
    setTimeout(function() {
        window.location.href = '../index.html';
    }, 1500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (firebase.auth().currentUser) {
            initForm();
            setupFormEventListeners();
        } else {
            window.location.href = '../index.html';
        }
    });
} else {
    if (firebase.auth().currentUser) {
        initForm();
        setupFormEventListeners();
    } else {
        window.location.href = '../index.html';
    }
}