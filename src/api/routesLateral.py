"""
Rutas para la barra lateral:
- Calendars (grupos de eventos)
- TaskGroups (grupos de tareas)
"""
from flask import request, jsonify, Blueprint
from .models import db, Calendar, TaskGroup
from .routes import api, token_required
from .utils import APIException

# ---------- Helpers ----------
def _validate_calendar_ownership(calendar_id: int, user_id: int) -> Calendar:
    cal = Calendar.query.filter_by(id=calendar_id, user_id=user_id).first()
    if not cal:
        raise APIException("El calendario no existe o no pertenece al usuario", 404)
    return cal

def _validate_taskgroup_ownership(group_id: int, user_id: int) -> TaskGroup:
    tg = TaskGroup.query.filter_by(id=group_id, user_id=user_id).first()
    if not tg:
        raise APIException("El grupo no existe o no pertenece al usuario", 404)
    return tg


# ---------- Calendars ----------
@api.route("/calendars", methods=["OPTIONS"])
@api.route("/calendars/<int:calendar_id>", methods=["OPTIONS"])
def calendars_options(calendar_id=None):
    return ("", 204)

@api.route("/calendars", methods=["GET"])
@token_required
def list_calendars(auth_payload):
    user_id = auth_payload.get("user_id")
    cals = Calendar.query.filter_by(user_id=user_id).order_by(Calendar.id.asc()).all()
    return jsonify([c.serialize() for c in cals]), 200

@api.route("/calendars", methods=["POST"])
@token_required
def create_calendar(auth_payload):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    color = (data.get("color") or "").strip()

    if not title:
        raise APIException("El título es requerido", 400)
    if not color:
        raise APIException("El color es requerido", 400)

    cal = Calendar(user_id=user_id, title=title, color=color)
    db.session.add(cal)
    db.session.commit()
    return jsonify(cal.serialize()), 201

@api.route("/calendars/<int:calendar_id>", methods=["PUT", "PATCH"])
@token_required
def update_calendar(auth_payload, calendar_id: int):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}
    cal = _validate_calendar_ownership(calendar_id, user_id)

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            raise APIException("El título no puede estar vacío", 400)
        cal.title = title

    if "color" in data:
        color = (data.get("color") or "").strip()
        if not color:
            raise APIException("El color no puede estar vacío", 400)
        cal.color = color

    db.session.commit()
    return jsonify(cal.serialize()), 200

@api.route("/calendars/<int:calendar_id>", methods=["DELETE"])
@token_required
def delete_calendar(auth_payload, calendar_id: int):
    user_id = auth_payload.get("user_id")
    cal = _validate_calendar_ownership(calendar_id, user_id)

    db.session.delete(cal)
    db.session.commit()
    return jsonify({"message": "Calendario eliminado"}), 200


# ---------- Task Groups ----------
@api.route("/task-groups", methods=["OPTIONS"])
@api.route("/task-groups/<int:group_id>", methods=["OPTIONS"])
def taskgroups_options(group_id=None):
    return ("", 204)

@api.route("/task-groups", methods=["GET"])
@token_required
def list_task_groups(auth_payload):
    user_id = auth_payload.get("user_id")
    groups = TaskGroup.query.filter_by(user_id=user_id).order_by(TaskGroup.id.asc()).all()
    return jsonify([g.serialize_with_tasks() for g in groups]), 200

@api.route("/task-groups", methods=["POST"])
@token_required
def create_task_group(auth_payload):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    color = (data.get("color") or "").strip()

    if not title:
        raise APIException("El título es requerido", 400)
    if not color:
        raise APIException("El color es requerido", 400)

    tg = TaskGroup(user_id=user_id, title=title, color=color)
    db.session.add(tg)
    db.session.commit()
    return jsonify(tg.serialize_with_tasks()), 201

@api.route("/task-groups/<int:group_id>", methods=["PUT", "PATCH"])
@token_required
def update_task_group(auth_payload, group_id: int):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}
    tg = _validate_taskgroup_ownership(group_id, user_id)

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            raise APIException("El título no puede estar vacío", 400)
        tg.title = title

    if "color" in data:
        color = (data.get("color") or "").strip()
        if not color:
            raise APIException("El color no puede estar vacío", 400)
        tg.color = color

    db.session.commit()
    return jsonify(tg.serialize_with_tasks()), 200

@api.route("/task-groups/<int:group_id>", methods=["DELETE"])
@token_required
def delete_task_group(auth_payload, group_id: int):
    user_id = auth_payload.get("user_id")
    tg = _validate_taskgroup_ownership(group_id, user_id)

    db.session.delete(tg)
    db.session.commit()
    return jsonify({"message": "Grupo eliminado"}), 200
