"""
Rutas de eventos (agenda/calendario) con soporte de rangos horarios.
Se integran al mismo Blueprint `api` definido en routes.py.
"""
from flask import request, jsonify
from datetime import datetime, date, time
from typing import Optional, Tuple
from sqlalchemy.exc import IntegrityError

from .models import db, Event, Calendar
from .routes import api, token_required
from .utils import APIException

# ---------- Helpers robustos ----------

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

def _compose_datetimes_from_parts(payload: dict) -> Optional[Tuple[datetime, datetime]]:
    d = (payload.get("date") or "").strip()
    st = (payload.get("start_time") or "").strip()
    et = (payload.get("end_time") or "").strip()
    if not d or not st or not et:
        return None

    try:
        d_date = date.fromisoformat(d)  # YYYY-MM-DD
        sh, sm = [int(x) for x in st.split(":")]
        eh, em = [int(x) for x in et.split(":")]
        start_dt = datetime.combine(d_date, time(sh, sm))
        end_dt = datetime.combine(d_date, time(eh, em))
        return start_dt, end_dt
    except Exception as e:
        raise ValueError("Partes de fecha/hora inválidas (usa ISO: YYYY-MM-DD y HH:MM)") from e

def _get_datetimes(payload: dict) -> Tuple[datetime, datetime]:
    start_raw = payload.get("start_date") or payload.get("start")
    end_raw = payload.get("end_date") or payload.get("end")

    if start_raw and end_raw:
        start_dt = _parse_iso_datetime(start_raw)
        end_dt = _parse_iso_datetime(end_raw)
        return start_dt, end_dt

    parts = _compose_datetimes_from_parts(payload)
    if parts:
        return parts

    raise ValueError("Debes enviar start/end en ISO o bien date + start_time + end_time")

def _validate_calendar_ownership(calendar_id: int, user_id: int) -> Calendar:
    cal = Calendar.query.filter_by(id=calendar_id, user_id=user_id).first()
    if not cal:
        raise APIException("El calendario no existe o no pertenece al usuario", 404)
    return cal

# ---------- Endpoints ----------

@api.route("/events", methods=["OPTIONS"])
@api.route("/events/<int:event_id>", methods=["OPTIONS"])
def events_options(event_id=None):
    return ("", 204)

@api.route("/events", methods=["GET"])
@token_required
def list_events(auth_payload):
    user_id = auth_payload.get("user_id")

    q = Event.query.filter_by(user_id=user_id)

    start_qs = request.args.get("start")
    end_qs = request.args.get("end")

    try:
        if start_qs:
            start_dt = _parse_iso_datetime(start_qs)
            q = q.filter(Event.start_date >= start_dt)
        if end_qs:
            end_dt = _parse_iso_datetime(end_qs)
            q = q.filter(Event.end_date <= end_dt)
    except ValueError as e:
        raise APIException(str(e), 400)

    events = q.order_by(Event.start_date.asc()).all()
    return jsonify([e.serialize() for e in events]), 200

@api.route("/events", methods=["POST"])
@token_required
def create_event(auth_payload):
    """
    Crea un evento del usuario.
    Body JSON (varias opciones)…
    """
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    if not title:
        raise APIException("El título es requerido", 400)

    # Fechas
    try:
        start_dt, end_dt = _get_datetimes(data)
    except ValueError as e:
        raise APIException(str(e), 400)

    if end_dt <= start_dt:
        raise APIException("La hora de fin debe ser posterior a la de inicio", 400)

    # calendar_id obligatorio y numérico + ownership
    calendar_id_raw = data.get("calendar_id")
    if calendar_id_raw in (None, "", []):
        raise APIException("Debes enviar calendar_id", 400)
    try:
        calendar_id = int(calendar_id_raw)
    except Exception:
        raise APIException("calendar_id debe ser numérico", 400)

    _validate_calendar_ownership(calendar_id, user_id)

    ev = Event(
        user_id=user_id,
        calendar_id=calendar_id,
        title=title,
        start_date=start_dt,
        end_date=end_dt,
        # 👇 cadenas vacías en vez de None para esquemas con NOT NULL
        description=(data.get("description") or "").strip(),
        color=(data.get("color") or "").strip(),
    )
    db.session.add(ev)

    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR create_event:", traceback.format_exc())
        raise APIException("No se pudo crear el evento", 500)

    return jsonify(ev.serialize()), 201

@api.route("/events/<int:event_id>", methods=["GET"])
@token_required
def get_event(auth_payload, event_id: int):
    user_id = auth_payload.get("user_id")

    ev = Event.query.filter_by(id=event_id, user_id=user_id).first()
    if not ev:
        raise APIException("Evento no encontrado", 404)
    return jsonify(ev.serialize()), 200

@api.route("/events/<int:event_id>", methods=["PUT", "PATCH"])
@token_required
def update_event(auth_payload, event_id: int):
    user_id = auth_payload.get("user_id")
    data = request.get_json() or {}

    ev = Event.query.filter_by(id=event_id, user_id=user_id).first()
    if not ev:
        raise APIException("Evento no encontrado", 404)

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            raise APIException("El título no puede estar vacío", 400)
        ev.title = title

    # Rango horario
    try:
        if any(k in data for k in ("start_date", "end_date", "start", "end")):
            start_raw = data.get("start_date") or data.get("start")
            end_raw = data.get("end_date") or data.get("end")
            if not start_raw or not end_raw:
                raise APIException("Para actualizar el rango envía start y end", 400)
            ev.start_date = _parse_iso_datetime(start_raw)
            ev.end_date = _parse_iso_datetime(end_raw)
        elif any(k in data for k in ("date", "start_time", "end_time")):
            parts = _compose_datetimes_from_parts(data)
            if not parts:
                raise APIException("Faltan date, start_time o end_time", 400)
            ev.start_date, ev.end_date = parts
    except ValueError as e:
        raise APIException(str(e), 400)

    if ev.end_date <= ev.start_date:
        raise APIException("La hora de fin debe ser posterior a la de inicio", 400)

    if "description" in data:
        ev.description = (data.get("description") or "").strip()  # <- cadena vacía
    if "color" in data:
        ev.color = (data.get("color") or "").strip()              # <- cadena vacía

    if "calendar_id" in data:
        gid_raw = data.get("calendar_id")
        try:
            gid = int(gid_raw)
        except Exception:
            raise APIException("calendar_id debe ser numérico", 400)
        _validate_calendar_ownership(gid, user_id)
        ev.calendar_id = gid

    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR update_event:", traceback.format_exc())
        raise APIException("No se pudo actualizar el evento", 500)

    return jsonify(ev.serialize()), 200

@api.route("/events/<int:event_id>", methods=["DELETE"])
@token_required
def delete_event(auth_payload, event_id: int):
    user_id = auth_payload.get("user_id")

    ev = Event.query.filter_by(id=event_id, user_id=user_id).first()
    if not ev:
        raise APIException("Evento no encontrado", 404)

    db.session.delete(ev)
    try:
        db.session.commit()
    except IntegrityError as ie:
        db.session.rollback()
        raise APIException(f"Integridad BD: {str(ie.orig)}", 400)
    except Exception:
        db.session.rollback()
        import traceback; print("ERROR delete_event:", traceback.format_exc())
        raise APIException("No se pudo eliminar el evento", 500)

    return jsonify({"message": "Evento eliminado"}), 200
