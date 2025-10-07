from flask import Blueprint, jsonify, request
from .models import User, db

bp = Blueprint('passwords_api', __name__)

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if 'user_id' not in data or 'new_password' not in data:
        return jsonify({'error': 'É necessário fornecer user_id e new_password'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    if len(data['new_password']) < 8:
         return jsonify({'error': 'Senha muito curta'}), 400

    user.set_password(data['new_password'])
    db.session.commit()
    return jsonify({'message': f'Senha do usuário {user.full_name} foi resetada com sucesso!'})
