// Data Management
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')),
    setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),
    clearCurrentUser: () => localStorage.removeItem('currentUser')
};

// Initial Data Setup
function initData() {
    if (Storage.get('users').length === 0) {
        Storage.set('users', [
            { name: 'Admin User', email: 'admin@test.com', password: 'password', role: 'admin' },
            { name: 'Staff User', email: 'staff@test.com', password: 'password', role: 'staff' },
            { name: 'Regular User', email: 'user@test.com', password: 'password', role: 'user' }
        ]);
    }
    if (Storage.get('stations').length === 0) {
        Storage.set('stations', [
            { id: '1', name: 'Shell City Center', location: 'Downtown', fuelTypes: ['petrol', 'diesel'], stock: { petrol: 5000, diesel: 3000 }, availability: true, lastUpdated: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1545147986-a9d6f210df77?auto=format&fit=crop&q=80&w=400', mapLink: 'https://goo.gl/maps/xyz1' },
            { id: '2', name: 'Ceypetco Highway', location: 'Main Road', fuelTypes: ['petrol'], stock: { petrol: 0 }, availability: false, lastUpdated: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1527010150264-770ba53ec3a4?auto=format&fit=crop&q=80&w=400', mapLink: 'https://goo.gl/maps/xyz2' },
            { id: '3', name: 'Lanka IOC Suburb', location: 'West End', fuelTypes: ['diesel'], stock: { diesel: 1500 }, availability: true, lastUpdated: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580136608260-42d1c4aa7fbb?auto=format&fit=crop&q=80&w=400', mapLink: 'https://goo.gl/maps/xyz3' }
        ]);
    } else {
        // Migration: Ensure existing stations have stock, fuelTypes, and mapLink
        const stations = Storage.get('stations');
        let changed = false;
        stations.forEach(s => {
            if (!s.stock) {
                s.stock = {};
                (s.fuelTypes || []).forEach(ft => s.stock[ft] = 0);
                changed = true;
            }
            if (!s.fuelTypes) {
                s.fuelTypes = ['petrol'];
                s.stock = { petrol: 0 };
                changed = true;
            }
            if (!s.mapLink) {
                s.mapLink = 'https://www.google.com/maps';
                changed = true;
            }
        });
        if (changed) Storage.set('stations', stations);
    }
    if (Storage.get('fuelLogs').length === 0) {
        Storage.set('fuelLogs', []);
    }
    if (Storage.get('blockedUsers').length === 0) {
        Storage.set('blockedUsers', []);
    }
    if (Storage.get('fuelPrices').length === 0) {
        Storage.set('fuelPrices', {
            petrol: 345.00,
            diesel: 310.00
        });
    }
    if (Storage.get('comments').length === 0) {
        Storage.set('comments', []);
    }
}

// Pricing Functions
function updateFuelPrice(fuelType, price) {
    const prices = Storage.get('fuelPrices');
    prices[fuelType] = parseFloat(price);
    Storage.set('fuelPrices', prices);
}

// Comment Functions
function addComment(stationId, userId, userName, text, type) {
    const comments = Storage.get('comments');
    comments.unshift({
        id: Date.now().toString(),
        stationId,
        userId,
        userName,
        text,
        type, // 'good' or 'bad'
        timestamp: new Date().toISOString()
    });
    Storage.set('comments', comments);
}

// Logging Functions
function logFuelChange(stationName, fuelType, amount, updatedBy) {
    const logs = Storage.get('fuelLogs');
    logs.unshift({
        stationName,
        fuelType,
        amount,
        updatedBy,
        timestamp: new Date().toISOString()
    });
    Storage.set('fuelLogs', logs.slice(0, 50)); // Keep last 50 logs
}

function toggleUserBlock(userEmail) {
    const blocked = Storage.get('blockedUsers');
    const index = blocked.indexOf(userEmail);
    if (index === -1) {
        blocked.push(userEmail);
    } else {
        blocked.splice(index, 1);
    }
    Storage.set('blockedUsers', blocked);
}

// Auth Functions
function registerUser(name, email, password, role) {
    const users = Storage.get('users');
    if (users.find(u => u.email === email)) {
        alert('Email already registered');
        return false;
    }
    users.push({ name, email, password, role });
    Storage.set('users', users);
    return true;
}

function loginUser(email, password) {
    const users = Storage.get('users');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        Storage.setCurrentUser(user);
        return true;
    }
    return false;
}

function logoutUser() {
    Storage.clearCurrentUser();
    window.location.href = 'index.html';
}

// UI Utilities
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loader.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
}

function checkAuth() {
    const user = Storage.getCurrentUser();
    const publicPages = ['index.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!user && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
    } else if (user && publicPages.includes(currentPage)) {
        window.location.href = 'dashboard.html';
    }
}

// Component Injection
function renderNavbar() {
    const user = Storage.getCurrentUser();
    const nav = document.getElementById('navbar');
    if (!nav) return;

    let navLinks = '';
    if (user) {
        navLinks = `
            <a href="dashboard.html" class="hover:text-blue-200">Dashboard</a>
            <a href="stations.html" class="hover:text-blue-200">Stations</a>
            <a href="token.html" class="hover:text-blue-200">Tokens</a>
            ${user.role === 'admin' ? '<a href="admin.html" class="hover:text-blue-200">Admin</a>' : ''}
            <button onclick="logoutUser()" class="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
        `;
    }

    nav.innerHTML = `
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="dashboard.html" class="text-xl font-bold">FuelCrisis</a>
            <div class="space-x-4 flex items-center">
                ${navLinks}
            </div>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initData();
    checkAuth();
    renderNavbar();
});
