// API Configuration
const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
        loadServices();
    } else {
        showLogin();
    }

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });

    // Service form
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveService();
    });
});

// Authentication
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        showDashboard();
        loadServices();
    } catch (error) {
        showError('loginError', error.message);
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    showLogin();
}

// Services
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/api/services`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load services');
        }

        renderServices(data.services);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function renderServices(services) {
    const container = document.getElementById('servicesList');

    if (services.length === 0) {
        container.innerHTML = '<p style="color: #666;">No services yet. Create your first service!</p>';
        return;
    }

    container.innerHTML = services.map(service => `
        <div class="service-card ${service.enabled ? '' : 'disabled'}">
            <div class="service-header">
                <div class="service-title">${service.name}</div>
                <span class="service-status ${service.enabled ? 'enabled' : 'disabled'}">
                    ${service.enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
            </div>
            <div class="service-details">
                ${service.description ? `<p>${service.description}</p>` : ''}
                <p><strong>Table:</strong> ${service.tableName}</p>
                <p><strong>Attachment Field:</strong> ${service.attachmentFieldName}</p>
                ${service.outputFieldName ? `<p><strong>Output Field:</strong> ${service.outputFieldName}</p>` : ''}
                <p><strong>Image Config:</strong>
                    ${service.imageConfig.width ? `${service.imageConfig.width}w` : ''}
                    ${service.imageConfig.height ? `${service.imageConfig.height}h` : ''}
                    ${service.imageConfig.format ? `${service.imageConfig.format}` : 'original'}
                    @ ${service.imageConfig.quality || 80}%
                </p>
                ${service.publicUrlDuration ? `<p><strong>URL Duration:</strong> ${service.publicUrlDuration} days</p>` : '<p><strong>URL Duration:</strong> Permanent</p>'}
            </div>
            <div class="service-actions">
                <button onclick="editService('${service.id}')">Edit</button>
                <button class="secondary" onclick="toggleService('${service.id}', ${service.enabled})">
                    ${service.enabled ? 'Disable' : 'Enable'}
                </button>
                <button class="danger" onclick="deleteService('${service.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openServiceModal(service = null) {
    document.getElementById('modalTitle').textContent = service ? 'Edit Service' : 'New Service';

    if (service) {
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('tableName').value = service.tableName;
        document.getElementById('attachmentField').value = service.attachmentFieldName;
        document.getElementById('outputField').value = service.outputFieldName || '';
        document.getElementById('imageWidth').value = service.imageConfig.width || '';
        document.getElementById('imageHeight').value = service.imageConfig.height || '';
        document.getElementById('imageFormat').value = service.imageConfig.format || '';
        document.getElementById('imageQuality').value = service.imageConfig.quality || 80;
        document.getElementById('urlDuration').value = service.publicUrlDuration || '';
    } else {
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceId').value = '';
    }

    document.getElementById('serviceModal').classList.add('show');
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('show');
}

async function saveService() {
    const serviceId = document.getElementById('serviceId').value;
    const isEdit = !!serviceId;

    const data = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        tableName: document.getElementById('tableName').value,
        attachmentFieldName: document.getElementById('attachmentField').value,
        outputFieldName: document.getElementById('outputField').value || null,
        imageConfig: {
            width: parseInt(document.getElementById('imageWidth').value) || undefined,
            height: parseInt(document.getElementById('imageHeight').value) || undefined,
            format: document.getElementById('imageFormat').value || undefined,
            quality: parseInt(document.getElementById('imageQuality').value) || 80,
        },
        publicUrlDuration: parseInt(document.getElementById('urlDuration').value) || null,
    };

    try {
        const response = await fetch(
            `${API_URL}/api/services${isEdit ? `/${serviceId}` : ''}`,
            {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(data),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save service');
        }

        showMessage(result.message, 'success');
        closeServiceModal();
        loadServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function editService(serviceId) {
    try {
        const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load service');
        }

        openServiceModal(data.service);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function toggleService(serviceId, currentlyEnabled) {
    try {
        const response = await fetch(`${API_URL}/api/services/${serviceId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to toggle service');
        }

        showMessage(data.message, 'success');
        loadServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete service');
        }

        showMessage(data.message, 'success');
        loadServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// UI Helpers
function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = type;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');

    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
}
