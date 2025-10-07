# ----- CRIAÇÃO DOS ARQUIVOS DO NOVO SERVIÇO -----

echo "🛠️ Criando arquivos para o service-remittance..."

# Cria o Dockerfile
cat <<EOF > service-remittance/Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["flask", "run", "--host=0.0.0.0", "--port=5004"]
EOF

# Cria o requirements.txt (com as bibliotecas que vamos precisar)
cat <<EOF > service-remittance/requirements.txt
Flask==2.2.2
boto3
PyPDF2
PyMySQL
Flask-SQLAlchemy
python-dotenv
Werkzeug==2.2.2
cryptography
EOF

# Cria a pasta 'app'
mkdir -p service-remittance/app

# Cria o run.py
cat <<EOF > service-remittance/run.py
from app import create_app
app = create_app()
if __name__ == '__main__':
    app.run()
EOF

# Cria o __init__.py
cat <<EOF > service-remittance/app/__init__.py
import os
from flask import Flask
from .config import Config
from .models import db
from flask_migrate import Migrate

migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    migrate.init_app(app, db)

    from . import routes
    app.register_blueprint(routes.bp)
    
    return app
EOF

# Cria um config.py similar aos outros serviços
cat <<EOF > service-remittance/app/config.py
import os
from dotenv import load_dotenv

# Carrega o .env da pasta api-gateway (assumindo estrutura)
dotenv_path = os.path.join(os.path.dirname(__file__), '../../api-gateway', '.env')
load_dotenv(dotenv_path=dotenv_path)

class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}@"
        f"{os.environ.get('DB_HOST')}:{os.environ.get('DB_PORT')}/{os.environ.get('MYSQL_DATABASE')}"
        f"?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
EOF

# Cria um models.py inicial
cat <<EOF > service-remittance/app/models.py
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()
# Vamos adicionar os modelos de User aqui quando precisarmos
EOF

# Cria um routes.py com o esqueleto da rota
cat <<EOF > service-remittance/app/routes.py
from flask import Blueprint, jsonify, request

bp = Blueprint('remittance_api', __name__, url_prefix='/remittance')

@bp.route('/upload', methods=['POST'])
def upload_document():
    # A lógica virá aqui
    return jsonify(msg="Endpoint de upload do service-remittance funcionando!"), 200
EOF

echo "✅ Arquivos criados com sucesso!"
