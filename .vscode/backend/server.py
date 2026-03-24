from flask import Flask, request, jsonify, send_from_directory, session, send_file
from flask_cors import CORS
from models import db, Product, User, StockHistory, Person
import os
import csv
import io
from datetime import datetime
from functools import wraps
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '../../frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='/')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/tarun/SM/datas/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'super-secret-key'

CORS(app)
db.init_app(app)

@app.before_request
def create_tables():
    if not app.config.get('db_initialized'):
        db.create_all()
        # Create default admin user if not exists
        if not User.query.filter_by(username='Admin').first():
            admin = User()
            admin.username = 'Admin'
            admin.email = 'Administrator@admin.com'
            admin.full_name = 'Administrator'
            admin.is_admin = True
            db.session.add(admin)
            admin.set_password('1234')
        # Create default regular user if not exists
        if not User.query.filter_by(username='user').first():
            regular = User()
            regular.username = 'user'
            regular.email = 'user@example.com'
            regular.full_name = 'Regular User'
            regular.is_admin = False
            db.session.add(regular)
            regular.set_password('user123')
        # Create sample persons if not exists
        if not Person.query.filter_by(employee_code='EMP001').first():
            person1 = Person()
            person1.employee_code = 'EMP001'
            person1.name = 'John Doe'
            person1.department = 'IT'
            person1.branch = 'Main Office'
            person1.designation = 'Software Engineer'
            person1.contact_number = '+1234567890'
            person1.email = 'john.doe@company.com'
            db.session.add(person1)
        if not Person.query.filter_by(employee_code='EMP002').first():
            person2 = Person()
            person2.employee_code = 'EMP002'
            person2.name = 'Jane Smith'
            person2.department = 'HR'
            person2.branch = 'Branch A'
            person2.designation = 'HR Manager'
            person2.contact_number = '+1234567891'
            person2.email = 'jane.smith@company.com'
            db.session.add(person2)
        db.session.commit()
        app.config['db_initialized'] = True

@app.route('/')
def serve_home():
    return send_from_directory(str(app.static_folder), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(str(app.static_folder), path)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def record_stock_history(product_id, user_id, action, quantity_change, previous_quantity, new_quantity, notes=None, person_id=None, issue_reason=None):
    """Helper function to record stock history"""
    history = StockHistory()
    history.product_id = product_id
    history.user_id = user_id
    history.action = action
    history.quantity_change = quantity_change
    history.previous_quantity = previous_quantity
    history.new_quantity = new_quantity
    history.notes = notes
    history.person_id = person_id
    history.issue_reason = issue_reason
    db.session.add(history)

# 🔐 Authentication Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    full_name = data.get('full_name')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User()
    user.username = username
    user.email = email
    user.full_name = full_name
    user.is_admin = False
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        user.last_login = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'message': 'Login successful', 
            'is_admin': user.is_admin,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_admin': user.is_admin
            }
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    user = User.query.get(session['user_id'])
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'is_admin': user.is_admin,
        'created_at': user.created_at.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None
    })

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    user = User.query.get(session['user_id'])
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'})

# 👥 Person Management Endpoints
@app.route('/api/persons', methods=['GET'])
@login_required
def get_persons():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')
    department = request.args.get('department', '')
    branch = request.args.get('branch', '')
    
    query = Person.query.filter(Person.is_active == True)
    
    if search:
        query = query.filter(
            (Person.name.contains(search)) |
            (Person.employee_code.contains(search)) |
            (Person.email.contains(search))
        )
    
    if department:
        query = query.filter(Person.department == department)
    
    if branch:
        query = query.filter(Person.branch == branch)
    
    query = query.order_by(Person.name.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    persons = pagination.items
    
    return jsonify({
        'persons': [{
            'id': p.id,
            'employee_code': p.employee_code,
            'name': p.name,
            'department': p.department,
            'branch': p.branch,
            'designation': p.designation,
            'contact_number': p.contact_number,
            'email': p.email,
            'is_active': p.is_active,
            'created_at': p.created_at.isoformat()
        } for p in persons],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@app.route('/api/persons', methods=['POST'])
@admin_required
def add_person():
    data = request.get_json()
    
    if Person.query.filter_by(employee_code=data.get('employee_code')).first():
        return jsonify({'error': 'Employee code already exists'}), 400
    
    person = Person()
    person.employee_code = data.get('employee_code')
    person.name = data.get('name')
    person.department = data.get('department')
    person.branch = data.get('branch')
    person.designation = data.get('designation')
    person.contact_number = data.get('contact_number')
    person.email = data.get('email')
    
    db.session.add(person)
    db.session.commit()
    
    return jsonify({'message': 'Person added successfully', 'id': person.id}), 201

@app.route('/api/persons/<int:person_id>', methods=['PUT'])
@admin_required
def update_person(person_id):
    person = Person.query.get_or_404(person_id)
    data = request.get_json()
    
    if 'employee_code' in data and data['employee_code'] != person.employee_code:
        if Person.query.filter_by(employee_code=data['employee_code']).first():
            return jsonify({'error': 'Employee code already exists'}), 400
        person.employee_code = data['employee_code']
    
    if 'name' in data:
        person.name = data['name']
    if 'department' in data:
        person.department = data['department']
    if 'branch' in data:
        person.branch = data['branch']
    if 'designation' in data:
        person.designation = data['designation']
    if 'contact_number' in data:
        person.contact_number = data['contact_number']
    if 'email' in data:
        person.email = data['email']
    if 'is_active' in data:
        person.is_active = data['is_active']
    
    person.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Person updated successfully'})

@app.route('/api/persons/departments', methods=['GET'])
@login_required
def get_departments():
    departments = db.session.query(Person.department).distinct().filter(Person.is_active == True).all()
    return jsonify({'departments': [dept[0] for dept in departments]})

@app.route('/api/persons/branches', methods=['GET'])
@login_required
def get_branches():
    branches = db.session.query(Person.branch).distinct().filter(Person.is_active == True).all()
    return jsonify({'branches': [branch[0] for branch in branches]})

# 📦 Stock Management Endpoints
@app.route('/api/stock', methods=['GET'])
@login_required
def get_stock():
    # Get query parameters for search and filter
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    material_code = request.args.get('material_code', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'asc')
    
    query = Product.query
    
    # Apply search filter
    if search:
        query = query.filter(
            (Product.name.contains(search)) |
            (Product.material_code.contains(search)) |
            (Product.description.contains(search))
        )
    
    # Apply category filter
    if category:
        query = query.filter(Product.category == category)
    
    # Apply material code filter
    if material_code:
        query = query.filter(Product.material_code.contains(material_code))
    
    # Apply sorting
    if sort_by == 'name':
        query = query.order_by(Product.name.asc() if sort_order == 'asc' else Product.name.desc())
    elif sort_by == 'material_code':
        query = query.order_by(Product.material_code.asc() if sort_order == 'asc' else Product.material_code.desc())
    elif sort_by == 'quantity':
        query = query.order_by(Product.quantity.asc() if sort_order == 'asc' else Product.quantity.desc())
    elif sort_by == 'category':
        query = query.order_by(Product.category.asc() if sort_order == 'asc' else Product.category.desc())
    
    # Apply pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    products = pagination.items
    
    return jsonify({
        'products': [{
            'id': p.id,
            'name': p.name,
            'material_code': p.material_code,
            'quantity': p.quantity,
            'price': p.price,
            'category': p.category,
            'description': p.description,
            'unit': p.unit,
            'min_stock_level': p.min_stock_level,
            'created_at': p.created_at.isoformat(),
            'updated_at': p.updated_at.isoformat()
        } for p in products],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@app.route('/api/stock/categories', methods=['GET'])
@login_required
def get_categories():
    categories = db.session.query(Product.category).distinct().all()
    return jsonify({'categories': [cat[0] for cat in categories]})

@app.route('/api/stock/receive', methods=['POST'])
@admin_required
def receive_stock():
    data = request.get_json()
    name = data.get('product_name')
    material_code = data.get('material_code')
    qty = int(data.get('quantity', 0))
    category = data.get('category', 'General')
    price = float(data.get('price', 0.0))
    min_stock = int(data.get('min_stock_level', 5))
    description = data.get('description', '')
    unit = data.get('unit', 'units')
    notes = data.get('notes', '')

    if not name or not material_code or qty <= 0:
        return jsonify({'error': 'Product name, material code, and quantity are required'}), 400

    # Check if material code already exists
    existing_product = Product.query.filter_by(material_code=material_code).first()
    if existing_product and existing_product.name != name:
        return jsonify({'error': 'Material code already exists for another product'}), 400

    product = Product.query.filter_by(name=name).first()
    if product:
        previous_qty = product.quantity
        product.quantity += qty
        product.material_code = material_code
        product.category = category
        product.price = price
        product.min_stock_level = min_stock
        product.description = description
        product.unit = unit
        product.updated_at = datetime.utcnow()
    else:
        product = Product()
        product.name = name
        product.material_code = material_code
        product.quantity = qty
        product.category = category
        product.price = price
        product.min_stock_level = min_stock
        product.description = description
        product.unit = unit
        db.session.add(product)
        previous_qty = 0

    db.session.flush()  # Get the product ID
    
    # Record history
    record_stock_history(
        product_id=product.id,
        user_id=session['user_id'],
        action='receive',
        quantity_change=qty,
        previous_quantity=previous_qty,
        new_quantity=product.quantity,
        notes=notes
    )

    db.session.commit()
    return jsonify({'message': 'Stock updated'})

@app.route('/api/stock/sale', methods=['POST'])
@admin_required
def record_sale():
    data = request.get_json()
    name = data.get('product_name')
    qty = int(data.get('quantity', 0))
    notes = data.get('notes', '')

    product = Product.query.filter_by(name=name).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    if product.quantity < qty:
        return jsonify({'error': 'Insufficient stock'}), 400

    previous_qty = product.quantity
    product.quantity -= qty
    product.updated_at = datetime.utcnow()
    
    # Record history
    record_stock_history(
        product_id=product.id,
        user_id=session['user_id'],
        action='sale',
        quantity_change=-qty,
        previous_quantity=previous_qty,
        new_quantity=product.quantity,
        notes=notes
    )

    db.session.commit()
    return jsonify({'message': 'Stock reduced'})

@app.route('/api/stock/edit', methods=['PUT'])
@admin_required
def edit_stock():
    data = request.get_json()
    name = data.get('product_name')
    material_code = data.get('material_code')
    qty = int(data.get('quantity', 0))
    category = data.get('category')
    price = data.get('price')
    min_stock = data.get('min_stock_level')
    description = data.get('description')
    unit = data.get('unit')
    notes = data.get('notes', '')

    product = Product.query.filter_by(name=name).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    # Check if material code already exists for another product
    if material_code and material_code != product.material_code:
        existing_product = Product.query.filter_by(material_code=material_code).first()
        if existing_product:
            return jsonify({'error': 'Material code already exists for another product'}), 400

    previous_qty = product.quantity
    product.quantity = qty
    if material_code:
        product.material_code = material_code
    if category:
        product.category = category
    if price is not None:
        product.price = price
    if min_stock is not None:
        product.min_stock_level = min_stock
    if description is not None:
        product.description = description
    if unit is not None:
        product.unit = unit
    product.updated_at = datetime.utcnow()
    
    # Record history
    record_stock_history(
        product_id=product.id,
        user_id=session['user_id'],
        action='edit',
        quantity_change=qty - previous_qty,
        previous_quantity=previous_qty,
        new_quantity=qty,
        notes=notes
    )

    db.session.commit()
    return jsonify({'message': 'Stock edited'})

@app.route('/api/stock/issue', methods=['POST'])
@login_required
def issue_stock():
    data = request.get_json()
    name = data.get('product_name')
    qty = int(data.get('quantity', 0))
    person_id = data.get('person_id')
    issue_reason = data.get('issue_reason', '')
    notes = data.get('notes', '')
    
    product = Product.query.filter_by(name=name).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    if product.quantity < qty:
        return jsonify({'error': 'Insufficient stock'}), 400

    # Verify person exists if provided
    person = None
    if person_id:
        person = Person.query.get(person_id)
        if not person:
            return jsonify({'error': 'Person not found'}), 404

    previous_qty = product.quantity
    product.quantity -= qty
    product.updated_at = datetime.utcnow()
    
    # Record history
    record_stock_history(
        product_id=product.id,
        user_id=session['user_id'],
        action='issue',
        quantity_change=-qty,
        previous_quantity=previous_qty,
        new_quantity=product.quantity,
        notes=notes,
        person_id=person.id if person else None,
        issue_reason=issue_reason
    )

    db.session.commit()
    
    person_name = person.name if person else 'Unknown'
    return jsonify({'message': f'{qty} units of {name} issued to {person_name}.'})

# 📊 Stock History Endpoints
@app.route('/api/stock/history', methods=['GET'])
@login_required
def get_stock_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    product_id = request.args.get('product_id')
    action = request.args.get('action')
    person_id = request.args.get('person_id')
    
    query = StockHistory.query
    
    if product_id:
        query = query.filter(StockHistory.product_id == product_id)
    if action:
        query = query.filter(StockHistory.action == action)
    if person_id:
        query = query.filter(StockHistory.person_id == person_id)
    
    query = query.order_by(StockHistory.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    history = pagination.items
    
    return jsonify({
        'history': [{
            'id': h.id,
            'product_name': h.product.name,
            'material_code': h.product.material_code,
            'user_name': h.user.username,
            'person_name': h.person.name if h.person else None,
            'person_employee_code': h.person.employee_code if h.person else None,
            'person_department': h.person.department if h.person else None,
            'person_branch': h.person.branch if h.person else None,
            'action': h.action,
            'quantity_change': h.quantity_change,
            'previous_quantity': h.previous_quantity,
            'new_quantity': h.new_quantity,
            'notes': h.notes,
            'issue_reason': h.issue_reason,
            'timestamp': h.timestamp.isoformat()
        } for h in history],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

# 📥 Export Endpoints
@app.route('/api/stock/export', methods=['GET'])
@login_required
def export_stock():
    products = Product.query.all()
    
    # Create CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow(['ID', 'Name', 'Material Code', 'Quantity', 'Price', 'Category', 'Description', 'Unit', 'Min Stock Level', 'Created At', 'Updated At'])
    
    # Write data
    for product in products:
        cw.writerow([
            product.id,
            product.name,
            product.material_code,
            product.quantity,
            product.price,
            product.category,
            product.description or '',
            product.unit,
            product.min_stock_level,
            product.created_at.isoformat(),
            product.updated_at.isoformat()
        ])
    
    output = si.getvalue()
    si.close()
    
    return send_file(
        io.BytesIO(output.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'stock_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@app.route('/api/persons/export', methods=['GET'])
@login_required
def export_persons():
    persons = Person.query.filter(Person.is_active == True).all()
    
    # Create CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow(['ID', 'Employee Code', 'Name', 'Department', 'Branch', 'Designation', 'Contact Number', 'Email', 'Created At'])
    
    # Write data
    for person in persons:
        cw.writerow([
            person.id,
            person.employee_code,
            person.name,
            person.department,
            person.branch,
            person.designation or '',
            person.contact_number or '',
            person.email or '',
            person.created_at.isoformat()
        ])
    
    output = si.getvalue()
    si.close()
    
    return send_file(
        io.BytesIO(output.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'persons_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

# 🔔 Notification Endpoints
@app.route('/api/notifications/low-stock', methods=['GET'])
@login_required
def get_low_stock_notifications():
    low_stock_products = Product.query.filter(
        Product.quantity <= Product.min_stock_level
    ).all()
    
    return jsonify({
        'low_stock_products': [{
            'id': p.id,
            'name': p.name,
            'material_code': p.material_code,
            'quantity': p.quantity,
            'min_stock_level': p.min_stock_level,
            'category': p.category,
            'unit': p.unit
        } for p in low_stock_products],
        'count': len(low_stock_products)
    })

# 👥 User Management (Admin only)
@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify({
        'users': [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.full_name,
            'is_admin': u.is_admin,
            'created_at': u.created_at.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None
        } for u in users]
    })

if __name__ == '__main__':
    app.run(debug=True, host='192.168.72.144', port=5000)
