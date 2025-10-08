from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    rg = db.Column(db.String(20), unique=True, nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    address = db.Column(db.Text, nullable=False)
    account_number = db.Column(db.String(10), unique=True, nullable=False)
    branch = db.Column(db.String(4), nullable=False, default='0001')
    balance_cents = db.Column(db.Integer, default=0, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    transactions = db.relationship('Transaction', backref='client', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'rg': self.rg,
            'cpf': self.cpf,
            'address': self.address,
            'account_number': self.account_number,
            'branch': self.branch,
            'balance': f"{self.balance_cents / 100:.2f}",
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    timestamp = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    description = db.Column(db.String(255), nullable=False)
    amount_cents = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(20), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'description': self.description,
            'amount': f"{self.amount_cents / 100:.2f}",
            'type': self.type
        }
