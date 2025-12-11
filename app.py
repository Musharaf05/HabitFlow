from flask import Flask, render_template, request, jsonify
from db import get_db

app = Flask(__name__)


# ------------------ HOME ------------------
@app.route("/")
def index():
    return render_template("mdindex.html")


# ------------------ GET ALL DATA ------------------
@app.route("/api/get_data")
def get_data():
    db = get_db()
    cur = db.cursor()

    # TASKS
    cur.execute("SELECT id, text, status, tag, date FROM tasks")
    tasks = [
        {"id": row[0], "text": row[1], "status": row[2],
         "tag": row[3], "date": row[4]}
        for row in cur.fetchall()
    ]

    # GOALS
    cur.execute("SELECT id, text, priority, date FROM goals")
    goals = [
        {"id": row[0], "text": row[1], "priority": row[2], "date": row[3]}
        for row in cur.fetchall()
    ]

    # REMINDERS
    cur.execute("SELECT id, text, date, time, repeat_option FROM reminders")
    reminders = [
        {"id": row[0], "text": row[1], "date": row[2],
         "time": row[3], "repeat": row[4]}
        for row in cur.fetchall()
    ]

    return jsonify({"tasks": tasks, "goals": goals, "reminders": reminders})


# ------------------ SAVE CHANGES ------------------
@app.route("/api/update", methods=["POST"])
def update():
    incoming = request.get_json()

    db = get_db()
    cur = db.cursor()

    # CLEAR OLD DATA
    cur.execute("DELETE FROM tasks")
    cur.execute("DELETE FROM goals")
    cur.execute("DELETE FROM reminders")

    # INSERT TASKS
    for t in incoming["tasks"]:
        cur.execute(
            "INSERT INTO tasks (id, text, status, tag, date) VALUES (%s, %s, %s, %s, %s)",
            (t["id"], t["text"], t["status"], t["tag"], t["date"])
        )

    # INSERT GOALS
    for g in incoming["goals"]:
        cur.execute(
            "INSERT INTO goals (id, text, priority, date) VALUES (%s, %s, %s, %s)",
            (g["id"], g["text"], g["priority"], g["date"])
        )

    # INSERT REMINDERS
    for r in incoming["reminders"]:
        cur.execute(
            "INSERT INTO reminders (id, text, date, time, repeat_option) VALUES (%s, %s, %s, %s, %s)",
            (r["id"], r["text"], r["date"], r["time"], r["repeat"])
        )

    db.commit()
    return jsonify({"status": "saved"})
