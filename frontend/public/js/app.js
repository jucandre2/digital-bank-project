let userToken = localStorage.getItem('user_token');
let currentUser = null;
let allPermissions = [];

const ui = {
    loginSection: document.getElementById('login-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    mainDashboardPanel: document.getElementById('main-dashboard-panel'),
    adminPanel: document.getElementById('admin-panel'),
    logsPanel: document.getElementById('logs-panel'),
    permissionsPanel: document.getElementById('permissions-panel'),
    adminMenuItemUsers: document.getElementById('admin-menu-item-users'),
    adminMenuItemLogs: document.getElementById('admin-menu-item-logs'),
    adminMenuItemPermissions: document.getElementById('admin-menu-item-permissions'),
    welcomeText: document.getElementById('welcome-text'),
    feedbackMessage: document.getElementById('feedback-message'),
    usersTableBody: document.getElementById('users-table-body'),
    logsTableBody: document.getElementById('logs-table-body'),
    addUserForm: document.getElementById('add-user-form'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    permissionsList: document.getElementById('permissions-list'),
    roleSelect: document.getElementById('role-select'),
    balanceModal: document.getElementById('balance-modal'),
    passwordModal: document.getElementById('password-modal'),
    biometricsModal: document.getElementById('biometrics-modal'),
};

function showSection(sectionId) {
    ui.loginSection.classList.add('hidden');
    ui.dashboardSection.classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}

function showMessage(text, type = 'success') {
    const el = ui.feedbackMessage;
    const alertType = type === 'error' ? 'alert-danger' : 'alert-success';
    el.className = `alert ${alertType} mb-4`;
    el.innerText = text;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function setActiveTab(activeLink) {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => link.classList.remove('active'));
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

async function apiFetch(endpoint, options = {}) {
    options.headers = { ...options.headers, 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` };
    const response = await fetch(endpoint, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || `Erro na API: ${response.statusText}`);
    }
    return data;
}

async function handleGoogleLogin(response) {
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ credential: response.credential })
        });
        userToken = data.access_token;
        localStorage.setItem('user_token', userToken);
        currentUser = data.user;
        setupDashboard(currentUser);
        showSection('dashboard-section');
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    localStorage.removeItem('user_token');
    userToken = null;
    currentUser = null;
    window.location.reload();
}

function setupDashboard(user) {
    ui.welcomeText.innerText = `Bem-vindo, ${user.name.split(' ')[0]}`;
    const isAdmin = user.role === 'Admin';
    const userPermissions = new Set(user.permissions || []);

    ui.adminMenuItemUsers.classList.toggle('hidden', !isAdmin && !userPermissions.has('CAN_MANAGE_USERS'));
    ui.adminMenuItemLogs.classList.toggle('hidden', !isAdmin && !userPermissions.has('CAN_VIEW_AUDIT_LOGS'));
    ui.adminMenuItemPermissions.classList.toggle('hidden', !isAdmin && !userPermissions.has('CAN_MANAGE_PERMISSIONS'));

    if (isAdmin || userPermissions.has('CAN_VIEW_CUSTOMER_DATA') || userPermissions.has('CAN_RESET_CUSTOMER_PASSWORD') || userPermissions.has('CAN_RESET_CUSTOMER_BIOMETRICS') || userPermissions.has('CAN_SEND_DOCUMENTS')) {
        renderOperatorDashboard(user);
    } else {
        renderUserDashboard();
    }
    showMainDashboard();
}

function showMainDashboard() {
    ui.mainDashboardPanel.classList.remove('hidden');
    ui.adminPanel.classList.add('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.add('hidden');
    setActiveTab(document.querySelector('a[onclick="showMainDashboard()"]'));
}

async function showAdminPanel() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.remove('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.add('hidden');
    setActiveTab(ui.adminMenuItemUsers.querySelector('a'));

    ui.usersTableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    try {
        const users = await apiFetch('/api/backoffice-users');
        ui.usersTableBody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.full_name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${u.id}, '${u.full_name}', '${u.role}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteUser(${u.id}, '${u.full_name}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    } catch (error) { showMessage(error.message, 'error'); }
}

async function showAuditLogs() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.add('hidden');
    ui.logsPanel.classList.remove('hidden');
    ui.permissionsPanel.classList.add('hidden');
    setActiveTab(ui.adminMenuItemLogs.querySelector('a'));

    ui.logsTableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    try {
        const logs = await apiFetch('/api/audit-logs');
        ui.logsTableBody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td>${log.user_email}</td>
                <td>${log.action}</td>
                <td>${log.details || ''}</td>
            </tr>
        `).join('');
    } catch (error) { showMessage(error.message, 'error'); }
}

async function showPermissionsPanel() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.add('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.remove('hidden');
    setActiveTab(ui.adminMenuItemPermissions.querySelector('a'));

    try {
        if (allPermissions.length === 0) {
            allPermissions = await apiFetch('/api/permissions');
        }
        loadPermissionsForRole();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function openEditModal(userId, fullName, role) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-bo-name').value = fullName;
    document.getElementById('edit-bo-role').value = role;
    ui.editUserModal.classList.remove('hidden');
}

function closeEditModal() {
    ui.editUserModal.classList.add('hidden');
}

function closeAllModals() {
    ui.editUserModal.classList.add('hidden');
    ui.balanceModal.classList.add('hidden');
    ui.passwordModal.classList.add('hidden');
    ui.biometricsModal.classList.add('hidden');
}

function showServiceModal(modal) {
    closeAllModals();
    modal.classList.remove('hidden');
}

ui.addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUser = {
        email: document.getElementById('new-bo-email').value,
        full_name: document.getElementById('new-bo-name').value,
        role: document.getElementById('new-bo-role').value,
    };
    try {
        await apiFetch('/api/backoffice-users', { method: 'POST', body: JSON.stringify(newUser) });
        showMessage('Usuário criado com sucesso!', 'success');
        e.target.reset();
        showAdminPanel();
    } catch (error) { showMessage(error.message, 'error'); }
});

ui.editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const updatedUser = {
        full_name: document.getElementById('edit-bo-name').value,
        role: document.getElementById('edit-bo-role').value,
    };
    try {
        await apiFetch(`/api/backoffice-users/${userId}`, { method: 'PUT', body: JSON.stringify(updatedUser) });
        showMessage('Usuário atualizado com sucesso!', 'success');
        closeEditModal();
        showAdminPanel();
    } catch (error) { showMessage(error.message, 'error'); }
});

async function deleteUser(userId, userName) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
        try {
            await apiFetch(`/api/backoffice-users/${userId}`, { method: 'DELETE' });
            showMessage('Usuário excluído com sucesso!', 'success');
            showAdminPanel();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (userToken) {
        try {
            const payload = JSON.parse(atob(userToken.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
                currentUser = { name: payload.name, email: payload.email, role: payload.role, permissions: payload.permissions };
                setupDashboard(currentUser);
                showSection('dashboard-section');
            } else { logout(); }
        } catch (e) { logout(); }
    } else {
        showSection('login-section');
    }
});

function renderUserDashboard() {
    ui.mainDashboardPanel.innerHTML = '<h2 class="fw-light mb-4">Dashboard</h2><div class="card"><div class="card-body"><h3>Acesso Básico</h3><p>Bem-vindo ao portal. Você tem permissões de usuário comum.</p></div></div>';
}

function renderOperatorDashboard(user) {
    const isAdmin = user.role === 'Admin';
    const userPermissions = new Set(user.permissions || []);

    const balanceCard = (isAdmin || userPermissions.has('CAN_VIEW_CUSTOMER_DATA')) ? `
        <div class="service-card" onclick="showServiceModal(ui.balanceModal)">
            <div class="icon">💰</div><h5>Consulta de Saldo</h5><p>Verificar o saldo de um cliente específico pelo ID.</p>
        </div>` : '';

    const passwordCard = (isAdmin || userPermissions.has('CAN_RESET_CUSTOMER_PASSWORD')) ? `
        <div class="service-card" onclick="showServiceModal(ui.passwordModal)">
            <div class="icon">🔑</div><h5>Reset de Senha</h5><p>Redefinir a senha de acesso de um cliente.</p>
        </div>` : '';

    const biometricsCard = (isAdmin || userPermissions.has('CAN_RESET_CUSTOMER_BIOMETRICS')) ? `
        <div class="service-card" onclick="showServiceModal(ui.biometricsModal)">
            <div class="icon">👆</div><h5>Reset de Biometria</h5><p>Solicitar a remoção da biometria de um cliente.</p>
        </div>` : '';

    const documentsCard = (isAdmin || userPermissions.has('CAN_SEND_DOCUMENTS')) ? `
        <div class="service-card" onclick="alert('Funcionalidade em desenvolvimento.')">
            <div class="icon">📄</div><h5>Envio de Documentos</h5><p>Processar e enviar arquivos PDF para clientes via S3.</p>
        </div>` : '';

    ui.mainDashboardPanel.innerHTML = `
        <h2 class="fw-light mb-4">Serviços Operacionais</h2>
        <div class="service-grid">
            ${balanceCard}
            ${passwordCard}
            ${biometricsCard}
            ${documentsCard}
        </div>
    `;
}
