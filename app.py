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

@app.route("/updateTask/<int:id>", methods=["PUT"])
def update_task(id):
    task = db.session.get(Task, id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        task.text = data["text"]
    if "tag" in data:
        task.tag = data["tag"]
    if "date" in data:
        task.date = data["date"]
    if "status" in data:
        task.status = data["status"]
    
    db.session.commit()
    return jsonify({"message": "Task updated"})

@app.route("/deleteTask/<int:id>", methods=["DELETE"])
def delete_task(id):
    item = db.session.get(Task, id)
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

@app.route("/updateGoal/<int:id>", methods=["PUT"])
def update_goal(id):
    goal = db.session.get(Goal, id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        goal.text = data["text"]
    if "priority" in data:
        goal.priority = data["priority"]
    if "date" in data:
        goal.date = data["date"]
    
    db.session.commit()
    return jsonify({"message": "Goal updated"})

@app.route("/deleteGoal/<int:id>", methods=["DELETE"])
def delete_goal(id):
    item = db.session.get(Goal, id)
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

@app.route("/updateReminder/<int:id>", methods=["PUT"])
def update_reminder(id):
    reminder = db.session.get(Reminder, id)
    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        reminder.text = data["text"]
    if "date" in data:
        reminder.date = data["date"]
    if "time" in data:
        reminder.time = data["time"]
    if "repeat" in data:
        reminder.repeat = data["repeat"]
    
    db.session.commit()
    return jsonify({"message": "Reminder updated"})

@app.route("/deleteReminder/<int:id>", methods=["DELETE"])
def delete_reminder(id):
    item = db.session.get(Reminder, id)
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