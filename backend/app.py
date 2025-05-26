import os
import secrets

import redis
import resend
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Cargar variables de entorno
load_dotenv()

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Configurar CORS


# --- Configuración de Resend ---
resend_api_key = os.getenv("RESEND_API_KEY")
if not resend_api_key:
    raise ValueError(
        "RESEND_API_KEY no está configurada en las variables de entorno."
    )
# Corrección: resend es un módulo, su clase principal es Resend
resend_client = resend.Resend(api_key=resend_api_key)

sender_email = os.getenv("SENDER_EMAIL")
if not sender_email:
    raise ValueError(
        "SENDER_EMAIL no está configurada en las variables de entorno."
    )


# --- Configuración de Redis ---
redis_url = os.getenv("REDIS_URL")
if not redis_url:
    raise ValueError(
        "REDIS_URL no está configurada en las variables de entorno."
    )

# Conectar a Redis
# Usar decode_responses=True para obtener strings en lugar de bytes
try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    # Opcional: verificar la conexión
    redis_client.ping()
    print("Conexión a Redis exitosa!")
except redis.exceptions.ConnectionError as e:
    print(f"Error al conectar a Redis: {e}")
    # En producción, es probable que quieras que la aplicación falle
    # si no puede conectar a la DB/Cache
    # raise e


# --- Helpers para Redis ---
# Clave para almacenar el código OTP para un usuario
def get_otp_key(user_id: str) -> str:
    """
    Genera la clave de Redis para almacenar el código OTP de un usuario.

    Args:
        user_id (str): El ID único del usuario.

    Returns:
        str: La clave de Redis con formato "otp:{user_id}".
    """
    return f"otp:{user_id}"


# Tiempo de expiración del código en segundos
OTP_EXPIRY_SECONDS = 5 * 60  # 5 minutos


# --- Endpoint para solicitar el código 2FA ---
@app.route('/request-2fa', methods=['POST'])
def request_2fa():
    """
    Solicita un código de verificación de doble factor (2FA), lo genera,
    lo almacena en Redis y lo envía al correo electrónico del usuario.
    """
    data = request.json
    user_id = data.get('userId')
    user_email = data.get('userEmail')

    if not user_id or not user_email:
        return jsonify(
            {"success": False, "message": "userId y userEmail son requeridos"}
        ), 400

    # En un escenario real, verificarías si el user_id existe en tu
    # base de datos principal y obtendrías el user_email asociado
    # de forma segura para evitar enumeración de usuarios.

    try:
        # 1. Generar un código OTP seguro de 6 dígitos
        otp_code = str(secrets.randbelow(1000000)).zfill(6)

        # 2. Almacenar el código en Redis con expiración automática
        otp_key = get_otp_key(user_id)
        # Guardamos el código en Redis. EX (expire) establece el tiempo de vida
        # en segundos.
        redis_client.set(otp_key, otp_code, ex=OTP_EXPIRY_SECONDS)
        print(f"Código generado para {user_id}: {otp_code}. "
              "Almacenado en Redis con expiración.")

        # 3. Enviar el código por correo usando Resend
        try:
            result = resend_client.emails.send({
                "from": f"Tu Aplicación <{sender_email}>",
                "to": user_email,
                "subject": "Tu Código de Verificación de Doble Factor",
                "html": f"""
                <html>
                <body>
                    <h1>Código de Verificación</h1>
                    <p>Hola,</p>
                    <p>Usa el siguiente código para completar tu inicio de sesión:</p>
                    <h2>{otp_code}</h2>
                    <p>Este código expirará en {OTP_EXPIRY_SECONDS // 60} minutos.</p>
                    <p>Si no solicitaste este código, ignora este correo.</p>
                </body>
                </html>
                """
            })
            # print(f"Respuesta de Resend: {result}") # Descomentar para ver la respuesta completa de Resend

            # Resend exitoso devuelve un objeto con 'id' y 'from'
            if result and 'id' in result:
                return jsonify(
                    {"success": True,
                     "message": "Código enviado al correo electrónico."}
                ), 200
            else:
                # Manejar casos donde Resend no lanza excepción pero la respuesta
                # no es la esperada
                print("Resend no reportó error pero la respuesta fue inesperada: "
                      f"{result}")
                # Limpiar código si el envío parece fallido aunque no hubo excepción
                redis_client.delete(otp_key)
                return jsonify(
                    {"success": False,
                     "message": "Error al enviar el código. Intenta de nuevo."}
                ), 500

        except Exception as e:
            print(f"Error al enviar correo con Resend: {e}")
            # Limpiar el código almacenado si falla el envío
            # para evitar códigos "huérfanos"
            redis_client.delete(otp_key)
            return jsonify(
                {"success": False, "message": f"Error al enviar el código: {e}"}
            ), 500

    except Exception as e:
        print(f"Error general en /request-2fa: {e}")
        return jsonify(
            {"success": False,
             "message": f"Ocurrió un error al procesar la solicitud: {e}"}
        ), 500


# --- Endpoint para verificar el código 2FA ---
@app.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """
    Verifica el código de doble factor (2FA) proporcionado por el usuario
    contra el código almacenado en Redis.
    """
    data = request.json
    user_id = data.get('userId')
    entered_code = data.get('code')

    if not user_id or not entered_code:
        return jsonify(
            {"success": False, "message": "userId y code son requeridos"}
        ), 400

    # --- Aquí podrías implementar la lógica de contador de intentos fallidos
    # con Redis ---
    # Esto es CRÍTICO para prevenir ataques de fuerza bruta.
    # Ejemplo conceptual:
    # MAX_ATTEMPTS = 5
    # FAILED_ATTEMPTS_COOLDOWN_SECONDS = 15 * 60 # 15 minutos
    # failed_attempts_key = f"2fa:failed:{user_id}"
    # current_attempts = redis_client.get(failed_attempts_key)
    # if current_attempts and int(current_attempts) >= MAX_ATTEMPTS:
    #     return jsonify({"success": False,
    #                     "message": "Demasiados intentos fallidos. "
    #                                "Intenta más tarde."}), 429
    # ---------------------------------------------------------------------

    # 1. Obtener el código almacenado de Redis
    otp_key = get_otp_key(user_id)
    stored_code = redis_client.get(otp_key)  # Devuelve None si no existe o ya expiró

    if not stored_code:
        print(f"Intento de verificación para {user_id} - "
              "Código no encontrado o expirado en Redis.")
        # --- Incrementar contador de intentos fallidos si aplica ---
        # redis_client.incr(failed_attempts_key)
        # redis_client.expire(FAILED_ATTEMPTS_COOLDOWN_SECONDS) # Opcional
        # -----------------------------------------------------------
        return jsonify(
            {"success": False, "message": "Código inválido o ha expirado."}
        ), 400

    # 2. Comparar el código ingresado con el almacenado de forma segura
    # secrets.compare_digest previene ataques de temporización (timing attacks)
    if secrets.compare_digest(
        entered_code.encode('utf-8'), stored_code.encode('utf-8')
    ):
        print(f"Verificación 2FA exitosa para {user_id}.")
        # 3. Eliminar el código de Redis después de una verificación
        # exitosa (IMPORTANTE)
        redis_client.delete(otp_key)
        # --- Resetear contador de intentos fallidos si aplica ---
        # redis_client.delete(failed_attempts_key)
        # ---------------------------------------------------------
        # Aquí marcarías al usuario como 2FA verificado en tu sistema
        # de autenticación principal
        return jsonify(
            {"success": True, "verified": True, "message": "Verificación exitosa."}
        ), 200
    else:
        print(f"Intento de verificación para {user_id} - Código incorrecto.")
        # --- Incrementar contador de intentos fallidos si aplica ---
        # redis_client.incr(failed_attempts_key)
        # redis_client.expire(FAILED_ATTEMPTS_COOLDOWN_SECONDS) # Opcional
        # -----------------------------------------------------------
        return jsonify(
            {"success": False, "message": "Código inválido."}
        ), 400


# --- Ejecutar la aplicación ---
if __name__ == '__main__':
    # NUNCA usar debug=True en producción. Expone información sensible.
    # Usa un servidor WSGI (Gunicorn, uWSGI) para producción.
    # Ejemplo para producción: app.run(host='0.0.0.0', port=5000)
    app.run(debug=True, port=5000)  # Para desarrollo local
    