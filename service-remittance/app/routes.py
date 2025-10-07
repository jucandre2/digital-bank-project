from flask import Blueprint, jsonify, request

bp = Blueprint('remittance_api', __name__, url_prefix='/remittance')

@bp.route('/upload', methods=['POST'])
def upload_document():
    # A lógica virá aqui
    return jsonify(msg="Endpoint de upload do service-remittance funcionando!"), 200
