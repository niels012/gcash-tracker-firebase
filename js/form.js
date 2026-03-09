document.addEventListener('DOMContentLoaded', () => {
    // Wait for authentication
    setTimeout(() => {
        if (firebase.auth().currentUser) {
            initializeForm();
            setupFormEventListeners();
        } else {
            window.location.href = '../index.html';
        }
    }, 500);
});

function initializeForm() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

function setupFormEventListeners() {
    const form = document.getElementById('transactionForm');
    const transactionSelect = document.getElementById('transaction');
    const amountInput = document.getElementById('amount');
    const feeInput = document.getElementById('fee');
    const mobileInput = document.getElementById('mobileNumber');
    const referenceGroup = document.getElementById('referenceGroup');

    transactionSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        const feeNote = document.getElementById('feeNote');

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

    amountInput.addEventListener('input', () => {
        recalculateFee();
    });

    mobileInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm();
    });
}

function recalculateFee() {
    const transactionType = document.getElementById('transaction').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const feeInput = document.getElementById('fee');

    if (transactionType === 'cash-in' || transactionType === 'cash-out') {
        const fee = tracker.calculateFee(amount, transactionType);
        feeInput.value = fee.toFixed(2);
    }
}

async function submitForm() {
    const form = document.getElementById('transactionForm');
    const formData = new FormData(form);

    // Validation
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

    // Check balances
    const amount = parseFloat(formData.get('amount'));
    const type = formData.get('transaction');

    if (type === 'cash-in' || type === 'load-bill') {
        if (tracker.gcashBalance < amount) {
            showNotification(`Insufficient GCash balance. Current: ${tracker.formatCurrency(tracker.gcashBalance)}`, 'error');
            return;
        }
    } else if (type === 'cash-out') {
        if (tracker.cashOnHand < amount) {
            showNotification(`Insufficient cash on hand. Current: ${tracker.formatCurrency(tracker.cashOnHand)}`, 'error');
            return;
        }
    }

    try {
        await tracker.addTransaction({
            date: formData.get('date'),
            transaction: formData.get('transaction'),
            mobileNumber: formData.get('mobileNumber'),
            amount: formData.get('amount'),
            fee: formData.get('fee'),
            referenceNumber: formData.get('referenceNumber')
        });

        showNotification('Transaction added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    } catch (error) {
        showNotification('Failed to add transaction: ' + error.message, 'error');
        console.error(error);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#06d6a0' : type === 'error' ? '#ef476f' : '#00b4d8';
    const shadowColor = type === 'success' 
        ? 'rgba(6, 214, 160, 0.3)' 
        : type === 'error' 
            ? 'rgba(239, 71, 111, 0.3)' 
            : 'rgba(0, 180, 216, 0.3)';

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 8px 24px ${shadowColor};
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, type === 'error' ? 4000 : 3000);
}
