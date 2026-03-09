// AUTHENTICATION MANAGEMENT
var currentUser = null;

// Wait for Firebase to be ready
function initAuth() {
    var auth = firebase.auth();
    
    // Monitor authentication state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            // Initialize app with user data
            if (typeof tracker !== 'undefined') {
                tracker.setUserId(user.uid);
            }
        } else {
            currentUser = null;
            document.getElementById('loginModal').style.display = 'flex';
            document.getElementById('mainContent').style.display = 'none';
        }
    });

    // SIGN UP TOGGLE
    var signUpToggle = document.getElementById('signUpToggle');
    if (signUpToggle) {
        signUpToggle.addEventListener('click', function() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('signupForm').classList.remove('hidden');
        });
    }

    // BACK TO LOGIN
    var backToLogin = document.getElementById('backToLogin');
    if (backToLogin) {
        backToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('signupForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
        });
    }

    // SIGNUP FORM
    var signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var email = document.getElementById('signupEmail').value;
            var password = document.getElementById('signupPassword').value;
            var confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showAuthError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters');
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then(function(result) {
                    showAuthSuccess('Account created! Signing in...');
                    document.getElementById('signupForm').reset();
                })
                .catch(function(error) {
                    showAuthError(error.message);
                });
        });
    }

    // LOGIN FORM
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var email = document.getElementById('email').value;
            var password = document.getElementById('password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(function(result) {
                    showAuthSuccess('Signed in successfully!');
                    document.getElementById('loginForm').reset();
                })
                .catch(function(error) {
                    showAuthError(error.message);
                });
        });
    }

    // SIGN OUT
    var signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            auth.signOut()
                .then(function() {
                    showAuthSuccess('Signed out successfully');
                })
                .catch(function(error) {
                    showAuthError(error.message);
                });
        });
    }
}

// ERROR/SUCCESS NOTIFICATIONS
function showAuthError(message) {
    var notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef476f; color: white; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 8px 24px rgba(239, 71, 111, 0.3); z-index: 1000; font-weight: 600; max-width: 400px; animation: slideIn 0.3s ease;';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() { notification.remove(); }, 300);
    }, 4000);
}

function showAuthSuccess(message) {
    var notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #06d6a0; color: white; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 8px 24px rgba(6, 214, 160, 0.3); z-index: 1000; font-weight: 600; max-width: 400px; animation: slideIn 0.3s ease;';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
}

// Add animation styles
if (!document.getElementById('authAnimationStyles')) {
    var style = document.createElement('style');
    style.id = 'authAnimationStyles';
    style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }';
    document.head.appendChild(style);
}

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}