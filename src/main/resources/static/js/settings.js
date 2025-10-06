document.addEventListener('DOMContentLoaded', function() {
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
        document.getElementById('profile-photo-preview').src = data.photoUrl || '/api/user/photo';
        
        // Populate preferences if available
        if (data.preferences) {
            document.getElementById('currency').value = data.preferences.currency || 'USD';
            document.getElementById('dateFormat').value = data.preferences.dateFormat || 'MM/DD/YYYY';
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
            showToast('success', 'Profile updated successfully');
            setTimeout(() => location.reload(), 1500);
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
        fetch('/api/user/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify({
                currency: document.getElementById('currency').value,
                dateFormat: document.getElementById('dateFormat').value
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to update preferences');
            showToast('success', 'Preferences updated successfully');
        })
        .catch(error => {
            showToast('error', 'Failed to update preferences');
            console.error('Error:', error);
        });
    });

    // Handle profile photo preview
    document.getElementById('profilePhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profile-photo-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});
