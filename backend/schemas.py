from pydantic import BaseModel

# Esquemas para usuario
class UserBase(BaseModel):
    """
    Modelo base para los datos del usuario.
    """
    username: str

class UserCreate(UserBase):
    """
    Modelo para la creación de un usuario.
    """
    password: str

class UserResponse(UserBase):
    """
    Modelo de respuesta para un usuario.
    """
    class Config:
        from_attributes = True

# Esquemas para mensajes
class MessageBase(BaseModel):
    sender: str
    content: str
    category: str = "unknown"
    user_id: int

class MessageCreate(BaseModel):
    """
    Modelo para la creación de un mensaje.
    Se omite el user_id, ya que se obtiene del usuario autenticado.
    """
    content: str
    category: str = "unknown"

class MessageResponse(MessageBase):
    """
    Modelo de respuesta para un mensaje.
    """
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
