import os
from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

app = Flask(__name__)

# Neon uses 'postgresql', but sometimes URIs start with 'postgres'
# This fix ensures compatibility with SQLAlchemy
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.route('/')
def home():
    return render_template("mdindex.html")
   

if __name__ == '__main__':
    app.run(debug=True)