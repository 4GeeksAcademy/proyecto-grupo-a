import os
from flask import Flask, request, jsonify, url_for
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS
from utils import APIException, generate_sitemap
from admin import setup_admin
from models import db, User, Event, Task, Group


app = Flask(__name__)

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


@app.route('/')
def sitemap():
    return generate_sitemap(app)


# AQUI EMPIEZAN MIS RUTAS! --->

# Endpoints

#  Obtener todas las tareas de un usuario

@app.route("/api/users/<int:user_id>/tasks", methods=["GET"])
def get_user_tasks(user_id):
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([task.serialize() for task in tasks]), 200


# Crear nueva tarea para un usuario

@app.route("/api/users/<int:user_id>/tasks", methods=["POST"])
def create_task(user_id):
    data = request.get_json()

    if "title" not in data:
        return jsonify({"error": "Falta el campo 'title'"}), 400

    new_task = Task(
        user_id=user_id,
        title=data["title"],
        status=data.get("status", "pending"),
        date=data.get("date"),
        recurrencia=data.get("recurrencia"),
        color=data.get("color")
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.serialize()), 201

# Eliminar una tarea de un usuario

@app.route("/api/users/<int:user_id>/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(user_id, task_id):
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Tarea eliminada correctamente"}), 200

# Actualizar una tarea de un usuario

@app.route("/api/users/<int:user_id>/tasks/<int:task_id>", methods=["PUT"])
def update_task(user_id, task_id):
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    data = request.get_json()

    task.title = data.get("title", task.title)
    task.status = data.get("status", task.status)
    task.date = data.get("date", task.date)
    task.recurrencia = data.get("recurrencia", task.recurrencia)
    task.color = data.get("color", task.color)

    db.session.commit()
    return jsonify(task.serialize()), 200




