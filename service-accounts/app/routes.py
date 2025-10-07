from flask import Blueprint, jsonify
from .models import User

bp = Blueprint('accounts_api', __name__)

@bp.route('/balance/<int:user_id>', methods=['GET'])
def get_balance(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'user_id': user.id,
        'full_name': user.full_name,
        'balance': user.balance
    })

@bp.route('/statement/<int:user_id>', methods=['GET'])
def get_statement(user_id):
    return jsonify({
        'user_id': user_id,
        'statement': [
            {"desc": "Compra iFood", "value": "-54.30"},
            {"desc": "PIX Recebido", "value": "+200.00"}
        ]
    })
