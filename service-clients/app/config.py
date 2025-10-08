import os
from dotenv import load_dotenv

# Carrega o .env da pasta api-gateway
dotenv_path = os.path.join(os.path.dirname(__file__), '../../api-gateway', '.env')
load_dotenv(dotenv_path=dotenv_path)

class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}@"
        f"{os.environ.get('DB_HOST')}:{os.environ.get('DB_PORT')}/{os.environ.get('MYSQL_DATABASE')}"
        f"?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
