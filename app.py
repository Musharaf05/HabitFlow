import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# --- 1. SETUP & CONFIG ---
load_dotenv()
app = Flask(__name__)

# Neon/Postgres URI Fix
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- 2. MODELS (Tables) ---

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    is_done = db.Column(db.Boolean, default=False)

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    # One Goal can have multiple Reminders
    reminders = db.relationship('Reminder', backref='goal', cascade="all, delete-orphan")

class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    note = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    goal_id = db.Column(db.Integer, db.ForeignKey('goal.id'), nullable=False)

# Create all tables in Neon
with app.app_context():
    db.create_all()

# --- 3. API ROUTES ---
# ----Home Page--------
@app.route("/")
def index():
        return render_template("mdindex.html")

# --- TASKS CRUD ---
@app.route('/tasks', methods=['GET', 'POST'])
def manage_tasks():
    if request.method == 'POST':
        data = request.get_json()
        new_task = Task(content=data['content'])
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"msg": "Task Created"}), 201
    
    tasks = Task.query.all()
    return jsonify([{"id": t.id, "content": t.content, "done": t.is_done} for t in tasks])

# --- GOALS & REMINDERS CRUD ---
@app.route('/goals', methods=['GET', 'POST'])
def manage_goals():
    if request.method == 'POST':
        data = request.get_json()
        new_goal = Goal(title=data['title'])
        db.session.add(new_goal)
        db.session.commit()
        return jsonify({"msg": "Goal Created", "id": new_goal.id}), 201
    
    goals = Goal.query.all()
    # We return the goal AND its nested reminders
    result = []
    for g in goals:
        result.append({
            "id": g.id,
            "title": g.title,
            "reminders": [{"id": r.id, "note": r.note} for r in g.reminders]
        })
    return jsonify(result)

@app.route('/goals/<int:goal_id>/reminders', methods=['POST'])
def add_reminder(goal_id):
    data = request.get_json()
    # Ensure the goal exists first
    goal = Goal.query.get_or_404(goal_id)
    new_rem = Reminder(note=data['note'], goal_id=goal.id)
    db.session.add(new_rem)
    db.session.commit()
    return jsonify({"msg": "Reminder Added to Goal"}), 201

# --- DELETE ACTIONS ---
@app.route('/cleanup/<string:type>/<int:id>', methods=['DELETE'])
def cleanup(type, id):
    if type == 'task':
        item = Task.query.get_or_404(id)
    elif type == 'goal':
        item = Goal.query.get_or_404(id)
    else:
        return jsonify({"error": "Invalid type"}), 400
    
    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": f"{type} deleted"})

if __name__ == '__main__':
    app.run(debug=True)