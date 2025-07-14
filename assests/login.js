// Firebase Configuration (Replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyDRYqgVtx8Rt2aovcYpjblmI34klFc2X_0",
    authDomain: "teachconnect-70753.firebaseapp.com",
    projectId: "teachconnect-70753",
    storageBucket: "teachconnect-70753.firebasestorage.app",
    messagingSenderId: "1064030232896",
    appId: "1:1064030232896:web:afca52e5a00554fe77daa5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Notification System
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');
const notificationIcon = notification.querySelector('i');

function showNotification(message, isSuccess = true) {
    notificationText.textContent = message;
    notification.className = isSuccess ? 'notification success' : 'notification error';
    notificationIcon.className = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Tab Switching
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Switch between login and register
document.querySelector('.switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    document.querySelector('.tab[data-tab="register"]').classList.add('active');
    document.getElementById('register').classList.add('active');
});

document.querySelector('.switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    document.querySelector('.tab[data-tab="login"]').classList.add('active');
    document.getElementById('login').classList.add('active');
});

// Role Selection
const roleOptions = document.querySelectorAll('.role-option');

roleOptions.forEach(option => {
    option.addEventListener('click', () => {
        roleOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
    });
});

// Register form submit handler
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const educationLevel = document.getElementById("educationLevel").value;
    const interests = document.getElementById("interests").value;
    const phone = document.getElementById("phone").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Save additional data to Firestore
        await db.collection("students").doc(uid).set({
            name,
            email,
            educationLevel,
            interests,
            phone,
            approved: false, // Initially false until admin approves
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Registration successful! Please wait for admin approval.");
        document.getElementById("registerForm").reset();
    } catch (error) {
        console.error("Registration error:", error.message);
        alert("Error: " + error.message);
    }
});

// Login Form Submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.querySelector('.role-option.selected').getAttribute('data-role');

    try {
        // Sign in with Firebase Authentication
        await auth.signInWithEmailAndPassword(email, password);

        // Show success message
        showNotification(`Login successful as ${role}! Redirecting to dashboard...`);

        // Reset form
        document.getElementById('loginForm').reset();

        // Redirect to dashboard after 1 second
        setTimeout(() => {
            window.location.href = role === 'student' ? 'student-dashboard.html' : 'teacher-dashboard.html';
        }, 1000);

    } catch (error) {
        let errorMessage = 'Login failed. Please check your credentials.';

        // Handle specific Firebase errors
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
        }

        showNotification(errorMessage, false);
    }
});

// Forgot Password
document.querySelector('.forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;

    if (!email) {
        showNotification('Please enter your email address first.', false);
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showNotification('Password reset email sent. Please check your inbox.');
    } catch (error) {
        showNotification('Error sending reset email. Please try again.', false);
    }
});