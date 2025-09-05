"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS

from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from api.routesAgenda import agenda
# Detect environment
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

# Static folder (for frontend build)
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# 🔑 Secret key para firmar tokens (usa variable de entorno o valor por defecto)
app.config['SECRET_KEY'] = os.environ.get(
    'FLASK_APP_KEY', 'change-this-in-prod')

# ===================== CORS (Global) =====================
# Define el origen del frontend (puedes setearlo en .env del backend)
FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "https://friendly-space-goggles-r466vpgq474jfpr9j-3000.app.github.dev"
)

# Habilita CORS para todas las rutas /api/*
CORS(
    app,
    resources={r"/api/*": {"origins": [FRONTEND_ORIGIN]}},
    supports_credentials=False  # Si no usas cookies/sesiones, déjalo en False
)


@app.after_request
def add_cors_headers(resp):
    """
    Refuerza CORS en cualquier respuesta (incluye errores y preflight).
    Evita bloqueos en entornos como GitHub Codespaces.
    """
    resp.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return resp
# =========================================================


# Database configuration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Add the admin
setup_admin(app)

# Add CLI commands
setup_commands(app)

# Register API blueprint
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(agenda, url_prefix='/agenda')


# Handle/serialize known API errors
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Manejo genérico de errores 500 (si algo se escapa, responde JSON con CORS)


@app.errorhandler(Exception)
def handle_unexpected_error(err):
    try:
        import traceback
        print("UNHANDLED ERROR:", traceback.format_exc())
    except Exception:
        pass
    return jsonify({"message": "Internal Server Error", "detail": str(err)}), 500


# Generate sitemap with all your endpoints
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')


# Any other endpoint will try to serve it like a static file
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# Run the server only if `$ python src/app.py` is executed directly
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)


@app.errorhandler(Exception)
def handle_unexpected_error(err):
    return jsonify({"message": "Internal Server Error", "detail": str(err)}), 500


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'front/assets/img'), filename)
