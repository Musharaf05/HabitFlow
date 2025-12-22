from flask import Flask, render_template, jsonify, request
from db import get_db
import pymysql

app = Flask(__name__)

# ---------------------- Index Page ----------------------
@app.route("/")
def index():
    return render_template("mdindex.html")

# --------------------- Show Tables ----------------------
@app.route("/getTables", methods=["GET"])
def get_tables():
    db = get_db()
    cur = db.cursor()

    cur.execute("SHOW TABLES;")
    tables = [row[0] for row in cur.fetchall()]

    cur.close()
    db.close()

    return jsonify({"tables": tables}), 200

# ------------------------ GET TASKS ------------------------
@app.route("/getTasks", methods=["GET"])
def get_tasks():
    db = get_db()
    cur = db.cursor(pymysql.cursors.DictCursor)

    cur.execute("SELECT * FROM tasks")
    tasks = cur.fetchall()

    cur.close()
    db.close()

    return jsonify(tasks), 200

# ------------------------ ADD TASK ------------------------
@app.route("/addTask", methods=["POST"])
def add_task():
    data = request.get_json()

    text = data.get("text")
    tag = data.get("tag")
    date = data.get("date")
    status = "NOT STARTED"

    db = get_db()
    cur = db.cursor()

    sql = "INSERT INTO tasks (text, tag, date, status) VALUES (%s, %s, %s, %s)"
    cur.execute(sql, (text, tag, date, status))
    db.commit()

    cur.close()
    db.close()

    return jsonify({"message": "Task added"}), 201

if __name__ == "__main__":
    app.run(debug=True)