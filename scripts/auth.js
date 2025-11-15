// Enhanced Authentication System
class AuthSystem {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.storageSystem = null;
        this.init();
    }

    async init() {
        // Load users from localStorage or initialize with demo data
        this.loadUsers();
        
        // Check if we're on login page or main app
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname === '/login.html' ||
            document.getElementById('loginForm')) {
            this.setupLoginPageListeners();
        } else {
            // We're on the main app, check authentication
            this.checkAndRedirect();
        }
    }

    loadUsers() {
        const storedUsers = localStorage.getItem('data_bhandaar_users');
        if (storedUsers) {
            try {
                const usersArray = JSON.parse(storedUsers);
                this.users = new Map(usersArray);
                console.log('Loaded users:', Array.from(this.users.keys()));
            } catch (e) {
                console.error('Error loading users:', e);
                this.initializeDefaultUsers();
            }
        } else {
            this.initializeDefaultUsers();
        }
    }

    initializeDefaultUsers() {
        // Initialize with demo user
        this.users.set('admin', {
            pin: this.hashPin('1234'),
            createdAt: new Date().toISOString(),
            storageKey: 'admin'
        });
        this.users.set('demo', {
            pin: this.hashPin('0000'),
            createdAt: new Date().toISOString(),
            storageKey: 'demo'
        });
        this.saveUsers();
        console.log('Initialized default users');
    }

    saveUsers() {
        try {
            localStorage.setItem('data_bhandaar_users', JSON.stringify([...this.users]));
        } catch (e) {
            console.error('Error saving users:', e);
        }
    }

    setupLoginPageListeners() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const switchToSignup = document.getElementById('switchToSignup');
        const switchToLogin = document.getElementById('switchToLogin');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        if (switchToSignup) {
            switchToSignup.addEventListener('click', () => this.switchToSignup());
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => this.switchToLogin());
        }

        // Clear any existing session when on login page
        this.clearSession();
    }

    switchToSignup() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        if (loginForm && signupForm) {
            loginForm.style.display = 'none';
            signupForm.style.display = 'flex';
            this.clearErrors();
        }
    }

    switchToLogin() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        if (loginForm && signupForm) {
            signupForm.style.display = 'none';
            loginForm.style.display = 'flex';
            this.clearErrors();
        }
    }

    clearErrors() {
        const errorMessage = document.getElementById('errorMessage');
        const signupErrorMessage = document.getElementById('signupErrorMessage');
        if (errorMessage) errorMessage.style.display = 'none';
        if (signupErrorMessage) signupErrorMessage.style.display = 'none';
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('errorMessage');

        if (!usernameInput || !passwordInput) {
            console.error('Login form elements not found');
            return;
        }

        const username = usernameInput.value.trim();
        const pin = passwordInput.value.trim();

        console.log('Login attempt:', { username, pin });

        if (!username || !pin) {
            this.showError(errorMessage, 'PLEASE_FILL_ALL_FIELDS');
            return;
        }

        // Validate inputs using regex patterns
        if (!this.validateLoginInputs(username, pin)) {
            this.showError(errorMessage, 'INVALID_INPUT_FORMAT');
            return;
        }

        // Show loading state
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.querySelector('.btn-text').textContent = 'AUTHENTICATING...';
            loginBtn.disabled = true;
        }

        // Simulate authentication process
        const authResult = await this.authenticateUser(username, pin);
        
        // Restore button state
        if (loginBtn) {
            loginBtn.querySelector('.btn-text').textContent = 'LOGIN';
            loginBtn.disabled = false;
        }

        if (authResult.success) {
            this.showError(errorMessage, 'ACCESS_GRANTED_REDIRECTING...', 'success');
            this.createSession(username);
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showError(errorMessage, authResult.message);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        const usernameInput = document.getElementById('newUsername');
        const passwordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const errorMessage = document.getElementById('signupErrorMessage');

        if (!usernameInput || !passwordInput || !confirmPasswordInput) {
            console.error('Signup form elements not found');
            return;
        }

        const username = usernameInput.value.trim();
        const pin = passwordInput.value.trim();
        const confirmPin = confirmPasswordInput.value.trim();

        console.log('Signup attempt:', { username, pin, confirmPin });

        if (!username || !pin || !confirmPin) {
            this.showError(errorMessage, 'PLEASE_FILL_ALL_FIELDS');
            return;
        }

        // Validate inputs
        if (!this.validateSignupInputs(username, pin, confirmPin)) {
            this.showError(errorMessage, 'INVALID_INPUT_FORMAT');
            return;
        }

        if (pin !== confirmPin) {
            this.showError(errorMessage, 'PINS_DO_NOT_MATCH');
            return;
        }

        // Check if username already exists
        if (this.users.has(username)) {
            this.showError(errorMessage, 'USERNAME_ALREADY_EXISTS');
            return;
        }

        // Show loading state
        const signupBtn = document.querySelector('.signup-form .login-btn');
        if (signupBtn) {
            signupBtn.querySelector('.btn-text').textContent = 'CREATING_ACCOUNT...';
            signupBtn.disabled = true;
        }

        // Create new user
        const signupResult = await this.createUser(username, pin);
        
        // Restore button state
        if (signupBtn) {
            signupBtn.querySelector('.btn-text').textContent = 'CREATE_ACCOUNT';
            signupBtn.disabled = false;
        }

        if (signupResult.success) {
            this.showError(errorMessage, 'ACCOUNT_CREATED_REDIRECTING...', 'success');
            this.createSession(username);
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showError(errorMessage, signupResult.message);
        }
    }

    validateLoginInputs(username, pin) {
        // Enhanced regex patterns for input validation
        const validationPatterns = {
            username: /^[a-zA-Z0-9_]{3,20}$/, // Alphanumeric and underscore, 3-20 chars
            pin: /^\d{4}$/ // Exactly 4 digits
        };

        const isValid = validationPatterns.username.test(username) &&
                       validationPatterns.pin.test(pin);
        
        console.log('Login validation:', { username, pin, isValid });
        return isValid;
    }

    validateSignupInputs(username, pin, confirmPin) {
        const validationPatterns = {
            username: /^[a-zA-Z0-9_]{3,20}$/,
            pin: /^\d{4}$/
        };

        const isValid = validationPatterns.username.test(username) &&
                       validationPatterns.pin.test(pin) &&
                       validationPatterns.pin.test(confirmPin);
        
        console.log('Signup validation:', { username, pin, confirmPin, isValid });
        return isValid;
    }

    async authenticateUser(username, pin) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Authenticating user:', username);
        console.log('Available users:', Array.from(this.users.keys()));

        const user = this.users.get(username);
        
        if (!user) {
            console.log('User not found:', username);
            return { success: false, message: 'USER_NOT_FOUND' };
        }

        const hashedPin = this.hashPin(pin);
        console.log('Pin comparison:', { inputPin: pin, storedPin: user.pin, hashedInput: hashedPin });

        if (user.pin !== hashedPin) {
            console.log('Invalid pin for user:', username);
            return { success: false, message: 'INVALID_PIN' };
        }

        console.log('Authentication successful for:', username);
        return { success: true, user: { username } };
    }

    async createUser(username, pin) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const newUser = {
                pin: this.hashPin(pin),
                createdAt: new Date().toISOString(),
                storageKey: username
            };

            console.log('Creating new user:', username);
            this.users.set(username, newUser);
            this.saveUsers();

            console.log('User created successfully:', username);
            return { success: true, user: { username } };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, message: 'ACCOUNT_CREATION_FAILED' };
        }
    }

    hashPin(pin) {
        // Simple hash for demo purposes (use proper hashing in production)
        return btoa(pin).split('').reverse().join('');
    }

    createSession(username) {
        const session = {
            username,
            loginTime: new Date().toISOString(),
            token: this.generateToken()
        };
        
        console.log('Creating session for:', username);
        this.sessions.set(username, session);
        
        try {
            localStorage.setItem('data_bhandaar_session', JSON.stringify(session));
            localStorage.setItem('data_bhandaar_current_user', username);
            console.log('Session saved to localStorage');
        } catch (e) {
            console.error('Error saving session:', e);
        }
    }

    clearSession() {
        try {
            localStorage.removeItem('data_bhandaar_session');
            localStorage.removeItem('data_bhandaar_current_user');
            console.log('Session cleared');
        } catch (e) {
            console.error('Error clearing session:', e);
        }
    }

    generateToken() {
        return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    showError(element, message, type = 'error') {
        if (element) {
            element.textContent = `>_ ${message}`;
            element.style.display = 'block';
            element.className = 'error-message'; // Reset class
            
            if (type === 'success') {
                element.classList.add('success');
            }
            
            setTimeout(() => {
                element.style.display = 'none';
                element.classList.remove('success');
            }, 5000);
        }
    }

    checkAndRedirect() {
        const session = this.getCurrentSession();
        if (!session) {
            console.log('No active session, redirecting to login');
            window.location.href = 'login.html';
            return null;
        }
        
        console.log('Active session found for:', session.username);
        return session;
    }

    getCurrentSession() {
        try {
            const session = localStorage.getItem('data_bhandaar_session');
            return session ? JSON.parse(session) : null;
        } catch (e) {
            console.error('Error getting session:', e);
            return null;
        }
    }

    getCurrentUser() {
        const session = this.getCurrentSession();
        return session ? session.username : null;
    }

    static checkAuth() {
        try {
            const session = localStorage.getItem('data_bhandaar_session');
            if (!session) {
                console.log('No session found, redirecting to login');
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                return null;
            }
            return JSON.parse(session);
        } catch (e) {
            console.error('Error checking auth:', e);
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
            return null;
        }
    }

    static logout() {
        try {
            localStorage.removeItem('data_bhandaar_session');
            localStorage.removeItem('data_bhandaar_current_user');
            console.log('Logout successful');
        } catch (e) {
            console.error('Error during logout:', e);
        }
        window.location.href = 'login.html';
    }

    // Initialize storage system separately
    async initStorageSystem() {
        if (!this.storageSystem) {
            this.storageSystem = new StorageManager();
            await this.storageSystem.init();
            console.log('Storage system initialized');
        }
        return this.storageSystem;
    }

    getStorageSystem() {
        return this.storageSystem;
    }
}

// Initialize auth system immediately
const authSystem = new AuthSystem();

// Make auth system globally available
window.AuthSystem = AuthSystem;
window.authSystem = authSystem;