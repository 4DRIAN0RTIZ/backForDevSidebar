from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pyodbc
from datetime import datetime
from decimal import Decimal
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Nombre de las bases de datos
PBA_DATABASE = os.getenv('DB_PBA')
PROD_DATABASE = os.getenv('DB_PROD')
SERVER = os.getenv('DB_SERVER')

# Lista de usuarios no permitidos
USUARIOS_NO_PERMITIDOS = ["Entrega"]

def get_db_connection(database, user, password):
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={SERVER};'
            f'DATABASE={database};'
            f'UID={user};'
            f'PWD={password};'
        )
        return conn
    except pyodbc.Error as e:
        print("Error al conectar a la base de datos:", e)
        return None

@app.route('/api/sqlQuery', methods=['POST'])
def sqlQuery():
    data = request.get_json()
    query = data.get('query')
    user = data.get('user')
    password = data.get('password')
    use_prod_db = True

    if not user or not password:
        return jsonify({"error": "Credenciales no proporcionadas correctamente."}), 400

    if user in USUARIOS_NO_PERMITIDOS:
        return jsonify({"error": f"El usuario '{user}' no está permitido."}), 403

    database = PROD_DATABASE if use_prod_db else PBA_DATABASE
    conn = get_db_connection(database, user, password)
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

    result_json = json.dumps(result, ensure_ascii=False)
    return Response(result_json, mimetype='application/json')

@app.route('/api/sqlLog', methods=['POST'])
def sqlLog():
    data = request.get_json()
    num_logs = data.get('num_logs', 1)
    recent = data.get('recent', True)
    use_prod_db = data.get('use_prod_db', False)
    file = data.get('file', None)
    user = data.get('user')
    password = data.get('password')

    if not user or not password:
        return jsonify({"error": "Credenciales no proporcionadas correctamente."}), 400

    if user in USUARIOS_NO_PERMITIDOS:
        return jsonify({"error": f"El usuario '{user}' no está permitido."}), 403

    order_by = 'DESC' if recent else 'ASC'
    xamppPath = "C:\\xampp\\htdocs\\en-trega\\"

    if file:
        query = f"SELECT TOP {num_logs} * FROM _log_error_sql WHERE CAST(archivo AS varchar(max)) = '{xamppPath}{file}' ORDER BY id {order_by}"
    else:
        query = f"SELECT TOP {num_logs} * FROM _log_error_sql ORDER BY id {order_by}"

    database = PBA_DATABASE if use_prod_db else PROD_DATABASE
    conn = get_db_connection(database, user, password)

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
    user = data.get('user')
    password = data.get('password')

    if not user or not password:
        return jsonify({"error": "Credenciales no proporcionadas correctamente."}), 400

    if user in USUARIOS_NO_PERMITIDOS:
        return jsonify({"error": f"El usuario '{user}' no está permitido."}), 403

    if not table:
        return jsonify({"error": "Falta el parámetro 'table'"}), 400

    database = PBA_DATABASE if use_prod_db else PROD_DATABASE
    conn = get_db_connection(database, user, password)
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

@app.route('/api/infoTicket', methods=['POST'])
def get_info_ticket():
    data = request.get_json()
    ticket = data.get('ticket')
    use_prod_db = data.get('use_prod_db', False)
    user = data.get('user')
    password = data.get('password')
    base_link = "https://erp.en-trega.com/en-trega/sis_ticket_sistema.php?accion=editar&id="
    ticket_link = f"{base_link}{ticket}"

    if not user or not password:
        return jsonify({"error": "Credenciales no proporcionadas correctamente."}), 400

    if user in USUARIOS_NO_PERMITIDOS:
        return jsonify({"error": f"El usuario '{user}' no está permitido."}), 403

    if not ticket:
        return jsonify({"error": "Falta el parámetro 'ticket'"}), 400

    database = PBA_DATABASE if use_prod_db else PROD_DATABASE
    conn = get_db_connection(database, user, password)
    if not conn:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        with conn.cursor() as cursor:
            query = f"""
                SELECT
                    ts.id,
                    CASE
                        WHEN DATALENGTH(ts.problema_actual) > 0 THEN ts.problema_actual
                        WHEN DATALENGTH(ts.comentario) > 0 THEN ts.comentario
                        ELSE ''
                    END AS problematica,
                    u.nombre,
                    ts.tipo,
                    ts.fecha_proceso,
                    CASE
                        WHEN DATEDIFF(MINUTE, ts.fecha_proceso, GETDATE()) < 60 THEN CAST(DATEDIFF(MINUTE, ts.fecha_proceso, GETDATE()) AS VARCHAR) + ' minutos'
                        WHEN DATEDIFF(HOUR, ts.fecha_proceso, GETDATE()) < 24 THEN 
                            CAST(DATEDIFF(HOUR, ts.fecha_proceso, GETDATE()) AS VARCHAR) + ' horas ' +
                            CAST(DATEDIFF(MINUTE, ts.fecha_proceso, GETDATE()) % 60 AS VARCHAR) + ' minutos'
                        ELSE CAST(DATEDIFF(DAY, ts.fecha_proceso, GETDATE()) AS VARCHAR) + ' días'
                    END AS tiempo_transcurrido
                FROM
                    _ticket_sistema ts
                JOIN _usuarios u
                    ON ts.login = u.login
                WHERE
                    ts.id = {ticket}
                    and ts.status IN ('En Proceso', 'En Pruebas')
            """

            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            result = [dict(zip(columns, row)) for row in cursor.fetchall()]

            for row in result:
                for key, value in row.items():
                    if isinstance(value, str):
                        row[key] = value.strip()
                    elif isinstance(value, datetime):
                        row[key] = value.isoformat()
                row["ticket_link"] = ticket_link

    except pyodbc.Error as e:
        print("Error al ejecutar la consulta:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    result = json.dumps(result)
    return Response(result, mimetype='application/json')


@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "OK"})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6891)
