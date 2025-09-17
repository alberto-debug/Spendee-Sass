/**
 * Authentication JavaScript functions for login and registration (notify.js based)
 */
// Hybrid authentication - Traditional form + JWT API support
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registrationForm');
    const registerLink = document.getElementById('registerLink');

    // Floating labels (retain existing behavior if present)
    document.querySelectorAll('.form-floating input').forEach(input => {
        input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
        input.addEventListener('blur', () => { if (!input.value) input.parentElement.classList.remove('focused'); });
        if (input.value) input.parentElement.classList.add('focused');
    });

    // Modal registration (if modal present)
    const registrationModalElement = document.getElementById('registrationModal');
    if (registrationModalElement && registerLink) {
        const registrationModal = new bootstrap.Modal(registrationModalElement);
        registerLink.addEventListener('click', e => { e.preventDefault(); registrationModal.show(); });
    }

    // LOGIN SUBMIT - Support both traditional form and JWT API
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Always prevent default to handle with JavaScript

            if (typeof notify === 'undefined') {
                console.warn('[auth.js] notify not available');
            }

            const emailField = document.getElementById('email');
            const passwordField = document.getElementById('password');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            const isEmailValid = validateEmail(emailField.value);
            const isPasswordValid = passwordField.value.length > 0;

            if (!isEmailValid) {
                notify?.error('Please enter a valid email address');
                emailField.focus();
                return;
            }
            if (!isPasswordValid) {
                notify?.error('Please enter your password');
                passwordField.focus();
                return;
            }

            // Show loading state
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitButton.disabled = true;

            // Try JWT API login first
            const payload = { email: emailField.value, password: passwordField.value };

            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(async response => {
                const text = await response.text();
                let data = {};
                try {
                    data = text ? JSON.parse(text) : {};
                } catch(_) {
                    data = { message: text };
                }

                if (!response.ok) {
                    throw new Error(data.message || `Login failed (status ${response.status})`);
                }
                return data;
            })
            .then(data => {
                console.log('[auth.js] Login response data:', data); // Debug log
                if (data.token) {
                    // JWT login successful
                    localStorage.setItem('jwt_token', data.token);
                    localStorage.setItem('user_email', emailField.value);

                    // Set token as cookie for server-side rendering
                    document.cookie = `jwt_token=${data.token}; path=/; SameSite=Strict`;

                    console.log('[auth.js] Token stored, redirecting to dashboard'); // Debug log
                    notify?.success('Login successful! Redirecting...');

                    // After successful login, set toast flag
                    function handleLoginSuccess() {
                        sessionStorage.setItem('showLoginToast', 'true');
                        window.location.href = '/dashboard';
                    }

                    // Replace your login success redirect with handleLoginSuccess()
                    // Example:
                    // if (loginSuccess) { handleLoginSuccess(); }

                    // Use window.location.replace for immediate redirect without history
                    setTimeout(() => {
                        window.location.replace('/dashboard?login=success');
                    }, 600);
                } else {
                    console.error('[auth.js] No token in response:', data); // Debug log
                    throw new Error('Invalid response from server');
                }
            })
            .catch(err => {
                console.error('[auth.js] JWT Login failed, trying traditional form login:', err);

                // Fallback to traditional form submission
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;

                // Create a hidden form for traditional submission
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/auth/login';

                const emailInput = document.createElement('input');
                emailInput.type = 'hidden';
                emailInput.name = 'email';
                emailInput.value = emailField.value;

                const passwordInput = document.createElement('input');
                passwordInput.type = 'hidden';
                passwordInput.name = 'password';
                passwordInput.value = passwordField.value;

                form.appendChild(emailInput);
                form.appendChild(passwordInput);
                document.body.appendChild(form);
                form.submit();
            });
        });
    }

    // REGISTRATION SUBMIT - JWT API registration
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof notify === 'undefined') {
                console.warn('[auth.js] notify not available');
            }

            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const emailField = document.getElementById('regEmail');
            const passwordField = document.getElementById('regPassword');

            if (!firstNameField.value.trim()) { notify?.error('Please enter your first name'); firstNameField.focus(); return; }
            if (!lastNameField.value.trim()) { notify?.error('Please enter your last name'); lastNameField.focus(); return; }
            if (!validateEmail(emailField.value)) { notify?.error('Please enter a valid email address'); emailField.focus(); return; }
            if (!validatePassword(passwordField.value)) { notify?.error('Password must be at least 8 characters long'); passwordField.value; return; }

            const submitButton = registrationForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitButton.disabled = true;

            const formData = {
                firstName: firstNameField.value,
                lastName: lastNameField.value,
                email: emailField.value,
                password: passwordField.value,
                dateOfBirth: null // Set to null since it's optional in RegistrationDto
            };

            fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(async response => {
                const text = await response.text();
                let data = {};
                try {
                    data = text ? JSON.parse(text) : {};
                } catch(_) {
                    data = { message: text };
                }

                if (!response.ok) {
                    throw new Error(data.message || data || 'Registration failed');
                }
                return data;
            })
            .then(data => {
                if (data.token) {
                    // Registration successful, store token
                    localStorage.setItem('jwt_token', data.token);
                    localStorage.setItem('user_email', emailField.value);

                    // Set token as cookie for server-side rendering
                    document.cookie = `jwt_token=${data.token}; path=/; SameSite=Strict`;

                    notify?.success('Registration successful! Redirecting to dashboard...');
                    registrationForm.reset();

                    if (registrationModalElement) {
                        const inst = bootstrap.Modal.getInstance(registrationModalElement);
                        inst?.hide();
                    }

                    setTimeout(() => { window.location.href = '/dashboard?login=success'; }, 1500);
                } else {
                    notify?.success('Registration successful! Please login.');
                    registrationForm.reset();

                    if (registrationModalElement) {
                        const inst = bootstrap.Modal.getInstance(registrationModalElement);
                        inst?.hide();
                    }
                }
            })
            .catch(err => {
                notify?.error(err.message || 'Registration failed: Email may already be taken');
            })
            .finally(() => {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            });
        });
    }

    // Handle URL parameters for login feedback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error')) {
        const error = urlParams.get('error');
        if (error === 'oauth_failed') {
            notify?.error('OAuth login failed. Please try again.');
        } else {
            notify?.error('Login failed: Invalid email or password');
        }
    }
    if (urlParams.get('logout')) {
        notify?.success('You have been logged out successfully');
        // Clear any stored JWT tokens
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_email');
        document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
});

// Validation helpers
function validateEmail(email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(String(email).toLowerCase()); }
function validatePassword(password) { return password.length >= 8; }

// Backward compatibility alias (optional)
if (typeof window !== 'undefined' && window.notify && !window.toast) { window.toast = window.notify; }
