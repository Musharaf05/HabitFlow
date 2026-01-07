import os
from flask import Flask, render_template, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")

# --- FIX NEON DATABASE URL ---
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -------------------------------------------------------------------
#                           MODELS (MATCHING NEON DB)
# -------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"
    
    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accent_color = db.Column(db.Text, default='blue')


class Task(db.Model):
    __tablename__ = "tasks"
    
    task_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    task = db.Column(db.Text, nullable=False)
    tags = db.Column(db.ARRAY(db.Text))
    target_date = db.Column(db.Date)
    note = db.Column(db.Text)
    status = db.Column(db.Text, default='not started')
    created_date = db.Column(db.DateTime, default=datetime.utcnow)


class Goal(db.Model):
    __tablename__ = "goals"
    
    goal_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    goal = db.Column(db.Text, nullable=False)
    priority = db.Column(db.Text)
    target_date = db.Column(db.Date)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)


class Reminder(db.Model):
    __tablename__ = "reminders"
    
    reminder_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    reminder = db.Column(db.Text, nullable=False)
    remind_time = db.Column(db.Time)
    remind_date = db.Column(db.Date)
    repeat_frequency = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)


class Habit(db.Model):
    __tablename__ = "habits"
    
    habit_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    habit = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.Text)
    completed_dates = db.Column(db.ARRAY(db.Date), default=[])

# -------------------------------------------------------------------
#                           HELPER FUNCTIONS
# -------------------------------------------------------------------

def get_current_user_id():
    """Get current user ID from session. For now, return None to skip user filtering."""
    # TODO: Implement proper authentication
    # Returning None will make queries work without user_id filtering
    return session.get('user_id', None)

def ensure_default_user():
    """Create a default user if it doesn't exist"""
    default_uuid = "00000000-0000-0000-0000-000000000001"
    user = db.session.get(User, default_uuid)
    if not user:
        user = User(
            user_id=default_uuid,
            username="default_user",
            email="default@example.com",
            password_hash="not-used-yet"
        )
        db.session.add(user)
        db.session.commit()
    return default_uuid

# -------------------------------------------------------------------
#                           ROUTES
# -------------------------------------------------------------------

@app.route("/")
def home():
    return render_template("mdindex.html")


# ---------------------- TASKS ---------------------------

@app.route("/getTasks")
def get_tasks():
    user_id = ensure_default_user()  # Use default user
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": t.task_id,
            "text": t.task,
            "tags": t.tags or [],
            "date": t.target_date.isoformat() if t.target_date else None,
            "note": t.note,
            "status": t.status,
            "created_date": t.created_date.isoformat() if t.created_date else None
        } for t in tasks
    ])

@app.route("/addTask", methods=["POST"])
def add_task():
    data = request.get_json()
    user_id = ensure_default_user()  # Use default user
    
    # Parse date if provided
    target_date = None
    if data.get("date"):
        try:
            target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    
    # Handle tags - convert single tag to array
    tags = data.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]
    
    new = Task(
        user_id=user_id,
        task=data["text"],
        tags=tags,
        target_date=target_date,
        note=data.get("note", ""),
        status=data.get("status", "not started")
    )
    db.session.add(new)
    db.session.commit()
    
    return jsonify({"message": "Task added", "id": new.task_id}), 201

@app.route("/updateTask/<task_id>", methods=["PUT"])
def update_task(task_id):
    user_id = ensure_default_user()  # Use default user
    task = db.session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        task.task = data["text"]
    if "tags" in data:
        tags = data["tags"]
        if isinstance(tags, str):
            tags = [tags]
        task.tags = tags
    if "date" in data:
        try:
            task.target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    if "note" in data:
        task.note = data["note"]
    if "status" in data:
        task.status = data["status"]
    
    db.session.commit()
    return jsonify({"message": "Task updated"})

@app.route("/deleteTask/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    user_id = ensure_default_user()  # Use default user
    task = db.session.get(Task, task_id)
    
    if not task or task.user_id != user_id:
        return jsonify({"error": "Task not found"}), 404
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})


# ---------------------- GOALS ---------------------------

@app.route("/getGoals")
def get_goals():
    user_id = ensure_default_user()  # Use default user
    goals = Goal.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": g.goal_id,
            "text": g.goal,
            "priority": g.priority,
            "date": g.target_date.isoformat() if g.target_date else None,
            "created_date": g.created_date.isoformat() if g.created_date else None
        } for g in goals
    ])

@app.route("/addGoal", methods=["POST"])
def add_goal():
    data = request.get_json()
    user_id = ensure_default_user()  # Use default user
    
    target_date = None
    if data.get("date"):
        try:
            target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    
    new = Goal(
        user_id=user_id,
        goal=data["text"],
        priority=data.get("priority", "medium"),
        target_date=target_date
    )
    db.session.add(new)
    db.session.commit()
    
    return jsonify({"message": "Goal added", "id": new.goal_id}), 201

@app.route("/updateGoal/<goal_id>", methods=["PUT"])
def update_goal(goal_id):
    user_id = ensure_default_user()  # Use default user
    goal = db.session.get(Goal, goal_id)
    
    if not goal or goal.user_id != user_id:
        return jsonify({"error": "Goal not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        goal.goal = data["text"]
    if "priority" in data:
        goal.priority = data["priority"]
    if "date" in data:
        try:
            goal.target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    
    db.session.commit()
    return jsonify({"message": "Goal updated"})

@app.route("/deleteGoal/<goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    user_id = ensure_default_user()  # Use default user
    goal = db.session.get(Goal, goal_id)
    
    if not goal or goal.user_id != user_id:
        return jsonify({"error": "Goal not found"}), 404
    
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"})


# ---------------------- REMINDERS ---------------------------

@app.route("/getReminders")
def get_reminders():
    user_id = ensure_default_user()  # Use default user
    reminders = Reminder.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": r.reminder_id,
            "text": r.reminder,
            "date": r.remind_date.isoformat() if r.remind_date else None,
            "time": r.remind_time.isoformat() if r.remind_time else None,
            "repeat": r.repeat_frequency,
            "created_date": r.created_date.isoformat() if r.created_date else None
        } for r in reminders
    ])

@app.route("/addReminder", methods=["POST"])
def add_reminder():
    data = request.get_json()
    user_id = ensure_default_user()  # Use default user
    
    remind_date = None
    if data.get("date"):
        try:
            remind_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    
    remind_time = None
    if data.get("time"):
        try:
            remind_time = datetime.strptime(data["time"], "%H:%M").time()
        except:
            pass
    
    new = Reminder(
        user_id=user_id,
        reminder=data["text"],
        remind_date=remind_date,
        remind_time=remind_time,
        repeat_frequency=data.get("repeat", "NONE")
    )
    db.session.add(new)
    db.session.commit()
    
    return jsonify({"message": "Reminder added", "id": new.reminder_id}), 201

@app.route("/updateReminder/<reminder_id>", methods=["PUT"])
def update_reminder(reminder_id):
    user_id = ensure_default_user()  # Use default user
    reminder = db.session.get(Reminder, reminder_id)
    
    if not reminder or reminder.user_id != user_id:
        return jsonify({"error": "Reminder not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        reminder.reminder = data["text"]
    if "date" in data:
        try:
            reminder.remind_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except:
            pass
    if "time" in data:
        try:
            reminder.remind_time = datetime.strptime(data["time"], "%H:%M").time()
        except:
            pass
    if "repeat" in data:
        reminder.repeat_frequency = data["repeat"]
    
    db.session.commit()
    return jsonify({"message": "Reminder updated"})

@app.route("/deleteReminder/<reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    user_id = ensure_default_user()  # Use default user
    reminder = db.session.get(Reminder, reminder_id)
    
    if not reminder or reminder.user_id != user_id:
        return jsonify({"error": "Reminder not found"}), 404
    
    db.session.delete(reminder)
    db.session.commit()
    return jsonify({"message": "Reminder deleted"})


# ---------------------- HABITS ---------------------------

@app.route("/getHabits")
def get_habits():
    user_id = ensure_default_user()  # Use default user
    habits = Habit.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": h.habit_id,
            "text": h.habit,
            "frequency": h.frequency,
            "completed_dates": [d.isoformat() for d in (h.completed_dates or [])]
        } for h in habits
    ])

@app.route("/addHabit", methods=["POST"])
def add_habit():
    data = request.get_json()
    user_id = ensure_default_user()  # Use default user
    
    new = Habit(
        user_id=user_id,
        habit=data["text"],
        frequency=data.get("frequency", "Daily"),
        completed_dates=[]
    )
    db.session.add(new)
    db.session.commit()
    
    return jsonify({"message": "Habit added", "id": new.habit_id}), 201

@app.route("/updateHabit/<habit_id>", methods=["PUT"])
def update_habit(habit_id):
    user_id = ensure_default_user()  # Use default user
    habit = db.session.get(Habit, habit_id)
    
    if not habit or habit.user_id != user_id:
        return jsonify({"error": "Habit not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        habit.habit = data["text"]
    if "frequency" in data:
        habit.frequency = data["frequency"]
    if "completed_dates" in data:
        dates = []
        for d in data["completed_dates"]:
            try:
                dates.append(datetime.strptime(d, "%Y-%m-%d").date())
            except:
                pass
        habit.completed_dates = dates
    
    db.session.commit()
    return jsonify({"message": "Habit updated"})

@app.route("/toggleHabit/<habit_id>", methods=["POST"])
def toggle_habit(habit_id):
    """Toggle habit completion for today"""
    user_id = ensure_default_user()  # Use default user
    habit = db.session.get(Habit, habit_id)
    
    if not habit or habit.user_id != user_id:
        return jsonify({"error": "Habit not found"}), 404
    
    today = datetime.now().date()
    completed_dates = habit.completed_dates or []
    
    if today in completed_dates:
        completed_dates.remove(today)
    else:
        completed_dates.append(today)
    
    habit.completed_dates = completed_dates
    db.session.commit()
    
    return jsonify({"message": "Habit toggled", "completed": today in completed_dates})

@app.route("/deleteHabit/<habit_id>", methods=["DELETE"])
def delete_habit(habit_id):
    user_id = ensure_default_user()  # Use default user
    habit = db.session.get(Habit, habit_id)
    
    if not habit or habit.user_id != user_id:
        return jsonify({"error": "Habit not found"}), 404
    
    db.session.delete(habit)
    db.session.commit()
    return jsonify({"message": "Habit deleted"})


# -------------------------------------------------------------------
#                       RUN SERVER
# -------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)