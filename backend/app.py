import os
import secrets
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from backend.auth.authenticate import auth_bp
from backend.auth.save_credentials import credentials_bp
import resend
import redis

# Cargar variables de entorno
load_dotenv()

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para frontend

# Configuración de Resend
resend_api_key = os.getenv("RESEND_API_KEY")
if not resend_api_key:
    raise ValueError("RESEND_API_KEY no está configurada en las variables de entorno.")
resend_client = resend.Resend(api_key=resend_api_key)

sender_email = os.getenv("SENDER_EMAIL")
if not sender_email:
    raise ValueError("SENDER_EMAIL no está configurada en las variables de entorno.")

# Configuración de Redis
redis_url = os.getenv("REDIS_URL")
if not redis_url:
    raise ValueError("REDIS_URL no está configurada en las variables de entorno.")

try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()
    print("Conexión a Redis exitosa!")
except redis.exceptions.ConnectionError as e:
    print(f"Error al conectar a Redis: {e}")
    raise e

# Helpers para Redis
def get_otp_key(user_id):
    return f"otp:{user_id}"

OTP_EXPIRY_SECONDS = 5 * 60  # 5 minutos

# Endpoint para solicitar código 2FA
@app.route('/request-2fa', methods=['POST'])
def request_2fa():
    data = request.json
    user_id = data.get('userId')
    user_email = data.get('userEmail')

    if not user_id or not user_email:
        return jsonify({"success": False, "message": "userId y userEmail son requeridos"}), 400

    try:
        otp_code = str(secrets.randbelow(1000000)).zfill(6)
        otp_key = get_otp_key(user_id)
        redis_client.set(otp_key, otp_code, ex=OTP_EXPIRY_SECONDS)
        print(f"Código OTP para {user_id}: {otp_code}")

        result = resend_client.emails.send({
            "from": f"Tu Aplicación <{sender_email}>",
            "to": user_email,
            "subject": "Tu Código de Verificación de Doble Factor",
            "html": f"""
                <html>
                <body>
                    <h1>Código de Verificación</h1>
                    <p>Usa este código para completar tu inicio de sesión:</p>
                    <h2>{otp_code}</h2>
                    <p>Expira en {OTP_EXPIRY_SECONDS // 60} minutos.</p>
                </body>
                </html>
            """
        })

        if result and 'id' in result:
            return jsonify({"success": True, "message": "Código enviado al correo electrónico."}), 200
        else:
            redis_client.delete(otp_key)
            return jsonify({"success": False, "message": "Error al enviar el código."}), 500

    except Exception as e:
        redis_client.delete(otp_key)
        return jsonify({"success": False, "message": f"Error al enviar el código: {e}"}), 500

# Endpoint para verificar código 2FA
@app.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    data = request.json
    user_id = data.get('userId')
    entered_code = data.get('code')

    if not user_id or not entered_code:
        return jsonify({"success": False, "message": "userId y code son requeridos"}), 400

    otp_key = get_otp_key(user_id)
    stored_code = redis_client.get(otp_key)

    if not stored_code:
        return jsonify({"success": False, "message": "Código inválido o expirado."}), 400

    if secrets.compare_digest(entered_code.encode(), stored_code.encode()):
        redis_client.delete(otp_key)
        return jsonify({"success": True, "verified": True, "message": "Verificación exitosa."}), 200
    else:
        return jsonify({"success": False, "message": "Código inválido."}), 400

# Registrar blueprints para autenticación y credenciales
app.register_blueprint(auth_bp)
app.register_blueprint(credentials_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
