/**
 * OAuth2 redirect handler
 * Processes the authentication token after successful OAuth2 login
 */
window.onload = function() {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Store token in localStorage
        localStorage.setItem('jwt_token', token);

        // Parse token to get user information
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const tokenData = JSON.parse(window.atob(base64));

        localStorage.setItem('user_email', tokenData.sub);

        // Check roles from the token and redirect accordingly
        const roles = tokenData.roles.split(',');
        localStorage.setItem('user_roles', JSON.stringify(roles));

        if (roles.includes('ROLE_ADMIN')) {
            window.location.href = '/admin/dashboard';
        } else {
            window.location.href = '/dashboard';
        }
    } else {
        // No token found, redirect to login
        window.location.href = '/login';
    }
};

