"""
API routes with secure password hashing and signed tokens (no extra installs).
"""
from flask import request, jsonify, Blueprint, current_app
from api.models import db, User
from api.utils import APIException
from werkzeug.security import check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from functools import wraps
from datetime import datetime   # ⬅️ agregado para last_session

api = Blueprint('api', __name__)

# ------------------- Helpers -------------------

def _get_serializer():
    secret = current_app.config.get("SECRET_KEY")
    if not secret:
        raise RuntimeError("SECRET_KEY is missing; set FLASK_APP_KEY or app.config['SECRET_KEY']")
    return URLSafeTimedSerializer(secret, salt="auth-token")

def create_token(payload: dict) -> str:
    s = _get_serializer()
    return s.dumps(payload)

def verify_token(token: str, max_age_seconds: int = 60 * 60 * 24) -> dict:
    s = _get_serializer()
    try:
        return s.loads(token, max_age=max_age_seconds)
    except SignatureExpired:
        raise APIException("Token expirado", 401)
    except BadSignature:
        raise APIException("Token inválido", 401)

def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise APIException("Falta header Authorization Bearer", 401)
        token = parts[1]
        payload = verify_token(token)
        kwargs["auth_payload"] = payload
        return fn(*args, **kwargs)
    return wrapper

def user_to_public(user: User) -> dict:
    """Serialización segura del usuario."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "display_name": user.display_name,
        "rol": user.rol,
        "profile_pic": user.profile_pic,
        "signup_date": user.signup_date.isoformat() if user.signup_date else None,
        "last_session": user.last_session.isoformat() if user.last_session else None,
        "status": user.status,
        "is_active": user.is_active,
    }

# ------------------- Rutas públicas -------------------

@api.route('/hello', methods=['GET'])
def handle_hello():
    return jsonify({"message": "Hello! I'm a message from the backend"}), 200

# Preflight OPTIONS para CORS
@api.route('/signup', methods=['OPTIONS'])
def signup_options():
    return ('', 204)

@api.route('/login', methods=['OPTIONS'])
def login_options():
    return ('', 204)

# ------------------- Auth -------------------

@api.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    name = (data.get("name") or "").strip()
    display_name = (data.get("display_name") or data.get("displayName") or "").strip()

    if not email or not password:
        raise APIException("Email y contraseña son requeridos", 400)

    if not name:
        local = email.split("@")[0] if "@" in email else ""
        name = " ".join(part.capitalize() for part in local.replace(".", " ").split()) or "Usuario"

    if not display_name:
        display_name = name

    if User.query.filter_by(email=email).first():
        raise APIException("El email ya está registrado", 409)

    # Forzamos valores por defecto para columnas NOT NULL
    user = User(
        email=email,
        is_active=True,
        name=name,
        display_name=display_name,
        profile_pic=(data.get("profile_pic") or ""),   # evitar NULL
        rol=(data.get("rol") or "user"),
        last_session=datetime.utcnow(),                # evitar NULL
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_token({"user_id": user.id, "email": user.email})

    return jsonify({
        "message": "Usuario creado exitosamente",
        "user": user_to_public(user),
        "token": token
    }), 201


@api.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        raise APIException("Email y contraseña son requeridos", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        raise APIException("Credenciales inválidas", 401)

    token = create_token({"user_id": user.id, "email": user.email})

    return jsonify({
        "message": "Login correcto",
        "user": user_to_public(user),
        "token": token
    }), 200

# ------------------- Ruta protegida -------------------

@api.route('/profile', methods=['GET'])
@token_required
def profile(auth_payload):
    user_id = auth_payload.get("user_id")
    user = User.query.get(user_id)
    if not user:
        raise APIException("Usuario no encontrado", 404)
    return jsonify({"user": user_to_public(user)}), 200
