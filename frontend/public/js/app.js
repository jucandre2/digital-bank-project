let userToken = localStorage.getItem('user_token');
let currentUser = null;
let allPermissions = [];

const ui = {
    loginSection: document.getElementById('login-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    mainDashboardPanel: document.getElementById('main-dashboard-panel'),
    adminPanel: document.getElementById('admin-panel'),
    logsPanel: document.getElementById('logs-panel'),
    logsTableBody: document.getElementById('logs-table-body'),
    logsFilterForm: document.getElementById('logs-filter-form'),
    logFilterEmail: document.getElementById('log-filter-email'),
    logFilterStartDate: document.getElementById('log-filter-start-date'),
    logFilterEndDate: document.getElementById('log-filter-end-date'),
    logFilterAction: document.getElementById('log-filter-action'),
    permissionsPanel: document.getElementById('permissions-panel'),
    adminMenuItemUsers: document.getElementById('admin-menu-item-users'),
    adminMenuItemLogs: document.getElementById('admin-menu-item-logs'),
    adminMenuItemPermissions: document.getElementById('admin-menu-item-permissions'),
    welcomeText: document.getElementById('welcome-text'),
    feedbackMessage: document.getElementById('feedback-message'),
    usersTableBody: document.getElementById('users-table-body'),
    addUserForm: document.getElementById('add-user-form'),
    editUserModal: document.getElementById('edit-user-modal'),
    editUserForm: document.getElementById('edit-user-form'),
    permissionsList: document.getElementById('permissions-list'),
    roleSelect: document.getElementById('role-select'),
    balanceModal: document.getElementById('balance-modal'),
    passwordModal: document.getElementById('password-modal'),
    biometricsModal: document.getElementById('biometrics-modal'),
    clientsPanel: document.getElementById('clients-panel'),
    clientsTableBody: document.getElementById('clients-table-body'),
    clientsMenuItem: document.getElementById('clients-menu-item'),
    clientModal: document.getElementById('client-modal'),
    clientForm: document.getElementById('client-form'),
    clientModalTitle: document.getElementById('client-modal-title'),
    clientLookupModal: document.getElementById('client-lookup-modal'),
    clientLookupForm: document.getElementById('client-lookup-form'),
    clientLookupInput: document.getElementById('client-lookup-input'),
    clientLookupResults: document.getElementById('client-lookup-results'),
    clientLookupStatementContainer: document.getElementById('client-lookup-statement-container'),
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
    ui.clientsMenuItem.classList.toggle('hidden', !isAdmin && !userPermissions.has('CAN_MANAGE_CLIENTS'));

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
    ui.clientsPanel.classList.add('hidden');
    setActiveTab(document.querySelector('a[onclick="showMainDashboard()"]'));
}

async function showAdminPanel() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.remove('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.add('hidden');
    ui.clientsPanel.classList.add('hidden');
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
    ui.clientsPanel.classList.add('hidden');
    setActiveTab(ui.adminMenuItemLogs.querySelector('a'));
    await fetchAndRenderLogs({});
}

async function fetchAndRenderLogs(filterPayload = {}) {
    ui.logsTableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    try {
        const logs = await apiFetch('/api/audit-logs/search', {
            method: 'POST',
            body: JSON.stringify(filterPayload)
        });

        if (logs.length === 0) {
            ui.logsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum log encontrado para os filtros aplicados.</td></tr>';
            return;
        }
        ui.logsTableBody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td>${log.user_email}</td>
                <td>${log.action}</td>
                <td>${log.details || ''}</td>
            </tr>
        `).join('');
    } catch (error) { 
        showMessage(error.message, 'error'); 
        ui.logsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar os logs.</td></tr>';
    }
}

ui.logsFilterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {};
    if (ui.logFilterEmail.value) {
        payload.email = ui.logFilterEmail.value;
    }
    if (ui.logFilterStartDate.value) {
        payload.start_date = ui.logFilterStartDate.value;
    }
    if (ui.logFilterEndDate.value) {
        payload.end_date = ui.logFilterEndDate.value;
    }
    if (ui.logFilterAction.value) {
        payload.action = ui.logFilterAction.value;
    }
    
    await fetchAndRenderLogs(payload);
});

async function clearLogFilters() {
    ui.logsFilterForm.reset();
    await fetchAndRenderLogs({});
}

async function showPermissionsPanel() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.add('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.remove('hidden');
    ui.clientsPanel.classList.add('hidden');
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

async function loadPermissionsForRole() {
    const roleName = ui.roleSelect.value;
    ui.permissionsList.innerHTML = 'Carregando permissões...';

    if (roleName === 'Admin') {
        ui.permissionsList.innerHTML = '<div class="alert alert-info">O perfil Admin tem acesso irrestrito a todas as funcionalidade. Suas permissões não são editáveis.</div>';
        document.querySelector('#permissions-panel button').disabled = true;
        return;
    }

    document.querySelector('#permissions-panel button').disabled = false;

    try {
        const rolePermissionsData = await apiFetch(`/api/roles/${roleName}/permissions`);
        const rolePermissionNames = new Set(rolePermissionsData.map(p => p.name));

        let permissionsHtml = allPermissions.map(permission => `
            <div class="form-check form-switch mb-2">
                <input class="form-check-input" 
                       type="checkbox" 
                       role="switch" 
                       id="perm-${permission.id}" 
                       value="${permission.id}"
                       ${rolePermissionNames.has(permission.name) ? 'checked' : ''}>
                <label class="form-check-label" for="perm-${permission.id}">
                    ${permission.name}
                </label>
            </div>
        `).join('');

        ui.permissionsList.innerHTML = permissionsHtml;

    } catch (error) {
        showMessage(error.message, 'error');
        ui.permissionsList.innerHTML = '<div class="alert alert-danger">Não foi possível carregar as permissões.</div>';
    }
}

async function savePermissions() {
    const roleName = ui.roleSelect.value;
    if (!roleName || roleName === 'Admin') {
        showMessage('Não é possível alterar as permissões do perfil Admin.', 'error');
        return;
    }

    const checkedPermissions = document.querySelectorAll('#permissions-list .form-check-input:checked');
    const permissionIds = Array.from(checkedPermissions).map(checkbox => parseInt(checkbox.value));

    const payload = {
        permission_ids: permissionIds
    };

    try {
        await apiFetch(`/api/roles/${roleName}/permissions`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showMessage('Permissões salvas com sucesso!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function openEditModal(userId, fullName, role) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-bo-name').value = fullName;
    document.getElementById('edit-bo-role').value = role;
    const modalInstance = new bootstrap.Modal(ui.editUserModal);
    modalInstance.show();
}

function closeEditModal() {
    const modalInstance = bootstrap.Modal.getInstance(ui.editUserModal);
    if (modalInstance) {
        modalInstance.hide();
    }
}

function closeAllModals() {
    const editModalInstance = bootstrap.Modal.getInstance(ui.editUserModal);
    if (editModalInstance) {
        editModalInstance.hide();
    }
    
    if(ui.balanceModal) ui.balanceModal.classList.add('hidden');
    if(ui.passwordModal) ui.passwordModal.classList.add('hidden');
    if(ui.biometricsModal) ui.biometricsModal.classList.add('hidden');
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

    const clientLookupCard = (isAdmin || userPermissions.has('CAN_MANAGE_CLIENTS')) ? `
        <div class="service-card" onclick="openClientLookupModal()">
            <div class="icon">👤</div><h5>Consulta de Cliente</h5><p>Buscar os dados de um cliente pelo seu CPF ou nome.</p>
        </div>` : '';

    const passwordCard = (isAdmin || userPermissions.has('CAN_RESET_CUSTOMER_PASSWORD')) ? `
        <div class="service-card" onclick="alert('Funcionalidade em desenvolvimento.')">
            <div class="icon">🔑</div><h5>Reset de Senha</h5><p>Redefinir a senha de acesso de um cliente.</p>
        </div>` : '';

    const biometricsCard = (isAdmin || userPermissions.has('CAN_RESET_CUSTOMER_BIOMETRICS')) ? `
        <div class="service-card" onclick="alert('Funcionalidade em desenvolvimento.')">
            <div class="icon">👆</div><h5>Reset de Biometria</h5><p>Solicitar a remoção da biometria de um cliente.</p>
        </div>` : '';

    const documentsCard = (isAdmin || userPermissions.has('CAN_SEND_DOCUMENTS')) ? `
        <div class="service-card" onclick="alert('Funcionalidade em desenvolvimento.')">
            <div class="icon">📄</div><h5>Envio de Documentos</h5><p>Processar e enviar arquivos PDF para clientes via S3.</p>
        </div>` : '';

    ui.mainDashboardPanel.innerHTML = `
        <h2 class="fw-light mb-4">Serviços Operacionais</h2>
        <div class="service-grid">
            ${clientLookupCard}
            ${passwordCard}
            ${biometricsCard}
            ${documentsCard}
        </div>
    `;
}

async function showClientsPanel() {
    ui.mainDashboardPanel.classList.add('hidden');
    ui.adminPanel.classList.add('hidden');
    ui.logsPanel.classList.add('hidden');
    ui.permissionsPanel.classList.add('hidden');
    ui.clientsPanel.classList.remove('hidden');
    setActiveTab(ui.clientsMenuItem.querySelector('a'));
    await renderClients();
}

async function renderClients() {
    ui.clientsTableBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    try {
        const clients = await apiFetch('/api/clients');
        if (clients.length === 0) {
            ui.clientsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum cliente cadastrado.</td></tr>';
            return;
        }
        ui.clientsTableBody.innerHTML = clients.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.full_name}</td>
                <td>${c.cpf}</td>
                <td>${c.account_number}</td>
                <td>${c.branch}</td>
                <td>R$ ${c.balance}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openClientModal(${c.id})">Editar</button>
                    <button class="btn btn-sm btn-outline-secondary ms-2" disabled>Extrato</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage(error.message, 'error');
        ui.clientsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar clientes.</td></tr>';
    }
}

async function openClientModal(clientId = null) {
    const modal = new bootstrap.Modal(ui.clientModal);
    ui.clientForm.reset();
    document.getElementById('client-id').value = '';

    if (clientId) {
        ui.clientModalTitle.innerText = 'Editar Cliente';
        document.getElementById('client-password-group').classList.add('hidden');
        
        try {
            const client = await apiFetch(`/api/clients/${clientId}`);
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-full-name').value = client.full_name;
            document.getElementById('client-cpf').value = client.cpf;
            document.getElementById('client-rg').value = client.rg;
            document.getElementById('client-address').value = client.address;
        } catch(error) {
            showMessage(error.message, 'error');
            return;
        }

    } else {
        ui.clientModalTitle.innerText = 'Adicionar Novo Cliente';
        document.getElementById('client-password-group').classList.remove('hidden');
    }

    modal.show();
}

ui.clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientId = document.getElementById('client-id').value;
    const isEditing = !!clientId;

    const clientData = {
        full_name: document.getElementById('client-full-name').value,
        cpf: document.getElementById('client-cpf').value,
        rg: document.getElementById('client-rg').value,
        address: document.getElementById('client-address').value
    };

    let endpoint = '/api/clients';
    let method = 'POST';

    if (isEditing) {
        endpoint = `/api/clients/${clientId}`;
        method = 'PUT';
    } else {
        const password = document.getElementById('client-password').value;
        if (!password) {
            showMessage('A senha é obrigatória para novos clientes.', 'error');
            return;
        }
        clientData.password = password;
    }

    try {
        await apiFetch(endpoint, { method: method, body: JSON.stringify(clientData) });
        showMessage(`Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        bootstrap.Modal.getInstance(ui.clientModal).hide();
        await renderClients();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

function openClientLookupModal() {
    const modal = new bootstrap.Modal(ui.clientLookupModal);
    ui.clientLookupForm.reset();
    ui.clientLookupResults.innerHTML = '<p class="text-center text-muted">Aguardando busca...</p>';
    ui.clientLookupStatementContainer.innerHTML = '';
    modal.show();
}

ui.clientLookupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = ui.clientLookupInput.value.trim();
    if (!searchTerm) return;

    ui.clientLookupResults.innerHTML = '<p class="text-center">Buscando...</p>';
    ui.clientLookupStatementContainer.innerHTML = '';

    try {
        const results = await apiFetch(`/api/clients?q=${encodeURIComponent(searchTerm)}`);
        
        if (results.length > 0) {
            const client = results[0];
            renderClientLookupResult(client);
        } else {
            ui.clientLookupResults.innerHTML = `<div class="alert alert-warning text-center">Nenhum cliente encontrado para "${searchTerm}".</div>`;
        }

    } catch (error) {
        ui.clientLookupResults.innerHTML = `<div class="alert alert-danger text-center">Ocorreu um erro ao buscar o cliente.</div>`;
    }
});

async function renderClientLookupResult(client) {
    const resultHtml = `
        <dl class="row">
            <dt class="col-sm-4">Nome Completo</dt>
            <dd class="col-sm-8">${client.full_name}</dd>
            <dt class="col-sm-4">CPF</dt>
            <dd class="col-sm-8">${client.cpf}</dd>
            <dt class="col-sm-4">RG</dt>
            <dd class="col-sm-8">${client.rg}</dd>
            <dt class="col-sm-4">Endereço</dt>
            <dd class="col-sm-8">${client.address}</dd>
            <hr class="my-2">
            <dt class="col-sm-4">Conta</dt>
            <dd class="col-sm-8">${client.account_number}</dd>
            <dt class="col-sm-4">Agência</dt>
            <dd class="col-sm-8">${client.branch}</dd>
            <dt class="col-sm-4">Saldo Atual</dt>
            <dd class="col-sm-8 fw-bold">R$ ${client.balance}</dd>
        </dl>
    `;
    ui.clientLookupResults.innerHTML = resultHtml;

    // Busca e renderiza o extrato
    ui.clientLookupStatementContainer.innerHTML = '<p class="text-center">Carregando extrato...</p>';
    try {
        const statement = await apiFetch(`/api/clients/${client.id}/statement`);
        renderStatementTable(statement, ui.clientLookupStatementContainer);
    } catch (error) {
        ui.clientLookupStatementContainer.innerHTML = '<p class="text-center text-danger">Não foi possível carregar o extrato.</p>';
    }
}

function renderStatementTable(statement, containerEl) {
    if (statement.length === 0) {
        containerEl.innerHTML = '<h5>Últimas Movimentações</h5><p class="text-center text-muted">Nenhuma transação encontrada.</p>';
        return;
    }

    const tableRows = statement.map(t => {
        const isCredit = t.type === 'credit';
        const amountClass = isCredit ? 'text-credit' : 'text-debit';
        const amountSign = isCredit ? '+' : '';
        return `
            <tr>
                <td>${new Date(t.timestamp).toLocaleDateString('pt-BR')}</td>
                <td>${t.description}</td>
                <td class="${amountClass}">${amountSign} R$ ${t.amount}</td>
            </tr>
        `;
    }).join('');

    containerEl.innerHTML = `
        <h5 class="mt-3">Últimas Movimentações</h5>
        <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}
