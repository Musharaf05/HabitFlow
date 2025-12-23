import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# --- FIX NEON DATABASE URL ---
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -------------------------------------------------------------------
#                           MODELS (REQUIRED)
# -------------------------------------------------------------------

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(255))
    tag = db.Column(db.String(50))
    date = db.Column(db.String(20))
    status = db.Column(db.String(50))


class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(255))
    priority = db.Column(db.String(20))
    date = db.Column(db.String(20))


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(255))
    date = db.Column(db.String(20))
    time = db.Column(db.String(20))
    repeat = db.Column(db.String(50))

# -------------------------------------------------------------------
#                           ROUTES
# -------------------------------------------------------------------

@app.route("/")
def home():
    return render_template("mdindex.html")


# ---------------------- TASKS ---------------------------

@app.route("/getTasks")
def get_tasks():
    tasks = Task.query.all()
    return jsonify([
        {
            "id": t.id,
            "text": t.text,
            "tag": t.tag,
            "date": t.date,
            "status": t.status
        } for t in tasks
    ])

@app.route("/addTask", methods=["POST"])
def add_task():
    data = request.get_json()

    new = Task(
        text=data["text"],
        tag=data["tag"],
        date=data["date"],
        status="NOT STARTED"
    )
    db.session.add(new)
    db.session.commit()

    return jsonify({"message": "Task added"}), 201

@app.route("/deleteTask/<int:id>", methods=["DELETE"])
def delete_task(id):
    item = Task.query.get(id)
    if not item:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Task deleted"})


# ---------------------- GOALS ---------------------------

@app.route("/getGoals")
def get_goals():
    items = Goal.query.all()
    return jsonify([
        {
            "id": g.id,
            "text": g.text,
            "priority": g.priority,
            "date": g.date
        } for g in items
    ])

@app.route("/addGoal", methods=["POST"])
def add_goal():
    data = request.get_json()

    new = Goal(
        text=data["text"],
        priority=data["priority"],
        date=data["date"]
    )
    db.session.add(new)
    db.session.commit()

    return jsonify({"message": "Goal added"}), 201

@app.route("/deleteGoal/<int:id>", methods=["DELETE"])
def delete_goal(id):
    item = Goal.query.get(id)
    if not item:
        return jsonify({"error": "Goal not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Goal deleted"})


# ---------------------- REMINDERS ---------------------------

@app.route("/getReminders")
def get_reminders():
    items = Reminder.query.all()
    return jsonify([
        {
            "id": r.id,
            "text": r.text,
            "date": r.date,
            "time": r.time,
            "repeat": r.repeat
        } for r in items
    ])

@app.route("/addReminder", methods=["POST"])
def add_reminder():
    data = request.get_json()

    new = Reminder(
        text=data["text"],
        date=data["date"],
        time=data["time"],
        repeat=data["repeat"]
    )
    db.session.add(new)
    db.session.commit()

    return jsonify({"message": "Reminder added"}), 201

@app.route("/deleteReminder/<int:id>", methods=["DELETE"])
def delete_reminder(id):
    item = Reminder.query.get(id)
    if not item:
        return jsonify({"error": "Reminder not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Reminder deleted"})


# -------------------------------------------------------------------
#                       RUN SERVER
# -------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
