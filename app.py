from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import pyodbc
from datetime import datetime
from dotenv import load_dotenv
from decimal import Decimal
import json
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Credenciales de usuario
SERVER = os.getenv('DB_SERVER')
USER = os.getenv('DB_USER')
PASSWORD = os.getenv('DB_PASSWORD')

# Nombre de las bases de datos
PBA_DATABASE = os.getenv('DB_PBA')
PROD_DATABASE = os.getenv('DB_PROD')

def get_db_connection(database):
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={SERVER};'
            f'DATABASE={database};'
            f'UID={USER};'
            f'PWD={PASSWORD}'
        )
        return conn
    except pyodbc.Error as e:
        print("Error al conectar a la base de datos:", e)
        return None

@app.route('/api/sqlQuery', methods=['POST'])
def sqlQuery():
    data = request.get_json()
    query = data.get('query')
    use_prod_db = data.get('use_prod_db', False)

    database = PROD_DATABASE if use_prod_db else PBA_DATABASE
    conn = get_db_connection(database)
    if not conn:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]

        for row in result:
            for key, value in row.items():
                if isinstance(value, str):
                    row[key] = value.strip()
                elif isinstance(value, datetime):
                    row[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    row[key] = float(value)

    except pyodbc.Error as e:
        print("Error al ejecutar la consulta:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    # Convert result to JSON string with ordered keys
    result_json = json.dumps(result, ensure_ascii=False)
    return Response(result_json, mimetype='application/json')

@app.route('/api/sqlLog', methods=['POST'])
def sqlLog():
    data = request.get_json()
    num_logs = data.get('num_logs', 1)
    recent = data.get('recent', True)
    use_prod_db = data.get('use_prod_db', False)
    file = data.get('file', None)

    order_by = 'DESC' if recent else 'ASC'
    xamppPath = "C:\\xampp\\htdocs\\en-trega\\"

    if file:
        query = f"SELECT TOP {num_logs} * FROM _log_error_sql WHERE CAST(archivo AS varchar(max)) = '{xamppPath}{file}' ORDER BY id {order_by}"
    else:
        query = f"SELECT TOP {num_logs} * FROM _log_error_sql ORDER BY id {order_by}"

    database = PBA_DATABASE if use_prod_db else PROD_DATABASE
    conn = get_db_connection(database)

    if not conn:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]

        for row in result:
            for key, value in row.items():
                if isinstance(value, str):
                    row[key] = value.strip()
                elif isinstance(value, datetime):
                    row[key] = value.isoformat()
    except pyodbc.Error as e:
        print("Error al ejecutar la consulta:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    result_json = json.dumps(result)
    return Response(result_json, mimetype='application/json')

@app.route('/api/tableInfo', methods=['GET'])
def get_table_help():
    data = request.get_json()
    table = data.get('table')
    column = data.get('column', None)
    use_prod_db = data.get('use_prod_db', False)

    if not table:
        return jsonify({"error": "Falta el parámetro 'table'"}), 400

    database = PBA_DATABASE if use_prod_db else PROD_DATABASE
    conn = get_db_connection(database)
    if not conn:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        with conn.cursor() as cursor:
            if column:
                query = f"""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'
                """
            else:
                query = f"""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '{table}'
                """
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            result = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            fields = []
            for row in result:
                field_info = {
                    "Nombre_Columna": row.get("COLUMN_NAME"),
                    "Tipo": row.get("DATA_TYPE"),
                    "Longitud": row.get("CHARACTER_MAXIMUM_LENGTH"),
                    "Nulo": "Si" if row.get("IS_NULLABLE") == "YES" else "No"
                }
                fields.append(field_info)
    except pyodbc.Error as e:
        print("Error al ejecutar la consulta:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    result = json.dumps(fields)
    return Response(result, mimetype='application/json')

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "OK"})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6891)
