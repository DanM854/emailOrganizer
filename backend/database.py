"""
Módulo para la configuración de la base de datos con SQLAlchemy en FastAPI.
Define la conexión a MySQL y el sistema de sesiones.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexión a la base de datos MySQL utilizando el driver pymysql
<<<<<<< HEAD
db_url = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@db/emailorganizer")
=======
db_url = os.getenv("DATABASE_URL", "mysql+pymysql://fastapi_user:fastapi_pass@mysql_db/fastapi_db")
>>>>>>> 8d69724f3c02767047dbf0481459aea4a899185c

# Crea la conexión con la base de datos
engine = create_engine(db_url)

# Configuración de la sesión para manejar transacciones en la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para los modelos de SQLAlchemy
Base = declarative_base()