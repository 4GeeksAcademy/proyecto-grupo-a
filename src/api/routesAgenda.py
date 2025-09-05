from flask import Blueprint, jsonify

agenda = Blueprint('agenda', __name__)

@agenda.route('/eventos_prueva', methods=['GET'])
def eventos_prueva():
    print("--------------->enposint<--------------")
    return {
        "ok": True,
        "message": "Este es el endpoint para ver si se hace bien."
    }, 202
