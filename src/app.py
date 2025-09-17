"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, jsonify, send_from_directory, request
from flask_migrate import Migrate
from flask_cors import CORS

from api.utils import APIException, generate_sitemap
from api.models import db
from api import api                 # <- re-exporta el blueprint y carga routesEvent, routesTasks, routesLateral
from api.admin import setup_admin
from api.commands import setup_commands

# ===================== App & ENV =====================
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# Secret key para firmar tokens (usa variable de entorno en prod)
app.config['SECRET_KEY'] = os.environ.get('FLASK_APP_KEY', 'change-this-in-prod')

# ===================== CORS =====================
# Debe coincidir EXACTAMENTE con el origin del front (p. ej. https://xxxx-3000.app.github.dev)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")

# Aplica CORS a /api/*
CORS(
    app,
    resources={r"/api/*": {"origins": FRONTEND_ORIGIN or "*"}},
    supports_credentials=False
)

@app.after_request
def add_cors_headers(resp):
    """
    Refuerza CORS en cualquier respuesta (incluye errores y preflight).
    Si FRONTEND_ORIGIN no está seteado, permite cualquier origen en desarrollo.
    """
    req_origin = request.headers.get("Origin")
    allowed = FRONTEND_ORIGIN or "*"

    if FRONTEND_ORIGIN:
        if req_origin == FRONTEND_ORIGIN:
            resp.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    else:
        resp.headers["Access-Control-Allow-Origin"] = "*"

    resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return resp

# ===================== Database =====================
db_url = os.getenv("DATABASE_URL")
if db_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# ===================== Admin / CLI =====================
setup_admin(app)
setup_commands(app)

# ===================== Blueprints =====================
# Registra SOLO el blueprint `api`. El resto de rutas se importan desde api/__init__.py
app.register_blueprint(api, url_prefix='/api')

# ===================== Error Handlers =====================
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

@app.errorhandler(Exception)
def handle_unexpected_error(err):
    try:
        import traceback
        print("UNHANDLED ERROR:", traceback.format_exc())
    except Exception:
        pass
    return jsonify({"message": "Internal Server Error", "detail": str(err)}), 500

# ===================== Frontend / Sitemap =====================
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'front/assets/img'), filename)

# ===================== Entry Point =====================
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
