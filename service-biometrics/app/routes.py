from flask import Blueprint, jsonify, request
from .models import User

bp = Blueprint('biometrics_api', __name__)

@bp.route('/reset-biometrics', methods=['POST'])
def reset_biometrics():
    data = request.get_json()
    if 'user_id' not in data:
        return jsonify({'error': 'É necessário fornecer o user_id'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    print(f"INFO: Biometria para o usuário '{user.full_name}' (ID: {user.id}) foi resetada.")
    return jsonify({'message': f'Solicitação de reset de biometria para {user.full_name} enviada.'})
