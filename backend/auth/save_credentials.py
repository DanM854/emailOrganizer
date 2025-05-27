from flask import Blueprint, request, jsonify
import os
import requests
import sqlite3
from backend.db.init_db import DB_PATH

credentials_bp = Blueprint('credentials', __name__)

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

TOKEN_EXPIRY_HOURS = 1  # Horas que dura el token, se usa en la DB


@credentials_bp.route("/auth/google/callback")
def oauth_callback():
    code = request.args.get("code")
    user_id = request.args.get("userId")  # Debes pasar esto desde el frontend

    if not code or not user_id:
        return jsonify({"error": "Missing code or userId"}), 400

    # Paso 1: Solicitar tokens a Google
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    try:
        response = requests.post(token_url, data=token_data)
        response.raise_for_status()
        tokens = response.json()
    except requests.RequestException as e:
        print(f"Error solicitando tokens a Google: {e}")
        return jsonify({"error": "Error al obtener tokens de Google"}), 500

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    id_token = tokens.get("id_token")

    if not access_token:
        return jsonify({"error": "No access token returned"}), 400

    # Paso 2: Obtener el email del usuario usando el access_token
    try:
        email_resp = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        email_resp.raise_for_status()
        user_info = email_resp.json()
    except requests.RequestException as e:
        print(f"Error obteniendo info del usuario: {e}")
        return jsonify({"error": "No se pudo obtener la información del usuario"}), 500

    email = user_info.get("email")
    if not email:
        return jsonify({"error": "No se pudo obtener el email del usuario"}), 400

    # Paso 3: Guardar en la base de datos solo si no existe ya la cuenta vinculada
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM linked_accounts WHERE user_id = ? AND email = ?", 
                (user_id, email)
            )
            if cursor.fetchone():
                print(f"Cuenta ya vinculada para user_id={user_id}, email={email}")
                return jsonify({
                    "success": True,
                    "email": email,
                    "message": "Cuenta ya vinculada."
                })

            cursor.execute('''
                INSERT INTO linked_accounts (user_id, email, access_token, refresh_token, token_expiry)
                VALUES (?, ?, ?, ?, datetime('now', '+' || ? || ' hour'))
            ''', (user_id, email, access_token, refresh_token, TOKEN_EXPIRY_HOURS))
            conn.commit()

        print(f"Cuenta vinculada correctamente para user_id={user_id}, email={email}")
        return jsonify({
            "success": True,
            "email": email,
            "message": "Cuenta vinculada correctamente."
        })

    except sqlite3.Error as e:
        print(f"Error en la base de datos: {e}")
        return jsonify({"error": "Error interno en la base de datos"}), 500
