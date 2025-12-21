import pymysql

def get_db():
    return pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="m@2005",
        database="habitflow"
    )