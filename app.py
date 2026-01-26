import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import ARRAY

load_dotenv()

app = Flask(__name__)

# ---------------- DATABASE ----------------

uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ---------------- MODELS ----------------

class Task(db.Model):
    __tablename__ = "tasks"
    task_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task = db.Column(db.Text, nullable=False)
    tags = db.Column(ARRAY(db.Text), default=list)
    target_date = db.Column(db.Date)
    note = db.Column(db.Text)
    status = db.Column(db.Text, default="not started")


class Goal(db.Model):
    __tablename__ = "goals"
    goal_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal = db.Column(db.Text, nullable=False)
    priority = db.Column(db.Text)
    target_date = db.Column(db.Date)


class Reminder(db.Model):
    __tablename__ = "reminders"
    reminder_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reminder = db.Column(db.Text, nullable=False)
    remind_time = db.Column(db.Time)
    remind_date = db.Column(db.Date)
    repeat_frequency = db.Column(db.Text)


class Habit(db.Model):
    __tablename__ = "habits"
    habit_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    habit = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.Text)
    completed_dates = db.Column(ARRAY(db.Date), default=list)

# ---------------- ROUTES ----------------

@app.route("/")
def home():
    return render_template("mdindex.html")

# ---------------- TASKS ----------------

@app.route("/getTasks")
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        "id": t.task_id,
        "text": t.task,
        "tags": t.tags or [],
        "date": t.target_date.isoformat() if t.target_date else None,
        "note": t.note,
        "status": t.status
    } for t in tasks])


@app.route("/addTask", methods=["POST"])
def add_task():
    data = request.get_json()
    new = Task(
        task=data["text"],
        tags=[data["tags"]] if isinstance(data.get("tags"), str) else data.get("tags", []),
        target_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None,
        status=data.get("status", "not started")
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateTask/<task_id>", methods=["PUT"])
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    if "text" in data:
        task.task = data["text"]
    if "status" in data:
        task.status = data["status"]
    if "tags" in data:
        task.tags = data["tags"] if isinstance(data["tags"], list) else [data["tags"]]
    if "date" in data:
        task.target_date = datetime.strptime(data["date"], "%Y-%m-%d").date() if data["date"] else None

    db.session.commit()
    return jsonify({"success": True})


@app.route("/deleteTask/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True})

# ---------------- GOALS ----------------

@app.route("/getGoals")
def get_goals():
    goals = Goal.query.all()
    return jsonify([{
        "id": g.goal_id,
        "text": g.goal,
        "priority": g.priority,
        "date": g.target_date.isoformat() if g.target_date else None
    } for g in goals])


@app.route("/addGoal", methods=["POST"])
def add_goal():
    data = request.get_json()
    new = Goal(
        goal=data["text"],
        priority=data.get("priority", "medium"),
        target_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateGoal/<goal_id>", methods=["PUT"])
def update_goal(goal_id):
    goal = db.session.get(Goal, goal_id)
    if not goal:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    if "text" in data:
        goal.goal = data["text"]
    if "priority" in data:
        goal.priority = data["priority"]
    if "date" in data:
        goal.target_date = datetime.strptime(data["date"], "%Y-%m-%d").date() if data["date"] else None

    db.session.commit()
    return jsonify({"success": True})


@app.route("/deleteGoal/<goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    goal = db.session.get(Goal, goal_id)
    if not goal:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"success": True})

# ---------------- REMINDERS ----------------

@app.route("/getReminders")
def get_reminders():
    reminders = Reminder.query.all()
    return jsonify([{
        "id": r.reminder_id,
        "text": r.reminder,
        "date": r.remind_date.isoformat() if r.remind_date else None,
        "time": r.remind_time.isoformat() if r.remind_time else None,
        "repeat": r.repeat_frequency
    } for r in reminders])


@app.route("/addReminder", methods=["POST"])
def add_reminder():
    data = request.get_json()
    new = Reminder(
        reminder=data["text"],
        remind_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None,
        remind_time=datetime.strptime(data["time"], "%H:%M").time() if data.get("time") else None,
        repeat_frequency=data.get("repeat", "NONE")
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateReminder/<reminder_id>", methods=["PUT"])
def update_reminder(reminder_id):
    r = db.session.get(Reminder, reminder_id)
    if not r:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    if "text" in data:
        r.reminder = data["text"]
    if "date" in data:
        r.remind_date = datetime.strptime(data["date"], "%Y-%m-%d").date() if data["date"] else None
    if "time" in data:
        r.remind_time = datetime.strptime(data["time"], "%H:%M").time() if data["time"] else None
    if "repeat" in data:
        r.repeat_frequency = data["repeat"]

    db.session.commit()
    return jsonify({"success": True})


@app.route("/deleteReminder/<reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    r = db.session.get(Reminder, reminder_id)
    if not r:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(r)
    db.session.commit()
    return jsonify({"success": True})

# ---------------- HABITS ----------------

@app.route("/getHabits")
def get_habits():
    habits = Habit.query.all()
    return jsonify([{
        "id": h.habit_id,
        "text": h.habit,
        "frequency": h.frequency,
        "completed_dates": [d.isoformat() for d in (h.completed_dates or [])]
    } for h in habits])


@app.route("/addHabit", methods=["POST"])
def add_habit():
    data = request.get_json()
    new = Habit(
        habit=data["text"],
        frequency=data.get("frequency", "Daily"),
        completed_dates=[]
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/toggleHabit/<habit_id>", methods=["POST"])
def toggle_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h:
        return jsonify({"error": "Not found"}), 404

    today = datetime.utcnow().date()
    dates = h.completed_dates or []

    if today in dates:
        dates.remove(today)
    else:
        dates.append(today)

    h.completed_dates = dates
    db.session.commit()
    return jsonify({"success": True})


@app.route("/deleteHabit/<habit_id>", methods=["DELETE"])
def delete_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(h)
    db.session.commit()
    return jsonify({"success": True})

@app.route("/updateHabit/<habit_id>", methods=["PUT"])
def update_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    if "text" in data:
        h.habit = data["text"]
    if "frequency" in data:
        h.frequency = data["frequency"]

    db.session.commit()
    return jsonify({"success": True})

# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True)
