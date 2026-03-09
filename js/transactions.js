function displayTransactions() {
    var tableBody = document.getElementById('tableBody');
    var transactions = tracker.transactions;

    if (transactions.length === 0) {
        tableBody.innerHTML = '<div class="empty-state"><p>No transactions yet. <a href="form.html" style="color: #00b4d8; text-decoration: none; font-weight: 600;">Add your first transaction</a></p></div>';
        return;
    }

    var sortedTransactions = transactions.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var html = '';
    for (var i = 0; i < sortedTransactions.length; i++) {
        var transaction = sortedTransactions[i];
        var typeClass = transaction.type.replace('_', '-');
        var typeLabel = tracker.getTransactionTypeLabel(transaction.type);
        var amount = transaction.type === 'cash-out' 
            ? '+' + tracker.formatCurrency(transaction.amount)
            : '-' + tracker.formatCurrency(transaction.amount);
        var amountClass = transaction.type === 'cash-out' ? '' : 'negative';

        html += '<div class="table-row" data-transaction-id="' + transaction.id + '">' +
                '<div class="col col-date" data-label="Date">' + tracker.formatDate(transaction.date) + '</div>' +
                '<div class="col col-type" data-label="Type"><span class="type-badge ' + typeClass + '">' + typeLabel + '</span></div>' +
                '<div class="col col-mobile" data-label="Mobile">' + transaction.mobileNumber + '</div>' +
                '<div class="col col-amount" data-label="Amount">' + tracker.formatCurrency(transaction.amount) + '</div>' +
                '<div class="col col-fee" data-label="Fee">₱' + transaction.fee.toFixed(2) + '</div>' +
                '<div class="col col-reference" data-label="Reference">' + (transaction.referenceNumber || '-') + '</div>' +
                '<div class="col col-timestamp" data-label="Timestamp">' + transaction.timestamp + '</div>' +
                '<div class="col col-actions" data-label="Actions"><button class="btn-delete" data-id="' + transaction.id + '">Delete</button></div>' +
                '</div>';
    }
    tableBody.innerHTML = html;

    var deleteButtons = document.querySelectorAll('.btn-delete');
    for (var i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var id = this.getAttribute('data-id');
            deleteTransaction(id);
        });
    }
}

function setupSearchAndDelete() {
    var searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', function(e) {
        var searchTerm = e.target.value.toLowerCase();
        var tableRows = document.querySelectorAll('.table-row');

        for (var i = 0; i < tableRows.length; i++) {
            var row = tableRows[i];
            var mobileNumber = row.querySelector('.col-mobile').textContent.toLowerCase();
            if (mobileNumber.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function deleteTransaction(id) {
    var transaction = tracker.getTransaction(id);
    if (!transaction) return;

    var message = 'Are you sure you want to delete this transaction?\n\nType: ' + tracker.getTransactionTypeLabel(transaction.type) + '\nAmount: ' + tracker.formatCurrency(transaction.amount) + '\nDate: ' + tracker.formatDate(transaction.date) + '\n\nThis will restore your previous balance.';

    if (confirm(message)) {
        tracker.deleteTransaction(id);
        showNotification('Transaction deleted successfully!', 'success');
        displayTransactions();
    }
}

function showNotification(message, type) {
    var notification = document.createElement('div');
    var bgColor = type === 'success' ? '#06d6a0' : '#ef476f';
    var shadowColor = type === 'success' ? 'rgba(6, 214, 160, 0.3)' : 'rgba(239, 71, 111, 0.3)';

    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + bgColor + '; color: white; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 8px 24px ' + shadowColor + '; z-index: 1000; animation: slideIn 0.3s ease; max-width: 400px; font-weight: 600;';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (firebase.auth().currentUser) {
            displayTransactions();
            setupSearchAndDelete();
        } else {
            window.location.href = '../index.html';
        }
    });
} else {
    if (firebase.auth().currentUser) {
        displayTransactions();
        setupSearchAndDelete();
    } else {
        window.location.href = '../index.html';
    }
}