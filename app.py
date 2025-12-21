from flask import Flask, render_template, jsonify
from db import get_db

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

if __name__ == "__main__":
    app.run(debug=True)