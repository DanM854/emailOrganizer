from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal, engine, Base
from models import User, Message
from sqlalchemy import text
from schemas import UserCreate, MessageCreate, MessageResponse, Token
import random
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os 
from fastapi.middleware.cors import CORSMiddleware  # Añade esto al inicio con los demás imports



# Crea las tablas en la base de datos (si no existen)
Base.metadata.create_all(bind=engine)

# Instancia de la aplicación FastAPI
app = FastAPI()

# Configuración CORS (AÑADE ESTO)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Angular en desarrollo
        "http://127.0.0.1:4200",  # Alternativa
        # Añade aquí otras URLs en producción
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos
    allow_headers=["*"],  # Permite todos los headers
)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# Configuración del contexto de cifrado para contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    """
    Obtiene una sesión de base de datos.
    Se asegura de cerrarla correctamente después de su uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Clave secreta para JWT
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no autorizado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    
@app.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en la base de datos.
    """
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario ya existe"
        )
    hashed_password = pwd_context.hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuario registrado exitosamente"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    """
    Prueba la conexión a la base de datos ejecutando una consulta simple.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Conexión a la base de datos exitosa"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rutas para mensajes

@app.post("/api/messages/", response_model=MessageResponse)
def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_message = Message(
        sender=current_user.username,
        content=message.content,
        category=message.category,
        user_id=current_user.id  # Usamos el id del token
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message




@app.get("/api/messages/history")
def get_message_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Obtiene el historial de mensajes de un usuario autenticado.
    """
    messages = db.query(Message).filter(Message.user_id == user.id).all()
    return {"history": messages}


@app.get("/api/messages/category")
def get_messages_by_category(category: str, db: Session = Depends(get_db)):
    """
    Obtiene mensajes filtrados por categoría.
    """
    messages = db.query(Message).filter(Message.category == category).all()
    return {"messages": messages}

@app.post("/api/extract/keywords")
def extract_keywords(sender: str, content: str):
    """
    Extrae palabras clave de un mensaje. Devuelve aquellas palabras de más de 5 caracteres.
    """
    words = content.split()
    keywords = [word for word in words if len(word) > 5]
    return {"sender": sender, "keywords": keywords}
@app.post("/api/messages/classify")
def classify_message(sender, content):
    if sender.startswith("+") and len(sender) > 10:
        message_type = "whatsapp"
    else:
        message_type = "SMS"
    
    return {"sender": sender, "classification": message_type, "content": content}

@app.get("/admin/users")
def get_users(admin_key: str, db: Session = Depends(get_db)):
    """
    Obtiene la lista de usuarios registrados solo si la clave es correcta.
    """
    SECRET_ADMIN_KEY = "clave_super_secreta"

    if admin_key != SECRET_ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Clave incorrecta, acceso denegado")

    users = db.query(User).all()
    return {"users": users}

@app.post("/messages/block")
def block_words(blocked_words: list[str], db: Session = Depends(get_db)):
    """
    Guarda una lista de palabras bloqueadas en la base de datos.
    """
    # Aquí podrías guardar las palabras bloqueadas en una tabla específica
    return {"message": "Palabras bloqueadas actualizadas", "blocked_words": blocked_words}

@app.get("/messages/filtered")
def get_filtered_messages(db: Session = Depends(get_db)):
    """
    Obtiene los mensajes que contienen palabras bloqueadas y los marca como restringidos.
    """
    blocked_words = ["spam", "fraude", "bloqueado"]  # Esta lista debería venir de la BD
    messages = db.query(Message).all()

    filtered_messages = [
        msg for msg in messages if any(word in msg.content.lower() for word in blocked_words)
    ]

    return {"filtered_messages": filtered_messages}

@app.get("/api/messages/user/{user_id}")
def get_user_messages(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todos los mensajes de un usuario específico ordenados por fecha.
    """
    messages = db.query(Message).filter(Message.user_id == user_id).order_by(Message.created_at.desc()).all()
    return {"user_id": user_id, "messages": messages}

SPAM_KEYWORDS = ["oferta", "ganador", "descuento", "dinero", "gratis"]

@app.post("/api/messages/spam-check")
def check_spam_message(content: str):
    """
    Analiza si un mensaje contiene palabras clave de spam.
    """
    is_spam = any(word in content.lower() for word in SPAM_KEYWORDS)
    return {"content": content, "is_spam": is_spam}

@app.get("/api/messages/grouped")
def get_grouped_messages(db: Session = Depends(get_db)):
    """
    Organiza los mensajes en categorías basadas en su contenido.
    """
    categories = {
        "Trabajo": ["reunión", "proyecto", "deadline"],
        "Personal": ["familia", "amigo", "cumpleaños"],
        "Promociones": ["oferta", "descuento", "rebaja"]
    }

    grouped_messages = {"Trabajo": [], "Personal": [], "Promociones": [], "Otros": []}

    messages = db.query(Message).all()
    for msg in messages:
        assigned = False
        for category, keywords in categories.items():
            if any(word in msg.content.lower() for word in keywords):
                grouped_messages[category].append(msg)
                assigned = True
                break
        if not assigned:
            grouped_messages["Otros"].append(msg)

    return grouped_messages
