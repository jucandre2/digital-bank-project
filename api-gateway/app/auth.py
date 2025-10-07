from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import db, BackOfficeUser, Permission, RolePermission
from flask_jwt_extended import create_access_token
import os

bp = Blueprint('auth', __name__, url_prefix='/auth')
CLIENT_ID = os.environ.get('VUE_APP_GOOGLE_CLIENT_ID') 

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    token = data.get('credential')

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        email = idinfo['email']

        user = BackOfficeUser.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Usuário não autorizado."}), 403

        # --- LÓGICA APERFEIÇOADA AQUI ---
        # Busca todas as permissões para o perfil do usuário
        user_permissions_query = db.session.query(Permission.name).join(RolePermission).filter(RolePermission.role_name == user.role).all()
        # Converte o resultado em uma lista simples de strings: ['CAN_VIEW_USERS', 'CAN_DELETE_USERS']
        user_permissions = [p[0] for p in user_permissions_query]

        # Adiciona as permissões ao "crachá" (token JWT) e à resposta
        additional_claims = {
            "role": user.role, 
            "name": user.full_name, 
            "email": user.email,
            "permissions": user_permissions # Lista de permissões
        }

        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        return jsonify(
            access_token=access_token,
            user={
                'name': user.full_name, 
                'email': user.email, 
                'role': user.role,
                'permissions': user_permissions # Envia a lista para o frontend
            }
        )
    except ValueError:
        return jsonify({"msg": "Token do Google inválido."}), 401
