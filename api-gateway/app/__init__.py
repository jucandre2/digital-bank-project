import os
from flask import Flask
from .config import Config
from .models import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import redis

migrate = Migrate()
jwt = JWTManager()
redis_client = redis.StrictRedis(host=os.environ.get('REDIS_HOST', 'redis'), port=6379, db=0, decode_responses=True)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET_KEY')

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from . import routes, auth
    app.register_blueprint(routes.bp)
    app.register_blueprint(auth.bp)

    return app
