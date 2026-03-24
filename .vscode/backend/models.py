from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    material_code = db.Column(db.String(50), unique=True, nullable=False)  # New field
    quantity = db.Column(db.Integer, nullable=False, default=0)
    price = db.Column(db.Float, default=0.0)
    category = db.Column(db.String(50), default='General')
    min_stock_level = db.Column(db.Integer, default=5)  # For low stock notifications
    description = db.Column(db.Text, nullable=True)  # New field for product description
    unit = db.Column(db.String(20), default='units')  # New field for unit of measurement
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    full_name = db.Column(db.String(120), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100), nullable=True)
    contact_number = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StockHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    person_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=True)  # New field for person details
    action = db.Column(db.String(20), nullable=False)  # 'receive', 'sale', 'issue', 'edit'
    quantity_change = db.Column(db.Integer, nullable=False)  # positive for additions, negative for removals
    previous_quantity = db.Column(db.Integer, nullable=False)
    new_quantity = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.String(200), nullable=True)
    issue_reason = db.Column(db.String(200), nullable=True)  # New field for issue reason
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='stock_history')
    user = db.relationship('User', backref='stock_actions')
    person = db.relationship('Person', backref='stock_issues')  # New relationship
