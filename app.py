import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid
from sqlalchemy.dialects.postgresql import ARRAY, UUID
import json
from firebase_admin import credentials, messaging, initialize_app

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-this-to-secret-key")

# Database
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# ============== MODELS ==============

class User(UserMixin, db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    accent_color = db.Column(db.Text, default='blue')
    
    def get_id(self):
        return self.user_id
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Task(db.Model):
    __tablename__ = "tasks"
    task_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    task = db.Column(db.Text, nullable=False)
    tags = db.Column(ARRAY(db.Text), default=list)
    target_date = db.Column(db.Date)
    note = db.Column(db.Text)
    status = db.Column(db.Text, default="not started")


class Goal(db.Model):
    __tablename__ = "goals"
    goal_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    goal = db.Column(db.Text, nullable=False)
    priority = db.Column(db.Text)
    target_date = db.Column(db.Date)


class Reminder(db.Model):
    __tablename__ = "reminders"
    reminder_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    reminder = db.Column(db.Text, nullable=False)
    remind_time = db.Column(db.Time)
    remind_date = db.Column(db.Date)
    repeat_frequency = db.Column(db.Text)
    sent = db.Column(db.Boolean, default=False)

class FCMToken(db.Model):
    __tablename__ = "fcm_tokens"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True))  # ← UUID type!
    token = db.Column(db.String(500), unique=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

class Habit(db.Model):
    __tablename__ = "habits"
    habit_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    habit = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.Text)
    completed_dates = db.Column(ARRAY(db.Date), default=list)

# ============== LOGIN MANAGER ==============

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, user_id)

# ============== AUTH ROUTES ==============

@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email").lower()
        password = request.form.get("password")
        
        # Validate
        if not username or not email or not password:
            flash("All fields are required", "error")
            return render_template("signup.html")
        
        if len(password) < 8:
            flash("Password must be at least 8 characters", "error")
            return render_template("signup.html")
        
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email already registered", "error")
            return render_template("signup.html")
        
        # Create user
        new_user = User(
            username=username,
            email=email
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Auto login
        login_user(new_user)
        flash("Account created successfully!", "success")
        return redirect(url_for('dashboard'))
    
    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == "POST":
        email = request.form.get("email").lower()
        password = request.form.get("password")
        remember = request.form.get("remember") == "on"
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash("Invalid email or password", "error")
    
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out successfully", "success")
    return redirect(url_for('login'))

@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("mdindex.html", username=current_user.username)

# ============== TASKS ==============

@app.route("/getTasks")
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.user_id).all()
    return jsonify([{
        "id": t.task_id,
        "text": t.task,
        "tags": t.tags or [],
        "date": t.target_date.isoformat() if t.target_date else None,
        "note": t.note,
        "status": t.status
    } for t in tasks])


@app.route("/addTask", methods=["POST"])
@login_required
def add_task():
    data = request.get_json()
    new = Task(
        user_id=current_user.user_id,
        task=data["text"],
        tags=[data["tags"]] if isinstance(data.get("tags"), str) else data.get("tags", []),
        target_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None,
        status=data.get("status", "not started")
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateTask/<task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if not task or task.user_id != current_user.user_id:
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
@login_required
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if not task or task.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True})

# ============== GOALS ==============

@app.route("/getGoals")
@login_required
def get_goals():
    goals = Goal.query.filter_by(user_id=current_user.user_id).all()
    return jsonify([{
        "id": g.goal_id,
        "text": g.goal,
        "priority": g.priority,
        "date": g.target_date.isoformat() if g.target_date else None
    } for g in goals])


@app.route("/addGoal", methods=["POST"])
@login_required
def add_goal():
    data = request.get_json()
    new = Goal(
        user_id=current_user.user_id,
        goal=data["text"],
        priority=data.get("priority", "medium"),
        target_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateGoal/<goal_id>", methods=["PUT"])
@login_required
def update_goal(goal_id):
    goal = db.session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.user_id:
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
@login_required
def delete_goal(goal_id):
    goal = db.session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"success": True})

# ============== REMINDERS ==============

@app.route("/getReminders")
@login_required
def get_reminders():
    reminders = Reminder.query.filter_by(user_id=current_user.user_id).all()
    return jsonify([{
        "id": r.reminder_id,
        "text": r.reminder,
        "date": r.remind_date.isoformat() if r.remind_date else None,
        "time": r.remind_time.isoformat() if r.remind_time else None,
        "repeat": r.repeat_frequency
    } for r in reminders])


@app.route("/addReminder", methods=["POST"])
@login_required
def add_reminder():
    data = request.get_json()
    new = Reminder(
        user_id=current_user.user_id,
        reminder=data["text"],
        remind_date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None,
        remind_time=datetime.strptime(data["time"], "%H:%M").time() if data.get("time") else None,
        repeat_frequency=data.get("repeat", "NONE")
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateReminder/<reminder_id>", methods=["PUT"])
@login_required
def update_reminder(reminder_id):
    r = db.session.get(Reminder, reminder_id)
    if not r or r.user_id != current_user.user_id:
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
@login_required
def delete_reminder(reminder_id):
    r = db.session.get(Reminder, reminder_id)
    if not r or r.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(r)
    db.session.commit()
    return jsonify({"success": True})

# ============== HABITS ==============

@app.route("/getHabits")
@login_required
def get_habits():
    habits = Habit.query.filter_by(user_id=current_user.user_id).all()
    return jsonify([{
        "id": h.habit_id,
        "text": h.habit,
        "frequency": h.frequency,
        "completed_dates": [d.isoformat() for d in (h.completed_dates or [])]
    } for h in habits])


@app.route("/addHabit", methods=["POST"])
@login_required
def add_habit():
    data = request.get_json()
    new = Habit(
        user_id=current_user.user_id,
        habit=data["text"],
        frequency=data.get("frequency", "Daily"),
        completed_dates=[]
    )
    db.session.add(new)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/updateHabit/<habit_id>", methods=["PUT"])
@login_required
def update_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h or h.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}

    if "text" in data:
        h.habit = data["text"]
    if "frequency" in data:
        h.frequency = data["frequency"]

    db.session.commit()
    return jsonify({"success": True})


@app.route("/toggleHabit/<habit_id>", methods=["POST"])
@login_required
def toggle_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h or h.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    today = datetime.now(timezone.utc).date()
    dates = list(h.completed_dates or [])

    if today in dates:
        dates.remove(today)
    else:
        dates.append(today)

    h.completed_dates = dates
    db.session.commit()
    return jsonify({"success": True})


@app.route("/deleteHabit/<habit_id>", methods=["DELETE"])
@login_required
def delete_habit(habit_id):
    h = db.session.get(Habit, habit_id)
    if not h or h.user_id != current_user.user_id:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(h)
    db.session.commit()
    return jsonify({"success": True})

# Add this with your other @app.route definitions
@app.route('/firebase-messaging-sw.js')
def serve_firebase_sw():
    """Serve Firebase service worker from root"""
    from flask import send_from_directory
    import os
    root_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(root_dir, 'firebase-messaging-sw.js')

# ============================================================================
# FCM BACKEND CODE - FIXED WITH USER-SPECIFIC NOTIFICATIONS

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate('./serviceAccountKey.json')
    initialize_app(cred)
    print("✅ Firebase Admin SDK initialized")
except Exception as e:
    print(f"❌ Firebase Admin SDK initialization failed: {e}")

# ============================================================================
# FCM ROUTES (User-specific)
# ============================================================================

@app.route("/save-fcm-token", methods=["POST"])
@login_required
def save_fcm_token():
    """Save FCM token with user_id"""
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Token required"}), 400
    
    try:
        # Check if token already exists for this user
        existing = FCMToken.query.filter_by(token=token).first()
        
        if existing:
            # Update user_id if token exists
            existing.user_id = current_user.user_id
            existing.updated_at = datetime.now(timezone.utc)
            print(f"✅ FCM token updated for user {current_user.username}")
        else:
            # Create new token with user_id
            new_token = FCMToken(
                user_id=current_user.user_id,
                token=token
            )
            db.session.add(new_token)
            print(f"✅ New FCM token saved for user {current_user.username}")
        
        db.session.commit()
        return jsonify({"message": "Token saved successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error saving FCM token: {e}")
        return jsonify({"error": "Failed to save token"}), 500


@app.route("/test-fcm", methods=["POST"])
@login_required
def test_fcm():
    """Test FCM notifications for current user"""
    data = request.get_json() if request.is_json else {}
    title = data.get("title", "🧪 FCM Test")
    body = data.get("body", "If you see this, FCM is working!")
    
    try:
        # Send notification only to current user
        result = send_fcm_notification_to_user(
            user_id=current_user.user_id,
            title=title,
            body=body,
            reminder_id=None
        )
        
        if result:
            return jsonify({
                "message": "Test notification sent",
                "success_count": result.success_count if result else 0,
                "failure_count": result.failure_count if result else 0
            }), 200
        else:
            return jsonify({"message": "No tokens found for user"}), 200
            
    except Exception as e:
        print(f"❌ Test FCM error: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# HELPER FUNCTIONS (User-specific)
# ============================================================================

def send_fcm_notification_to_user(user_id, title, body, reminder_id):
    """Send FCM notification to a specific user's devices"""
    try:
        # Get all tokens for this specific user
        tokens = FCMToken.query.filter_by(user_id=user_id).all()
        
        if not tokens:
            print(f"⚠️ No FCM tokens for user {user_id}")
            return None
        
        token_strings = [t.token for t in tokens]
        print(f"📤 Sending to {len(token_strings)} device(s) for user {user_id}")
        
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={'reminderId': str(reminder_id) if reminder_id else ''},
            tokens=token_strings,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/static/checklist_16688556.png',
                    badge='/static/checklist_16688556.png',
                    vibrate=[200, 100, 200],
                    require_interaction=True
                )
            )
        )
        
        # FIXED: Use send_each_for_multicast instead of send_multicast
        response = messaging.send_each_for_multicast(message)
        print(f"✅ Sent: {response.success_count} | ❌ Failed: {response.failure_count}")
        
        # Clean up failed tokens
        if response.failure_count > 0:
            failed_tokens = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    failed_tokens.append(token_strings[idx])
            
            if failed_tokens:
                FCMToken.query.filter(FCMToken.token.in_(failed_tokens)).delete(synchronize_session=False)
                db.session.commit()
                print(f"🗑️ Removed {len(failed_tokens)} invalid token(s)")
        
        return response
        
    except Exception as e:
        print(f"❌ Error sending FCM notification: {e}")
        return None


def check_and_send_reminders():
    """Background job - check ALL users' reminders"""
    with app.app_context():
        try:
            now = datetime.now()
            current_date = now.date()
            current_time = now.strftime('%H:%M')

            print(f"🕐 Checking reminders at {current_time} on {current_date}")

            reminders = Reminder.query.filter_by(
                remind_date=current_date,
                sent=False
            ).all()

            if not reminders:
                return

            for reminder in reminders:
                if reminder.remind_time is None:
                    continue

                reminder_time = reminder.remind_time.strftime('%H:%M')

                if reminder_time == current_time:
                    response = send_fcm_notification_to_user(
                        user_id=reminder.user_id,
                        title="🔔 HabitFlow Reminder",
                        body=reminder.reminder,
                        reminder_id=reminder.reminder_id
                    )

                    reminder.sent = True
                    db.session.commit()

                    if response:
                        print(f"✅ Notification sent for reminder {reminder.reminder_id}")
                    else:
                        print(f"⚠️ No FCM tokens for user {reminder.user_id}")

        except Exception as e:
            print(f"❌ Error in check_and_send_reminders: {e}")

def convert_to_12h(time_24):
    """Convert 24-hour time to 12-hour format"""
    parts = time_24.split(':')
    hour = int(parts[0])
    minute = parts[1]
    ampm = 'PM' if hour >= 12 else 'AM'
    hour = hour % 12 or 12
    return f"{hour}:{minute} {ampm}"


# ============================================================================
# SCHEDULER SETUP
# ============================================================================

from apscheduler.schedulers.background import BackgroundScheduler
import atexit

scheduler = BackgroundScheduler()
scheduler.add_job(
    func=check_and_send_reminders,
    trigger="interval",
    seconds=10,  # Check every 10 seconds
    id='reminder_checker',
    name='Check reminders every 10 seconds',
    replace_existing=True
)

scheduler.start()
print("✅ APScheduler started - checking reminders every 10 seconds")

# Shutdown scheduler when app stops
atexit.register(lambda: scheduler.shutdown())

# ============== RUN ==============
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)