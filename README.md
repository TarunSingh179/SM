# Advanced Inventory Management System

A modern, feature-rich inventory management system built with Flask and vanilla JavaScript.

## 🚀 Features

### 🔐 Authentication & User Management
- **User Registration**: New users can create accounts with email and full name
- **Secure Login**: Password hashing with Werkzeug
- **User Profiles**: View and edit profile information
- **Role-based Access**: Admin and regular user roles
- **Session Management**: Secure session handling

### 📊 Dashboard
- **Real-time Statistics**: Total products, low stock count, total value
- **Low Stock Alerts**: Automatic notifications for items below minimum stock
- **Recent Activity**: Latest stock movements and changes
- **Visual Indicators**: Status badges and icons

### 📦 Stock Management
- **Product Categories**: Organize products by category
- **Advanced Search**: Search products by name
- **Filtering**: Filter by category
- **Sorting**: Sort by name, quantity, or category
- **Pagination**: Handle large datasets efficiently
- **Stock History**: Track all stock changes with timestamps
- **Notes**: Add notes to stock operations

### 🔄 Stock Operations
- **Receive Stock**: Add new products or increase existing stock
- **Issue Stock**: Regular users can issue stock for use
- **Record Sales**: Admin can record sales transactions
- **Edit Stock**: Modify product details and quantities
- **Stock History**: Complete audit trail of all operations

### 📈 Advanced Features
- **CSV Export**: Download stock data as CSV files
- **Low Stock Notifications**: Automatic alerts for items below threshold
- **User Management**: Admin can view all users and their details
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface with animations

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SM
   ```

2. **Install Python dependencies**
   ```bash
   cd .vscode/backend
   pip install -r requirements.txt
   ```

3. **Run the server**
   ```bash
   python server.py
   ```

4. **Access the application**
   Open your browser and go to `http://192.168.26.144:5000`

   **Default Admin Login:**  
   Username: `Admin`  
   Password: `1234`

## 👥 Default Users

The system comes with two default users:

### Admin User
- **Username**: `Tarun`
- **Password**: `1234`
- **Email**: `tarun@admin.com`
- **Role**: Administrator

### Regular User
- **Username**: `user`
- **Password**: `user123`
- **Email**: `user@example.com`
- **Role**: Regular User

## 📋 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Stock Management
- `GET /api/stock` - Get stock with pagination, search, and filters
- `POST /api/stock/receive` - Add/receive stock (Admin only)
- `POST /api/stock/sale` - Record sale (Admin only)
- `PUT /api/stock/edit` - Edit stock (Admin only)
- `POST /api/stock/issue` - Issue stock (All users)
- `GET /api/stock/categories` - Get all categories
- `GET /api/stock/export` - Export stock as CSV

### Stock History
- `GET /api/stock/history` - Get stock history with filters

### Notifications
- `GET /api/notifications/low-stock` - Get low stock alerts

### Admin Only
- `GET /api/users` - Get all users (Admin only)

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds**: Beautiful color schemes
- **Card-based Layout**: Clean, organized interface
- **Responsive Grid**: Adapts to different screen sizes
- **Smooth Animations**: Hover effects and transitions
- **Font Awesome Icons**: Professional iconography

### Interactive Elements
- **Modal Dialogs**: Clean forms for data entry
- **Real-time Notifications**: Toast-style notifications
- **Status Badges**: Color-coded stock status indicators
- **Pagination Controls**: Easy navigation through data
- **Search and Filters**: Quick data access

## 🔧 Technical Details

### Backend (Flask)
- **Framework**: Flask 2.3.2
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: Session-based with password hashing
- **CORS**: Cross-origin resource sharing enabled
- **File Export**: CSV generation for data export

### Frontend (Vanilla JavaScript)
- **No Framework**: Pure JavaScript for performance
- **Modern ES6+**: Async/await, arrow functions, etc.
- **Responsive Design**: CSS Grid and Flexbox
- **Progressive Enhancement**: Works without JavaScript

### Database Schema
- **Users**: username, email, password_hash, full_name, is_admin, timestamps
- **Products**: name, quantity, price, category, min_stock_level, timestamps
- **Stock History**: product_id, user_id, action, quantity_change, timestamps

## 🚀 Getting Started

1. **Start the server** (as shown in installation)
2. **Register a new account** or use the default users
3. **Add some products** using the "Add Stock" button
4. **Explore the dashboard** to see statistics
5. **Try different operations** like issuing stock or viewing history

## 📱 Mobile Support

The application is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security Features

- **Password Hashing**: Secure password storage
- **Session Management**: Secure user sessions
- **Input Validation**: Server-side validation
- **CSRF Protection**: Built-in Flask protection
- **Role-based Access**: Admin-only endpoints

## 🎯 Use Cases

This system is perfect for:
- Small to medium businesses
- Warehouses and storage facilities
- Retail stores
- Manufacturing companies
- Any organization needing inventory tracking

## 🤝 Contributing

Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy managing your inventory with style! 🎉** 