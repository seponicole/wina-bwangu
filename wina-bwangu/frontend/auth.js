// Load users from localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];

// LOGIN PAGE LOGIC
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        const user = users.find(user => user.username === username && user.password === password);

        if (user) {
            localStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html'; // Redirect to dashboard (same folder)
        } else {
            alert('Invalid username or password');
        }
    });
}

// SIGNUP PAGE LOGIC
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();

        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (users.some(user => user.username === username)) {
            alert('Username already exists');
            return;
        }

        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Account created! You can now login.');
        window.location.href = 'login.html'; // Redirect to login page
    });
}
