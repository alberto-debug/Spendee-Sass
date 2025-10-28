document.addEventListener('DOMContentLoaded', function() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
        `;
        document.body.appendChild(toastContainer);
    }

    function showToast(type, message) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now();

        const backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

        toast.id = toastId;
        toast.style.cssText = `
            background: ${backgroundColor};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 0.5rem;
            min-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Add CSS animations
    if (!document.getElementById('toastAnimations')) {
        const style = document.createElement('style');
        style.id = 'toastAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Load user data
    fetch('/api/user/me', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
        }
    })
    .then(res => res.json())
    .then(data => {
        // Populate profile form
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('email').value = data.email || '';

        // Handle profile photo with error handling
        const photoPreview = document.getElementById('settings-profile-photo-preview') || document.getElementById('profile-photo-preview');
        if (photoPreview) {
            if (data.photoUrl) {
                photoPreview.src = data.photoUrl;
            } else {
                photoPreview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY2NjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSI0MCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5CkPC90ZXh0Pjwvc3ZnPg==';
            }
            photoPreview.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY2NjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSI0MCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5CkPC90ZXh0Pjwvc3ZnPg==';
            };
        }

        // Populate preferences if available
        // Check if user just saved preferences (localStorage takes precedence)
        const savedCurrency = localStorage.getItem('userCurrency');
        const savedDateFormat = localStorage.getItem('userDateFormat');

        if (savedCurrency) {
            // Use saved values from localStorage (user's most recent choice)
            document.getElementById('currency').value = savedCurrency;
            document.getElementById('dateFormat').value = savedDateFormat || 'MM/DD/YYYY';
            console.log('Settings - Using saved preferences from localStorage:', savedCurrency);
        } else if (data.preferences) {
            // Use API values only if localStorage is empty
            const currency = data.preferences.currency || 'USD';
            const dateFormat = data.preferences.dateFormat || 'MM/DD/YYYY';
            document.getElementById('currency').value = currency;
            document.getElementById('dateFormat').value = dateFormat;
            localStorage.setItem('userCurrency', currency);
            localStorage.setItem('userDateFormat', dateFormat);
            console.log('Settings - Loaded preferences from API:', currency);
        }
    })
    .catch(error => {
        showToast('error', 'Failed to load user data');
        console.error('Error:', error);
    });

    // Handle profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('firstName', document.getElementById('firstName').value);
        formData.append('lastName', document.getElementById('lastName').value);
        formData.append('email', document.getElementById('email').value);
        
        const photoInput = document.getElementById('profilePhoto');
        if (photoInput.files.length > 0) {
            formData.append('photo', photoInput.files[0]);
        }

        fetch('/api/user/update', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to update profile');
            // parse json to be consistent with other handlers
            return res.json();
        })
        .then(data => {
            // If backend indicates success, show toast and update UI
            if (data && data.success) {
                showToast('success', 'Profile updated successfully');

                // Refresh profile images without full reload (cache-bust)
                const ts = Date.now();
                const newPhotoUrl = `/api/user/photo?ts=${ts}`;

                // Update preview on settings page
                const preview = document.getElementById('settings-profile-photo-preview') || document.getElementById('profile-photo-preview');
                if (preview) preview.src = newPhotoUrl;

                // Update sidebar avatar if present
                const sidebarImg = document.querySelector('.sidebar-user .user-avatar img');
                if (sidebarImg) sidebarImg.src = newPhotoUrl;

                // Update navbar avatar if present (profile modal uses same id)
                const navbarImg = document.getElementById('profile-photo-preview');
                if (navbarImg) navbarImg.src = newPhotoUrl;

                // Also update displayed user name and email in navbar/sidebar if present
                // Attempt to update them via a fresh /api/user/me call; fallback to full reload
                fetch('/api/user/me', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') } })
                    .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch user after update'))
                    .then(userData => {
                        try {
                            const nameEl = document.querySelector('.navbar .fw-semibold');
                            const emailEl = document.getElementById('user-email');
                            if (userData.firstName || userData.lastName) {
                                const displayName = ((userData.firstName || '') + ' ' + (userData.lastName || '')).trim();
                                if (nameEl) nameEl.textContent = displayName.split(' ')[0] || 'User';
                            }
                            if (emailEl && userData.email) emailEl.textContent = userData.email;
                        } catch (err) {
                            // ignore DOM update errors
                        }
                    })
                    .catch(() => {
                        // If updating the DOM fails, reload after a short delay so user sees changes
                        setTimeout(() => window.location.reload(), 1200);
                    });

                // Ensure we reload as a last resort so all fragments (server-rendered) pick up changes
                setTimeout(() => {
                    // Only reload if the page still shows old values after short time
                    // We avoid forcing a reload immediately to keep the UX snappy (toast shown)
                    // If the DOM was already updated above, this will be harmless.
                    window.location.reload();
                }, 3000);
            } else {
                showToast('error', 'Failed to update profile');
                console.error('Update response:', data);
            }
        })
        .catch(error => {
            showToast('error', 'Failed to update profile');
            console.error('Error:', error);
        });
    });

    // Handle password form submission
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }

        fetch('/api/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: newPassword
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to change password');
            showToast('success', 'Password changed successfully');
            document.getElementById('passwordForm').reset();
        })
        .catch(error => {
            showToast('error', 'Failed to change password');
            console.error('Error:', error);
        });
    });

    // Handle preferences form submission
    document.getElementById('preferencesForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const currency = document.getElementById('currency').value;
        const dateFormat = document.getElementById('dateFormat').value;

        // Store in localStorage IMMEDIATELY before API call
        localStorage.setItem('userCurrency', currency);
        localStorage.setItem('userDateFormat', dateFormat);
        console.log('Saved to localStorage immediately:', currency);

        // Show success toast
        showToast('success', 'Preferences updated successfully - changes will apply on next page visit');

        // Try to save to backend but don't block on it
        fetch('/api/user/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify({
                currency: currency,
                dateFormat: dateFormat
            })
        })
        .then(res => {
            if (res.ok) {
                console.log('Preferences saved to backend successfully');
            } else {
                console.warn('Backend save failed, but localStorage is updated');
            }
        })
        .catch(error => {
            console.warn('Backend save failed, but localStorage is updated:', error);
        });

        // Update the settings form to show saved values
        document.getElementById('currency').value = currency;
        document.getElementById('dateFormat').value = dateFormat;
    });

    // Handle profile photo preview
    document.getElementById('profilePhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('settings-profile-photo-preview') || document.getElementById('profile-photo-preview');
                if (preview) preview.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});
