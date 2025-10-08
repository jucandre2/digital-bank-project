import random
import string
from flask import Blueprint, jsonify, request
from .models import db, Client, Transaction
from sqlalchemy import or_

bp = Blueprint('clients_api', __name__)

def generate_unique_account_number():
    """Gera um número de conta aleatório de 6 dígitos e garante que ele seja único."""
    while True:
        acc_number = str(random.randint(100000, 999999))
        digit = str(sum(int(d) for d in acc_number) % 10)
        final_acc_number = f"{acc_number}-{digit}"
        if not Client.query.filter_by(account_number=final_acc_number).first():
            return final_acc_number

@bp.route('/clients', methods=['GET'])
def get_clients():
    """Retorna uma lista de clientes, filtrando se um parâmetro 'q' for fornecido."""
    query = Client.query
    search_term = request.args.get('q')

    if search_term:
        # Busca por correspondência exata no CPF ou parcial no nome
        query = query.filter(
            or_(
                Client.cpf == search_term,
                Client.full_name.ilike(f"%{search_term}%")
            )
        )

    # Limita a 10 resultados para não sobrecarregar a busca
    clients = query.order_by(Client.full_name).limit(10).all()
    return jsonify([client.to_dict() for client in clients])

@bp.route('/clients', methods=['POST'])
def create_client():
    """Cria um novo cliente."""
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Requisição sem dados"}), 400

    required_fields = ['full_name', 'rg', 'cpf', 'address', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Campos obrigatórios faltando"}), 400

    if Client.query.filter_by(rg=data['rg']).first():
        return jsonify({"msg": "RG já cadastrado"}), 409
    if Client.query.filter_by(cpf=data['cpf']).first():
        return jsonify({"msg": "CPF já cadastrado"}), 409
        
    new_client = Client(
        full_name=data['full_name'],
        rg=data['rg'],
        cpf=data['cpf'],
        address=data['address'],
        account_number=generate_unique_account_number(),
        balance_cents=0,
        branch='0001'
    )
    new_client.set_password(data['password'])

    db.session.add(new_client)
    db.session.commit()

    return jsonify(new_client.to_dict()), 201

@bp.route('/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    """Retorna os detalhes de um cliente específico."""
    client = Client.query.get_or_404(client_id)
    return jsonify(client.to_dict())

@bp.route('/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    """Atualiza os dados de um cliente."""
    client = Client.query.get_or_404(client_id)
    data = request.get_json()

    client.full_name = data.get('full_name', client.full_name)
    client.rg = data.get('rg', client.rg)
    client.cpf = data.get('cpf', client.cpf)
    client.address = data.get('address', client.address)

    db.session.commit()
    return jsonify(client.to_dict())

@bp.route('/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Deleta um cliente."""
    client = Client.query.get_or_404(client_id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({"msg": "Cliente deletado com sucesso"}), 200

@bp.route('/clients/<int:client_id>/statement', methods=['GET'])
def get_client_statement(client_id):
    """Retorna o extrato de um cliente específico."""
    Client.query.get_or_404(client_id)
    
    transactions = Transaction.query.filter_by(client_id=client_id).order_by(Transaction.timestamp.desc()).all()
    
    return jsonify([t.to_dict() for t in transactions])
