// Firebase-Enhanced Authentication System for Cross-Device Login
// This version uses Firebase Authentication to enable login across multiple devices

class FirebaseAuthSystem {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.storageSystem = null;
        this.init();
    }

    async init() {
        console.log('Initializing Firebase Auth System...');

        // Initialize Firebase
        try {
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded. Please include Firebase scripts in HTML.');
                this.fallbackToLocalStorage();
                return;
            }

            // Initialize Firebase app
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('Firebase initialized successfully');
            }

            // Get Auth instance
            this.auth = firebase.auth();

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                console.log('Auth state changed:', user ? user.email : 'No user');
                this.currentUser = user;

                if (user && !window.location.pathname.includes('login.html')) {
                    this.handleAuthenticatedUser(user);
                }
            });

        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.fallbackToLocalStorage();
            return;
        }

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

    fallbackToLocalStorage() {
        console.warn('Falling back to localStorage authentication');
        // Load the old auth system as fallback
        this.users = new Map();
        this.loadLocalUsers();
    }

    loadLocalUsers() {
        const storedUsers = localStorage.getItem('data_bhandaar_users');
        if (storedUsers) {
            try {
                const usersArray = JSON.parse(storedUsers);
                this.users = new Map(usersArray);
                console.log('Loaded local users:', Array.from(this.users.keys()));
            } catch (e) {
                console.error('Error loading local users:', e);
            }
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
        this.clearLocalSession();
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
        console.log('Firebase login attempt');

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('errorMessage');

        if (!usernameInput || !passwordInput) {
            console.error('Login form elements not found');
            return;
        }

        const username = usernameInput.value.trim();
        const pin = passwordInput.value.trim();

        if (!username || !pin) {
            this.showError(errorMessage, 'PLEASE_FILL_ALL_FIELDS');
            return;
        }

        // Validate inputs
        if (!this.validateInputs(username, pin)) {
            this.showError(errorMessage, 'INVALID_INPUT_FORMAT_(USERNAME:_3-20_CHARS,_PIN:_4_DIGITS)');
            return;
        }

        // Show loading state
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.querySelector('.btn-text').textContent = 'AUTHENTICATING...';
            loginBtn.disabled = true;
        }

        try {
            // Convert username to email format for Firebase
            const email = this.usernameToEmail(username);

            // Authenticate with Firebase
            await this.auth.signInWithEmailAndPassword(email, pin);

            // Success! Firebase will trigger onAuthStateChanged
            this.showError(errorMessage, 'ACCESS_GRANTED_REDIRECTING...', 'success');

            // Store username in localStorage for quick access
            localStorage.setItem('data_bhandaar_current_user', username);

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            console.error('Firebase login error:', error);

            let errorMsg = 'LOGIN_FAILED';
            if (error.code === 'auth/user-not-found') {
                errorMsg = 'USER_NOT_FOUND_PLEASE_REGISTER';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'INVALID_PIN';
            } else if (error.code === 'auth/too-many-requests') {
                errorMsg = 'TOO_MANY_ATTEMPTS_TRY_LATER';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'NETWORK_ERROR_CHECK_CONNECTION';
            }

            this.showError(errorMessage, errorMsg);
        } finally {
            // Restore button state
            if (loginBtn) {
                loginBtn.querySelector('.btn-text').textContent = 'LOGIN';
                loginBtn.disabled = false;
            }
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        console.log('Firebase signup attempt');

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

        if (!username || !pin || !confirmPin) {
            this.showError(errorMessage, 'PLEASE_FILL_ALL_FIELDS');
            return;
        }

        // Validate inputs
        if (!this.validateInputs(username, pin)) {
            this.showError(errorMessage, 'INVALID_INPUT_FORMAT_(USERNAME:_3-20_CHARS,_PIN:_4_DIGITS)');
            return;
        }

        if (pin !== confirmPin) {
            this.showError(errorMessage, 'PINS_DO_NOT_MATCH');
            return;
        }

        // Show loading state
        const signupBtn = document.querySelector('.signup-form .login-btn');
        if (signupBtn) {
            signupBtn.querySelector('.btn-text').textContent = 'CREATING_ACCOUNT...';
            signupBtn.disabled = true;
        }

        try {
            // Convert username to email format for Firebase
            const email = this.usernameToEmail(username);

            // Create user with Firebase
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, pin);

            // Update profile with display name (username)
            await userCredential.user.updateProfile({
                displayName: username
            });

            console.log('Firebase account created successfully for:', username);

            this.showError(errorMessage, 'ACCOUNT_CREATED_REDIRECTING...', 'success');

            // Store username in localStorage
            localStorage.setItem('data_bhandaar_current_user', username);

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            console.error('Firebase signup error:', error);

            let errorMsg = 'ACCOUNT_CREATION_FAILED';
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'USERNAME_ALREADY_EXISTS';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'PIN_TOO_WEAK_(USE_4_DIGITS)';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'NETWORK_ERROR_CHECK_CONNECTION';
            }

            this.showError(errorMessage, errorMsg);
        } finally {
            // Restore button state
            if (signupBtn) {
                signupBtn.querySelector('.btn-text').textContent = 'CREATE_ACCOUNT';
                signupBtn.disabled = false;
            }
        }
    }

    validateInputs(username, pin) {
        const validationPatterns = {
            username: /^[a-zA-Z0-9_]{3,20}$/, // Alphanumeric and underscore, 3-20 chars
            pin: /^\d{4}$/ // Exactly 4 digits
        };

        return validationPatterns.username.test(username) &&
               validationPatterns.pin.test(pin);
    }

    // Convert username to email format for Firebase
    // Since Firebase requires email, we create a pseudo-email from username
    usernameToEmail(username) {
        return `${username.toLowerCase()}@databhandaar.local`;
    }

    // Extract username from email
    emailToUsername(email) {
        return email.split('@')[0];
    }

    handleAuthenticatedUser(user) {
        // User is logged in
        const username = user.displayName || this.emailToUsername(user.email);

        const session = {
            username: username,
            email: user.email,
            uid: user.uid,
            loginTime: new Date().toISOString(),
            provider: 'firebase'
        };

        try {
            localStorage.setItem('data_bhandaar_session', JSON.stringify(session));
            localStorage.setItem('data_bhandaar_current_user', username);
            console.log('Session created for:', username);
        } catch (e) {
            console.error('Error saving session:', e);
        }
    }

    clearLocalSession() {
        try {
            localStorage.removeItem('data_bhandaar_session');
            localStorage.removeItem('data_bhandaar_current_user');
        } catch (e) {
            console.error('Error clearing session:', e);
        }
    }

    showError(element, message, type = 'error') {
        if (element) {
            element.textContent = `>_ ${message}`;
            element.style.display = 'block';
            element.className = 'error-message';

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
        // Check if user is authenticated with Firebase
        if (!this.auth) {
            console.log('Firebase not initialized, checking local session');
            const session = this.getCurrentSession();
            if (!session) {
                console.log('No session, redirecting to login');
                window.location.href = 'login.html';
                return null;
            }
            return session;
        }

        // Firebase will handle auth state through onAuthStateChanged
        const user = this.auth.currentUser;
        if (!user) {
            // Wait a moment for Firebase to initialize
            setTimeout(() => {
                if (!this.auth.currentUser) {
                    console.log('No Firebase user, redirecting to login');
                    window.location.href = 'login.html';
                }
            }, 1000);
            return null;
        }

        console.log('Firebase user authenticated:', user.email);
        return {
            username: user.displayName || this.emailToUsername(user.email),
            email: user.email
        };
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
        if (this.auth && this.auth.currentUser) {
            return this.auth.currentUser.displayName ||
                   this.emailToUsername(this.auth.currentUser.email);
        }

        const session = this.getCurrentSession();
        return session ? session.username : null;
    }

    static checkAuth() {
        // Check Firebase auth first
        if (typeof firebase !== 'undefined' && firebase.auth()) {
            const user = firebase.auth().currentUser;
            if (user) {
                return {
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    uid: user.uid
                };
            }
        }

        // Fallback to localStorage
        try {
            const session = localStorage.getItem('data_bhandaar_session');
            if (!session) {
                console.log('No session found');
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

    static async logout() {
        try {
            // Sign out from Firebase
            if (typeof firebase !== 'undefined' && firebase.auth()) {
                await firebase.auth().signOut();
                console.log('Firebase logout successful');
            }

            // Clear localStorage
            localStorage.removeItem('data_bhandaar_session');
            localStorage.removeItem('data_bhandaar_current_user');
            console.log('Local session cleared');
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

// Initialize Firebase auth system
const authSystem = new FirebaseAuthSystem();

// Make auth system globally available
window.AuthSystem = FirebaseAuthSystem;
window.authSystem = authSystem;
