# Advanced Inventory Management System (SM) 📦

A fully-featured Inventory and Stock Management application built with a Python Flask backend and a Vanilla HTML/CSS/JS frontend. It handles robust user authentication, role-based access control (Admin vs. Regular Users), stock tracking, personnel management, and low-stock alerting.

## 🚀 Key Features
- **Dashboard Analytics:** Live overview of total products, low stock alerts, registered persons, and total inventory value.
- **Role-Based Authentication:** Secure login system featuring 'Admin' and 'Regular User' roles to restrict sensitive actions (like adding/editing stock or personnel).
- **Comprehensive Stock Management:** Receive, issue, edit, and remove stock items with detailed material codes, categories, units, and minimum stock levels.
- **Stock History Tracking:** Complete audit log documenting every stock change (receive, issue, sale, edit) along with timestamps, user actions, and notes.
- **Personnel Management:** Track employee details (Employee Code, Department, Branch, Designation, Contact Info) and associate them with stock issuance.
- **CSV Data Export:** One-click functionality to export raw stock and personnel data securely to `.csv` format.
- **Dynamic Frontend UI:** Single-page application (SPA) feel achieved through Vanilla JavaScript and DOM manipulation, eliminating page reloads.

## 💻 Tech Stack
- **Backend:** Python, Flask, SQLAlchemy (ORM), Flask-CORS
- **Frontend:** HTML5, CSS3, Vanilla Web Components (JavaScript), FontAwesome (Icons)
- **Database:** SQLite (`datas/database.db`)

## 🛣️ API Endpoints (Core)
- `POST /api/register` / `POST /api/login` - Authentication routes.
- `GET /api/stock` / `POST /api/stock/receive` / `POST /api/stock/issue` - Inventory CRUD operations.
- `GET /api/persons` / `POST /api/persons` - Employee cataloging.
- `GET /api/stock/history` - Auditing and transaction logs.

## 🛠️ Installation & Setup

1. **Prerequisites**
   Ensure Python 3.x is installed on your environment.

2. **Package Installation**
   Create a virtual environment (optional but recommended) and install dependencies.
   ```bash
   pip install -r .vscode/backend/requirements.txt
   ```

3. **Database Initialization**
   The application intercepts the first request and creates the SQLite database schemas and default users automatically (`Admin` / `1234` and `user` / `user123`).

4. **Running the Server**
   Navigate to the project directory and invoke the backend server script:
   ```bash
   python .vscode/backend/server.py
   ```
   *The Flask server runs on port 5000 and serves the frontend statically on `/`.*

5. **Access the Application**
   Open your browser and navigate to `http://localhost:5000` (or `http://192.168.72.144:5000` if configured on your local network).