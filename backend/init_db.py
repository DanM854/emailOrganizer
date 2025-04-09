from database import engine, Base

# Crea todas las tablas definidas en los modelos si no existen
Base.metadata.create_all(bind=engine)
print("Tablas creadas exitosamente.")
