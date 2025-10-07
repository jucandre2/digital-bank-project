from flask import Blueprint, jsonify, request
import requests
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from functools import wraps
from .models import db, BackOfficeUser, User, AuditLog, Permission, RolePermission
from . import redis_client
from twilio.twiml.messaging_response import MessagingResponse

bp = Blueprint('gateway_api', __name__, url_prefix='/api')

SERVICE_ACCOUNTS_URL = "http://service-accounts:5001"
SERVICE_PASSWORDS_URL = "http://service-passwords:5002"
SERVICE_BIOMETRICS_URL = "http://service-biometrics:5003"
RASA_API_URL = "http://rasa-server:5005/webhooks/rest/webhook"

def log_action(action, details=""):
    try:
        verify_jwt_in_request(optional=True)
        claims = get_jwt()
        user_email = claims.get("email", "anonymous")
    except Exception:
        user_email = "system/anonymous"

    log = AuditLog(user_email=user_email, action=action, details=details)
    db.session.add(log)
    db.session.commit()

def permission_required(permission_name):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role", "User")

            if user_role == 'Admin':
                return fn(*args, **kwargs)

            permission = Permission.query.filter_by(name=permission_name).first()
            if not permission:
                return jsonify(msg="Permissão interna inválida."), 500

            has_permission = RolePermission.query.filter_by(
                role_name=user_role, permission_id=permission.id
            ).first()

            if has_permission:
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Você não tem permissão para realizar esta ação."), 403
        return decorator
    return wrapper

@bp.route('/balance/<int:user_id>', methods=['GET'])
@permission_required('CAN_VIEW_CUSTOMER_DATA')
def get_balance(user_id):
    response = requests.get(f"{SERVICE_ACCOUNTS_URL}/balance/{user_id}")
    return jsonify(response.json()), response.status_code

@bp.route('/reset-password', methods=['POST'])
@permission_required('CAN_RESET_CUSTOMER_PASSWORD')
def reset_password():
    response = requests.post(f"{SERVICE_PASSWORDS_URL}/reset-password", json=request.get_json())
    return jsonify(response.json()), response.status_code

@bp.route('/reset-biometrics', methods=['POST'])
@permission_required('CAN_RESET_CUSTOMER_BIOMETRICS')
def reset_biometrics():
    response = requests.post(f"{SERVICE_BIOMETRICS_URL}/reset-biometrics", json=request.get_json())
    return jsonify(response.json()), response.status_code

@bp.route('/backoffice-users', methods=['POST'])
@permission_required('CAN_MANAGE_USERS')
def create_backoffice_user():
    data = request.get_json()
    if not all(k in data for k in ['email', 'full_name', 'role']):
        return jsonify(msg="Dados incompletos"), 400
    if BackOfficeUser.query.filter_by(email=data['email']).first():
        return jsonify(msg="Email já cadastrado"), 409

    new_user = BackOfficeUser(email=data['email'], full_name=data['full_name'], role=data['role'])
    db.session.add(new_user)
    db.session.commit()
    log_action("CREATE_USER", f"Usuário criado: {data['email']}, Perfil: {data['role']}")
    return jsonify(new_user.to_dict()), 201

@bp.route('/backoffice-users', methods=['GET'])
@permission_required('CAN_MANAGE_USERS')
def get_backoffice_users():
    users = BackOfficeUser.query.order_by(BackOfficeUser.id).all()
    return jsonify([user.to_dict() for user in users])

@bp.route('/backoffice-users/<int:user_id>', methods=['PUT'])
@permission_required('CAN_MANAGE_USERS')
def update_backoffice_user(user_id):
    user = BackOfficeUser.query.get_or_404(user_id)
    data = request.get_json()
    log_details = f"Usuário ID {user_id} ({user.email}) atualizado. "
    if 'full_name' in data and user.full_name != data['full_name']:
        log_details += f"Nome alterado para '{data['full_name']}'. "
        user.full_name = data['full_name']
    if 'role' in data and user.role != data['role']:
        log_details += f"Perfil alterado para '{data['role']}'."
        user.role = data['role']

    db.session.commit()
    log_action("UPDATE_USER", log_details)
    return jsonify(user.to_dict())

@bp.route('/backoffice-users/<int:user_id>', methods=['DELETE'])
@permission_required('CAN_MANAGE_USERS')
def delete_backoffice_user(user_id):
    user = BackOfficeUser.query.get_or_404(user_id)
    log_action("DELETE_USER", f"Usuário excluído: {user.email}")
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg="Usuário excluído com sucesso"), 200

@bp.route('/audit-logs', methods=['GET'])
@permission_required('CAN_VIEW_AUDIT_LOGS')
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs])

@bp.route('/permissions', methods=['GET'])
@permission_required('CAN_MANAGE_PERMISSIONS')
def get_all_permissions():
    permissions = Permission.query.all()
    return jsonify([p.to_dict() for p in permissions])

@bp.route('/roles/<role_name>/permissions', methods=['GET'])
@permission_required('CAN_MANAGE_PERMISSIONS')
def get_role_permissions(role_name):
    permissions = db.session.query(Permission).join(RolePermission).filter(RolePermission.role_name == role_name).all()
    return jsonify([p.to_dict() for p in permissions])

@bp.route('/roles/<role_name>/permissions', methods=['POST'])
@permission_required('CAN_MANAGE_PERMISSIONS')
def set_role_permissions(role_name):
    data = request.get_json()
    permission_ids = data.get('permission_ids', [])

    RolePermission.query.filter_by(role_name=role_name).delete()

    for pid in permission_ids:
        new_perm = RolePermission(role_name=role_name, permission_id=pid)
        db.session.add(new_perm)

    db.session.commit()
    log_action("UPDATE_PERMISSIONS", f"Permissões atualizadas para o perfil: {role_name}")
    return jsonify(msg=f"Permissões para {role_name} atualizadas com sucesso.")

@bp.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    # ... (código do webhook continua o mesmo) ...
    return str(response_twilio)
