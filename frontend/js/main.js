// Global State
let currentUser = null;
let isAdmin = false;
let loggedIn = false;
let currentPage = 'dashboard';
let stockData = { products: [], pagination: {} };
let historyData = { history: [], pagination: {} };
let personData = { persons: [], pagination: {} };

// Utility Functions
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

function getStatusBadge(quantity, minStock) {
  if (quantity <= 0) return '<span class="status-badge status-critical">Out of Stock</span>';
  if (quantity <= minStock) return '<span class="status-badge status-low">Low Stock</span>';
  return '<span class="status-badge status-ok">In Stock</span>';
}

// Navigation
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  
  // Show selected page
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
    currentPage = pageId;
  }
  
  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`[onclick="showPage('${pageId}')"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Load page-specific data
  switch (pageId) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'stock':
      loadStock();
      break;
    case 'history':
      loadHistory();
      break;
    case 'admin':
      loadAdminData();
      break;
    case 'profile':
      loadProfile();
      break;
  }
}

function updateNavigation() {
  const adminLinks = document.querySelectorAll('.admin-only');
  adminLinks.forEach(link => {
    if (isAdmin) {
      link.classList.add('show');
    } else {
      link.classList.remove('show');
    }
  });
}

// Authentication
function toggleAuth(type) {
  document.getElementById('login-form').classList.toggle('hidden', type !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', type !== 'register');
}

async function loginUser(event) {
  event.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      isAdmin = data.is_admin;
      loggedIn = true;
      
      // Update UI
      document.getElementById('auth-container').classList.add('hidden');
      document.getElementById('app-container').classList.remove('hidden');
      document.getElementById('user-name').textContent = currentUser.full_name || currentUser.username;
      
      updateNavigation();
      showPage('dashboard');
      showNotification('Login successful!', 'success');
    } else {
      messageEl.textContent = data.error || 'Login failed';
      messageEl.className = 'message error';
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Please try again.';
    messageEl.className = 'message error';
  }
}

async function registerUser(event) {
  event.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const fullName = document.getElementById('register-fullname').value;
  const password = document.getElementById('register-password').value;
  const messageEl = document.getElementById('register-message');
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, full_name: fullName, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageEl.textContent = 'Registration successful! Please login.';
      messageEl.className = 'message success';
      toggleAuth('login');
    } else {
      messageEl.textContent = data.error || 'Registration failed';
      messageEl.className = 'message error';
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Please try again.';
    messageEl.className = 'message error';
  }
}

function logout() {
  fetch('/api/logout', { method: 'POST' })
    .then(() => {
      currentUser = null;
  isAdmin = false;
  loggedIn = false;
      
      document.getElementById('auth-container').classList.remove('hidden');
      document.getElementById('app-container').classList.add('hidden');
      
      // Clear forms
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      document.getElementById('login-message').textContent = '';
      
      showNotification('Logged out successfully', 'info');
    })
    .catch(() => {
      showNotification('Logout error', 'error');
    });
}

// Dashboard
async function loadDashboard() {
  try {
    const [stockResponse, lowStockResponse, historyResponse] = await Promise.all([
      fetch('/api/stock?per_page=1000'),
      fetch('/api/notifications/low-stock'),
      fetch('/api/stock/history?per_page=5')
    ]);
    
    const stockData = await stockResponse.json();
    const lowStockData = await lowStockResponse.json();
    const historyData = await historyResponse.json();
    
    // Update stats
    document.getElementById('total-products').textContent = stockData.pagination.total;
    document.getElementById('low-stock-count').textContent = lowStockData.count;
    
    const totalValue = stockData.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
    
    // Update low stock alerts
    const lowStockList = document.getElementById('low-stock-list');
    if (lowStockData.low_stock_products.length === 0) {
      lowStockList.innerHTML = '<p>No low stock items</p>';
    } else {
      lowStockList.innerHTML = lowStockData.low_stock_products.map(product => `
        <div class="alert-item">
          <strong>${product.name}</strong> - ${product.quantity} remaining (min: ${product.min_stock_level})
        </div>
      `).join('');
    }
    
    // Update recent activity
    const recentActivity = document.getElementById('recent-activity');
    if (historyData.history.length === 0) {
      recentActivity.innerHTML = '<p>No recent activity</p>';
    } else {
      recentActivity.innerHTML = historyData.history.map(item => `
        <div class="activity-item">
          <strong>${item.product_name}</strong> - ${item.action} (${item.quantity_change > 0 ? '+' : ''}${item.quantity_change})
          <br><small>${formatDate(item.timestamp)} by ${item.user_name}</small>
        </div>
      `).join('');
    }
  } catch (error) {
    showNotification('Error loading dashboard', 'error');
  }
}

// Stock Management
async function loadStock(page = 1) {
  try {
    const search = document.getElementById('stock-search').value;
    const category = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    let url = `/api/stock?page=${page}&per_page=10&sort_by=${sortBy}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    stockData = data;
    renderStockTable();
    renderStockPagination();
    loadCategories();
  } catch (error) {
    showNotification('Error loading stock', 'error');
  }
}

function renderStockTable() {
  const tbody = document.getElementById('stock-table-body');
  if (stockData.products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No products found</td></tr>';
    return;
  }
  tbody.innerHTML = stockData.products.map(product => `
    <tr>
      <td><strong>${product.name}</strong></td>
      <td><code>${product.material_code}</code></td>
      <td>${product.quantity}</td>
      <td>${product.unit}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.category}</td>
      <td>${getStatusBadge(product.quantity, product.min_stock_level)}</td>
      <td>
        <div class="action-buttons">
          ${isAdmin ? `
            <button class="btn btn-sm btn-primary" onclick="showEditStockModal(${product.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="showRemoveStockModal(${product.id})">
              <i class="fas fa-minus"></i>
            </button>
          ` : `
            <button class="btn btn-sm btn-success" onclick="showIssueStockModal(${product.id})">
              <i class="fas fa-download"></i>
            </button>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderStockPagination() {
  const pagination = document.getElementById('stock-pagination');
  const { page, pages, has_next, has_prev } = stockData.pagination;
  
  if (pages <= 1) {
    pagination.innerHTML = '';
        return;
      }
  
  let buttons = '';
  
  if (has_prev) {
    buttons += `<button onclick="loadStock(${page - 1})">Previous</button>`;
  }
  
  for (let i = 1; i <= pages; i++) {
    if (i === page) {
      buttons += `<button class="active">${i}</button>`;
    } else {
      buttons += `<button onclick="loadStock(${i})">${i}</button>`;
    }
  }
  
  if (has_next) {
    buttons += `<button onclick="loadStock(${page + 1})">Next</button>`;
  }
  
  pagination.innerHTML = buttons;
}

async function loadCategories() {
  try {
    const response = await fetch('/api/stock/categories');
    const data = await response.json();
    
    const select = document.getElementById('category-filter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Categories</option>' +
      data.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    select.value = currentValue;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function filterStock() {
  loadStock(1);
}

// Stock Modals
function showAddStockModal() {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  title.textContent = 'Add Stock';
  body.innerHTML = `
    <form onsubmit="addStock(event)">
      <div class="form-group">
        <label for="modal-product-name">Product Name</label>
        <input type="text" id="modal-product-name" required>
      </div>
      <div class="form-group">
        <label for="modal-material-code">Material Code</label>
        <input type="text" id="modal-material-code" required>
      </div>
      <div class="form-group">
        <label for="modal-quantity">Quantity</label>
        <input type="number" id="modal-quantity" min="1" required>
      </div>
      <div class="form-group">
        <label for="modal-unit">Unit</label>
        <input type="text" id="modal-unit" value="units" required>
      </div>
      <div class="form-group">
        <label for="modal-price">Price</label>
        <input type="number" id="modal-price" min="0" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="modal-category">Category</label>
        <input type="text" id="modal-category" value="General">
      </div>
      <div class="form-group">
        <label for="modal-description">Description</label>
        <textarea id="modal-description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label for="modal-min-stock">Minimum Stock Level</label>
        <input type="number" id="modal-min-stock" min="0" value="5">
      </div>
      <div class="form-group">
        <label for="modal-notes">Notes</label>
        <textarea id="modal-notes" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Stock</button>
      </div>
    </form>
  `;
  modal.classList.remove('hidden');
}

async function addStock(event) {
  event.preventDefault();
  const data = {
    product_name: document.getElementById('modal-product-name').value,
    material_code: document.getElementById('modal-material-code').value,
    quantity: parseInt(document.getElementById('modal-quantity').value),
    unit: document.getElementById('modal-unit').value,
    price: parseFloat(document.getElementById('modal-price').value),
    category: document.getElementById('modal-category').value,
    description: document.getElementById('modal-description').value,
    min_stock_level: parseInt(document.getElementById('modal-min-stock').value),
    notes: document.getElementById('modal-notes').value
  };
  try {
    const response = await fetch('/api/stock/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      closeModal();
      loadStock();
      showNotification('Stock added successfully', 'success');
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to add stock', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

function showEditStockModal(productId) {
  const product = stockData.products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = 'Edit Stock';
  body.innerHTML = `
    <form onsubmit="editStock(event, ${productId})">
      <div class="form-group">
        <label for="modal-product-name">Product Name</label>
        <input type="text" id="modal-product-name" value="${product.name}" required>
      </div>
      <div class="form-group">
        <label for="modal-material-code">Material Code</label>
        <input type="text" id="modal-material-code" value="${product.material_code}" required>
      </div>
      <div class="form-group">
        <label for="modal-quantity">Quantity</label>
        <input type="number" id="modal-quantity" min="0" value="${product.quantity}" required>
      </div>
      <div class="form-group">
        <label for="modal-unit">Unit</label>
        <input type="text" id="modal-unit" value="${product.unit}" required>
      </div>
      <div class="form-group">
        <label for="modal-price">Price</label>
        <input type="number" id="modal-price" min="0" step="0.01" value="${product.price}" required>
      </div>
      <div class="form-group">
        <label for="modal-category">Category</label>
        <input type="text" id="modal-category" value="${product.category}">
      </div>
      <div class="form-group">
        <label for="modal-description">Description</label>
        <textarea id="modal-description" rows="3">${product.description}</textarea>
      </div>
      <div class="form-group">
        <label for="modal-min-stock">Minimum Stock Level</label>
        <input type="number" id="modal-min-stock" min="0" value="${product.min_stock_level}">
      </div>
      <div class="form-group">
        <label for="modal-notes">Notes</label>
        <textarea id="modal-notes" rows="3">${product.notes}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Stock</button>
      </div>
    </form>
  `;
  
  modal.classList.remove('hidden');
}

async function editStock(event, productId) {
  event.preventDefault();
  
  const data = {
    product_name: document.getElementById('modal-product-name').value,
    material_code: document.getElementById('modal-material-code').value,
    quantity: parseInt(document.getElementById('modal-quantity').value),
    unit: document.getElementById('modal-unit').value,
    price: parseFloat(document.getElementById('modal-price').value),
    category: document.getElementById('modal-category').value,
    description: document.getElementById('modal-description').value,
    min_stock_level: parseInt(document.getElementById('modal-min-stock').value),
    notes: document.getElementById('modal-notes').value
  };
  
  try {
    const response = await fetch('/api/stock/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      closeModal();
      loadStock();
      showNotification('Stock updated successfully', 'success');
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to update stock', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

function showRemoveStockModal(productId) {
  const product = stockData.products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = 'Remove Stock';
  body.innerHTML = `
    <p>Are you sure you want to remove stock from <strong>${product.name}</strong>?</p>
    <form onsubmit="removeStock(event, ${productId})">
      <div class="form-group">
        <label for="modal-quantity">Quantity to Remove</label>
        <input type="number" id="modal-quantity" min="1" max="${product.quantity}" value="1" required>
      </div>
      <div class="form-group">
        <label for="modal-notes">Notes</label>
        <textarea id="modal-notes" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Remove Stock</button>
      </div>
    </form>
  `;
  
  modal.classList.remove('hidden');
}

async function removeStock(event, productId) {
  event.preventDefault();
  
  const product = stockData.products.find(p => p.id === productId);
  const data = {
    product_name: product.name,
    quantity: parseInt(document.getElementById('modal-quantity').value),
    notes: document.getElementById('modal-notes').value
  };
  
  try {
    const response = await fetch('/api/stock/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      closeModal();
      loadStock();
      showNotification('Stock removed successfully', 'success');
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to remove stock', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

function showIssueStockModal(productId) {
  const product = stockData.products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = 'Issue Stock';
  body.innerHTML = `
    <p>Issue stock from <strong>${product.name}</strong> (${product.material_code}) - Available: ${product.quantity} ${product.unit}</p>
    <form onsubmit="issueStock(event, ${productId})">
      <div class="form-group">
        <label for="modal-quantity">Quantity to Issue</label>
        <input type="number" id="modal-quantity" min="1" max="${product.quantity}" value="1" required>
      </div>
      <div class="form-group">
        <label for="modal-person">Issue To (Optional)</label>
        <select id="modal-person"><option value="">Select Person</option></select>
      </div>
      <div class="form-group">
        <label for="modal-issue-reason">Issue Reason</label>
        <input type="text" id="modal-issue-reason" placeholder="e.g., Office supplies, Project work">
      </div>
      <div class="form-group">
        <label for="modal-notes">Notes</label>
        <textarea id="modal-notes" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-success">Issue Stock</button>
      </div>
    </form>
  `;
  loadPersonsForDropdown();
  modal.classList.remove('hidden');
}

async function loadPersonsForDropdown() {
  try {
    const response = await fetch('/api/persons?per_page=1000');
    const data = await response.json();
    const select = document.getElementById('modal-person');
    select.innerHTML = '<option value="">Select Person</option>' +
      data.persons.map(person => `<option value="${person.id}">${person.name} (${person.employee_code}) - ${person.department}</option>`).join('');
  } catch (error) {
    console.error('Error loading persons for dropdown:', error);
  }
}

async function issueStock(event, productId) {
  event.preventDefault();
  const product = stockData.products.find(p => p.id === productId);
  const data = {
    product_name: product.name,
    quantity: parseInt(document.getElementById('modal-quantity').value),
    person_id: document.getElementById('modal-person').value || null,
    issue_reason: document.getElementById('modal-issue-reason').value,
    notes: document.getElementById('modal-notes').value
  };
  try {
    const response = await fetch('/api/stock/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      closeModal();
      loadStock();
      showNotification('Stock issued successfully', 'success');
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to issue stock', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// Export
function exportStock() {
  window.open('/api/stock/export', '_blank');
}

// History
async function loadHistory(page = 1) {
  try {
    const actionFilter = document.getElementById('history-action-filter').value;
    const productFilter = document.getElementById('history-product-filter').value;
    
    let url = `/api/stock/history?page=${page}&per_page=20`;
    if (actionFilter) url += `&action=${actionFilter}`;
    if (productFilter) url += `&product_id=${productFilter}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    historyData = data;
    renderHistoryTable();
    renderHistoryPagination();
    loadHistoryProducts();
  } catch (error) {
    showNotification('Error loading history', 'error');
  }
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  
  if (historyData.history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align: center;">No history found</td></tr>';
    return;
  }
  
  tbody.innerHTML = historyData.history.map(item => `
    <tr>
      <td>${formatDate(item.timestamp)}</td>
      <td><strong>${item.product_name}</strong></td>
      <td><code>${item.material_code}</code></td>
      <td><span class="status-badge status-${item.action}">${item.action}</span></td>
      <td>${item.quantity_change > 0 ? '+' : ''}${item.quantity_change}</td>
      <td>${item.previous_quantity}</td>
      <td>${item.new_quantity}</td>
      <td>${item.user_name}</td>
      <td>${item.person_name || '-'}</td>
      <td>${item.person_department || '-'}</td>
      <td>${item.person_branch || '-'}</td>
      <td>${item.issue_reason || '-'}</td>
      <td>${item.notes || '-'}</td>
    </tr>
  `).join('');
}

function renderHistoryPagination() {
  const pagination = document.getElementById('history-pagination');
  const { page, pages, has_next, has_prev } = historyData.pagination;
  
  if (pages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let buttons = '';
  
  if (has_prev) {
    buttons += `<button onclick="loadHistory(${page - 1})">Previous</button>`;
  }
  
  for (let i = 1; i <= pages; i++) {
    if (i === page) {
      buttons += `<button class="active">${i}</button>`;
    } else {
      buttons += `<button onclick="loadHistory(${i})">${i}</button>`;
    }
  }
  
  if (has_next) {
    buttons += `<button onclick="loadHistory(${page + 1})">Next</button>`;
  }
  
  pagination.innerHTML = buttons;
}

async function loadHistoryProducts() {
  try {
    const response = await fetch('/api/stock?per_page=1000');
    const data = await response.json();
    
    const select = document.getElementById('history-product-filter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Products</option>' +
      data.products.map(product => `<option value="${product.id}">${product.name}</option>`).join('');
    
    select.value = currentValue;
  } catch (error) {
    console.error('Error loading products for history filter:', error);
  }
}

// Admin Panel
async function loadAdminData() {
  try {
    const [usersResponse, stockResponse, lowStockResponse] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/stock?per_page=1000'),
      fetch('/api/notifications/low-stock')
    ]);
    
    const usersData = await usersResponse.json();
    const stockData = await stockResponse.json();
    const lowStockData = await lowStockResponse.json();
    
    // Render users table
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = usersData.users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${user.email || '-'}</td>
        <td>${user.full_name || '-'}</td>
        <td><span class="status-badge ${user.is_admin ? 'status-critical' : 'status-ok'}">${user.is_admin ? 'Admin' : 'User'}</span></td>
        <td>${formatDate(user.created_at)}</td>
        <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
      </tr>
    `).join('');
    
    // Update stats
    document.getElementById('total-users').textContent = usersData.users.length;
    document.getElementById('admin-total-products').textContent = stockData.pagination.total;
    document.getElementById('admin-low-stock').textContent = lowStockData.count;
  } catch (error) {
    showNotification('Error loading admin data', 'error');
  }
}

// Profile
async function loadProfile() {
  try {
    const response = await fetch('/api/profile');
    const user = await response.json();
    
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-fullname').value = user.full_name || '';
    document.getElementById('profile-password').value = '';
    
    document.getElementById('profile-role').textContent = user.is_admin ? 'Administrator' : 'Regular User';
    document.getElementById('profile-created').textContent = formatDate(user.created_at);
    document.getElementById('profile-last-login').textContent = user.last_login ? formatDate(user.last_login) : 'Never';
  } catch (error) {
    showNotification('Error loading profile', 'error');
  }
}

async function updateProfile(event) {
  event.preventDefault();
  
  const data = {
    email: document.getElementById('profile-email').value,
    full_name: document.getElementById('profile-fullname').value,
    password: document.getElementById('profile-password').value
  };
  
  // Remove empty password
  if (!data.password) delete data.password;
  
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showNotification('Profile updated successfully', 'success');
      document.getElementById('profile-password').value = '';
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

// --- Person Management ---
async function loadPersons(page = 1) {
  try {
    const search = document.getElementById('person-search')?.value || '';
    const department = document.getElementById('department-filter')?.value || '';
    const branch = document.getElementById('branch-filter')?.value || '';
    let url = `/api/persons?page=${page}&per_page=10`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (branch) url += `&branch=${encodeURIComponent(branch)}`;
    const response = await fetch(url);
    const data = await response.json();
    personData = data;
    renderPersonTable();
    renderPersonPagination();
    loadDepartments();
    loadBranches();
  } catch (error) {
    showNotification('Error loading persons', 'error');
  }
}

function renderPersonTable() {
  const tbody = document.getElementById('person-table-body');
  if (!personData.persons || personData.persons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No persons found</td></tr>';
    return;
  }
  tbody.innerHTML = personData.persons.map(person => `
    <tr>
      <td>${person.employee_code}</td>
      <td>${person.name}</td>
      <td>${person.department}</td>
      <td>${person.branch}</td>
      <td>${person.designation || ''}</td>
      <td>${person.contact_number || ''}</td>
      <td>${person.email || ''}</td>
      <td>${person.is_active ? 'Active' : 'Inactive'}</td>
      <td class="admin-only">${isAdmin ? `<button class='btn btn-sm btn-primary' onclick='showEditPersonModal(${person.id})'><i class='fas fa-edit'></i></button>` : ''}</td>
    </tr>
  `).join('');
}

function renderPersonPagination() {
  const pagination = document.getElementById('person-pagination');
  const { page, pages, has_next, has_prev } = personData.pagination;
  if (pages <= 1) { pagination.innerHTML = ''; return; }
  let buttons = '';
  if (has_prev) buttons += `<button onclick="loadPersons(${page - 1})">Previous</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === page) buttons += `<button class="active">${i}</button>`;
    else buttons += `<button onclick="loadPersons(${i})">${i}</button>`;
  }
  if (has_next) buttons += `<button onclick="loadPersons(${page + 1})">Next</button>`;
  pagination.innerHTML = buttons;
}

function filterPersons() { loadPersons(1); }

async function loadDepartments() {
  try {
    const response = await fetch('/api/persons/departments');
    const data = await response.json();
    const select = document.getElementById('department-filter');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Departments</option>' + data.departments.map(d => `<option value="${d}">${d}</option>`).join('');
    select.value = currentValue;
  } catch {}
}
async function loadBranches() {
  try {
    const response = await fetch('/api/persons/branches');
    const data = await response.json();
    const select = document.getElementById('branch-filter');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Branches</option>' + data.branches.map(b => `<option value="${b}">${b}</option>`).join('');
    select.value = currentValue;
  } catch {}
}

function showAddPersonModal() {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  title.textContent = 'Add Person';
  body.innerHTML = `
    <form onsubmit="addPerson(event)">
      <div class="form-group"><label>Employee Code</label><input type="text" id="person-empcode" required></div>
      <div class="form-group"><label>Name</label><input type="text" id="person-name" required></div>
      <div class="form-group"><label>Department</label><input type="text" id="person-dept" required></div>
      <div class="form-group"><label>Branch</label><input type="text" id="person-branch" required></div>
      <div class="form-group"><label>Designation</label><input type="text" id="person-desig"></div>
      <div class="form-group"><label>Contact Number</label><input type="text" id="person-contact"></div>
      <div class="form-group"><label>Email</label><input type="email" id="person-email"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Person</button>
      </div>
    </form>
  `;
  modal.classList.remove('hidden');
}

async function addPerson(event) {
  event.preventDefault();
  const data = {
    employee_code: document.getElementById('person-empcode').value,
    name: document.getElementById('person-name').value,
    department: document.getElementById('person-dept').value,
    branch: document.getElementById('person-branch').value,
    designation: document.getElementById('person-desig').value,
    contact_number: document.getElementById('person-contact').value,
    email: document.getElementById('person-email').value
  };
  try {
    const response = await fetch('/api/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      closeModal();
      loadPersons();
      showNotification('Person added successfully', 'success');
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to add person', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  fetch('/api/profile')
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Not logged in');
    })
    .then(user => {
      currentUser = user;
      isAdmin = user.is_admin;
      loggedIn = true;
      
      document.getElementById('auth-container').classList.add('hidden');
      document.getElementById('app-container').classList.remove('hidden');
      document.getElementById('user-name').textContent = user.full_name || user.username;
      
      updateNavigation();
      showPage('dashboard');
    })
    .catch(() => {
      // User not logged in, show auth container
      document.getElementById('auth-container').classList.remove('hidden');
      document.getElementById('app-container').classList.add('hidden');
    });
});
