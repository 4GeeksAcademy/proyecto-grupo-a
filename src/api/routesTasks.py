# src/api/routesTasks.py
"""
Rutas de TAREAS (to-do) integradas al mismo Blueprint `api`.
Contrato esperado por el front:
  GET    /api/tasks?start=&end=
  POST   /api/tasks
  GET    /api/tasks/<id>
  PUT    /api/tasks/<id>
  DELETE /api/tasks/<id>

Body de creación/actualización:
{
  "title": "Texto",
  "date": "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM",
  "task_group_id": 1,
  "status": true/false,
  "color": "#RRGGBB" (opcional)
}
"""
from flask import request, jsonify
from datetime import datetime, date, time
from typing import Optional
from sqlalchemy.exc import IntegrityError

from .models import db, Task, TaskGroup
from .routes import api, token_required
from .utils import APIException

# --------- Helpers (mismos criterios que routesEvent) ---------

def _normalize_iso(s: str) -> str:
    if not s:
        return s
    s = s.strip().replace(" ", "T")
    if "T" not in s:
        s = f"{s}T00:00"
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return s

def _parse_iso_datetime(value: str) -> datetime:
    value = _normalize_iso(value or "")
    if not value:
        raise ValueError("Fecha/hora vacía")
    try:
        return datetime.fromisoformat(value)
    except Exception as e:
        raise ValueError(f"Formato datetime inválido: {value}") from e

def _require_int(value, name: str) -> int:
    if value in (None, "", []):
        raise APIException(f"Debes enviar {name}", 400)
    try:
        return int(value)
    except Exception:
        raise APIException(f"{name} debe ser numérico", 400)

def _validate_taskgroup_ownership(task_group_id: int, user_id: int) -> TaskGroup:
    tg = TaskGroup.query.filter_by(id=task_group_id, user_id=user_id).first()
    if not tg:
        raise APIException("El grupo no existe o no pertenece al usuario", 404)
    return tg

# --------- Rutas ---------

@api.route("/tasks", methods=["OPTIONS"])
@api.route("/tasks/<int:task_id>", methods=["OPTIONS"])
def tasks_options(task_id=None):
    return ("", 204)

@api.route("/tasks", methods=["GET"])
@token_required
def list_tasks(auth_payload):
    """
    Lista tareas del usuario autenticado.
    Filtra opcionalmente por ?start=&end= usando Task.date (inclusive start, inclusive end).
    """
    user_id = auth_payload.get("user_id")
    q = Task.query.filter_by(user_id=user_id)

    start_qs = request.args.get("start")
    end_qs = request.args.get("end")

    try:
        if start_qs:
            start_dt = _parse_iso_datetime(start_qs)
            q = q.filter(Task.date >= start_dt)
        if end_qs:
            end_dt = _parse_iso_datetime(end_qs)
            q = q.filter(Task.date <= end_dt)
    except ValueError as e:
        raise APIException(str(e), 400)

    tasks = q.order_by(Task.date.asc()).all()
    return jsonify([t.serialize() for t in tasks]), 200

@api.route("/tasks", methods=["POST"])
@token_required
def create_task(auth_payload):
    """
    Crea una tarea del usuario.
    Requiere: title, date, task_group_id
    """
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    if not title:
        raise APIException("El título es requerido", 400)

    raw_date = data.get("date")
    if not raw_date:
        raise APIException("Debes enviar 'date' (YYYY-MM-DD o YYYY-MM-DDTHH:MM)", 400)
    try:
        when = _parse_iso_datetime(raw_date)
    except ValueError as e:
        raise APIException(str(e), 400)

    tg_id = _require_int(data.get("task_group_id"), "task_group_id")
    _validate_taskgroup_ownership(tg_id, user_id)

    t = Task(
        user_id=user_id,
        task_group_id=tg_id,
        title=title,
        status=bool(data.get("status", False)),
        date=when,
        recurrencia=int(data.get("recurrencia", 0) or 0),
        color=(data.get("color") or "").strip()
    )
    db.session.add(t)
    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR create_task:", traceback.format_exc())
        raise APIException("No se pudo crear la tarea", 500)

    return jsonify(t.serialize()), 201

@api.route("/tasks/<int:task_id>", methods=["GET"])
@token_required
def get_task(auth_payload, task_id: int):
    user_id = auth_payload.get("user_id")
    t = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not t:
        raise APIException("Tarea no encontrada", 404)
    return jsonify(t.serialize()), 200

@api.route("/tasks/<int:task_id>", methods=["PUT", "PATCH"])
@token_required
def update_task(auth_payload, task_id: int):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}

    t = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not t:
        raise APIException("Tarea no encontrada", 404)

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            raise APIException("El título no puede estar vacío", 400)
        t.title = title

    if "date" in data:
        try:
            t.date = _parse_iso_datetime(data.get("date") or "")
        except ValueError as e:
            raise APIException(str(e), 400)

    if "status" in data:
        t.status = bool(data.get("status"))

    if "color" in data:
        t.color = (data.get("color") or "").strip()

    if "task_group_id" in data:
        tg_id = _require_int(data.get("task_group_id"), "task_group_id")
        _validate_taskgroup_ownership(tg_id, user_id)
        t.task_group_id = tg_id

    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR update_task:", traceback.format_exc())
        raise APIException("No se pudo actualizar la tarea", 500)

    return jsonify(t.serialize()), 200

@api.route("/tasks/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(auth_payload, task_id: int):
    user_id = auth_payload.get("user_id")
    t = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not t:
        raise APIException("Tarea no encontrada", 404)

    db.session.delete(t)
    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR delete_task:", traceback.format_exc())
        raise APIException("No se pudo eliminar la tarea", 500)

    return jsonify({"message": "Tarea eliminada"}), 200
