/**
 * Session Auth Interceptor - Handles session-based authentication
 * and manages authentication/session events
 */
// Hybrid Authentication Interceptor - Supports both JWT and Traditional Session auth
document.addEventListener('DOMContentLoaded', function() {

    // Check if user is authenticated when accessing protected pages
    function checkAuthentication() {
        const token = localStorage.getItem('jwt_token');
        const currentPath = window.location.pathname;

        // Protected routes that require authentication
        const protectedRoutes = ['/dashboard', '/admin/dashboard'];

        if (protectedRoutes.includes(currentPath) && !token) {
            // For pages that require JWT authentication, check if we have a token
            // If not, let traditional session authentication handle it
            console.log('[auth-interceptor] No JWT token found, relying on session authentication');
        }

        return true;
    }

    // Add JWT token to all API requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        const token = localStorage.getItem('jwt_token');

        // Add Authorization header for API requests
        if (url.startsWith('/api/') && token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }

        return originalFetch(url, options)
            .then(response => {
                // Handle 401/403 responses by clearing JWT token and letting session auth handle it
                if ((response.status === 401 || response.status === 403) && token) {
                    console.log('[auth-interceptor] JWT token expired or invalid, clearing token');
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('user_email');
                    document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

                    // For API requests, show error message
                    if (url.startsWith('/api/')) {
                        if (typeof notify !== 'undefined') {
                            notify.error('Session expired. Please log in again.');
                        }
                        setTimeout(() => window.location.href = '/auth/login?error=session_expired', 1000);
                    }
                }
                return response;
            });
    };

    // Check authentication on page load
    checkAuthentication();

    // Handle logout functionality
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Clear all authentication data
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_roles');
            sessionStorage.clear();

            // Clear all cookies related to authentication
            document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict;';
            document.cookie = 'JSESSIONID=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict;';

            // Clear any cached authentication state
            if (window.sessionStorage) {
                sessionStorage.setItem('logged_out', 'true');
            }

            // Force page refresh to clear any cached content
            window.location.replace('/logout');
        });
    });

    // Prevent back navigation to protected pages after logout
    if (sessionStorage.getItem('logged_out') === 'true') {
        sessionStorage.removeItem('logged_out');
        // Clear any remaining authentication data
        localStorage.clear();
        window.history.replaceState(null, null, '/auth/login');
    }

    // Detect browser back/forward navigation and check authentication
    window.addEventListener('pageshow', function(event) {
        // Add a small delay to ensure tokens are properly stored
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const protectedRoutes = ['/dashboard', '/admin/dashboard'];

            if (protectedRoutes.includes(currentPath)) {
                const token = localStorage.getItem('jwt_token');
                const hasSession = document.cookie.includes('JSESSIONID');
                const hasJwtCookie = document.cookie.includes('jwt_token');

                // If coming from login success, give it more time for token storage
                const isFromLoginSuccess = window.location.search.includes('login=success');

                if (isFromLoginSuccess) {
                    // Skip validation if coming from successful login
                    console.log('[auth-interceptor] Login success detected, skipping token validation');
                    return;
                }

                // If no authentication data and accessing protected route, redirect to login
                if (!token && !hasSession && !hasJwtCookie) {
                    console.log('[auth-interceptor] No authentication found, redirecting to login');
                    window.location.replace('/auth/login?error=session_expired');
                    return;
                }
            }
        }, 100); // Small delay to ensure token storage is complete
    });

    // Handle authentication errors from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'unauthorized') {
        if (typeof notify !== 'undefined') {
            notify.error('Please log in to access this page');
        }
    }
    if (urlParams.get('error') === 'access_denied') {
        if (typeof notify !== 'undefined') {
            notify.error('Access denied. You do not have permission to access this resource');
        }
    }
    if (urlParams.get('error') === 'session_expired') {
        if (typeof notify !== 'undefined') {
            notify.error('Your session has expired. Please log in again');
        }
    }
    if (urlParams.get('error') === 'oauth_failed') {
        if (typeof notify !== 'undefined') {
            notify.error('OAuth login failed. Please try again or use email/password login.');
        }
    }

    // Add token to page requests (for server-side rendering)
    const token = localStorage.getItem('jwt_token');
    if (token && window.location.pathname.startsWith('/dashboard')) {
        // Add token as a cookie for server-side access
        document.cookie = `jwt_token=${token}; path=/; SameSite=Strict`;
    }
});
