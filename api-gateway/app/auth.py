from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import db, BackOfficeUser, Permission, RolePermission, AuditLog # <-- Importar AuditLog
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

        # ==========================================================
        # ===== INCREMENTO DO LOG: Registrando o evento de login =====
        # ==========================================================
        try:
            log = AuditLog(
                user_email=user.email, 
                action="USER_LOGIN", 
                details="Login bem-sucedido via Google SSO."
            )
            db.session.add(log)
            db.session.commit()
        except Exception as e:
            # Se o log falhar, não impede o login do usuário. Apenas registra o erro no console.
            print(f"ERRO AO GRAVAR LOG DE LOGIN: {e}")
        # ==========================================================
        # ==================== FIM DO INCREMENTO ===================
        # ==========================================================


        # --- LÓGICA APERFEIÇOADA AQUI ---
        user_permissions_query = db.session.query(Permission.name).join(RolePermission).filter(RolePermission.role_name == user.role).all()
        user_permissions = [p[0] for p in user_permissions_query]

        additional_claims = {
            "role": user.role,
            "name": user.full_name,
            "email": user.email,
            "permissions": user_permissions
        }

        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        return jsonify(
            access_token=access_token,
            user={
                'name': user.full_name,
                'email': user.email,
                'role': user.role,
                'permissions': user_permissions
            }
        )
    except ValueError:
        return jsonify({"msg": "Token do Google inválido."}), 401
