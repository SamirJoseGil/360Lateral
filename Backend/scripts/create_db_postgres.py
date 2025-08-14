"""
Script para crear la base de datos PostgreSQL con configuración UTF-8
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Crea la base de datos lateral360 con configuración UTF-8"""
    
    # Configuración de conexión
    db_config = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': os.environ.get('DB_PORT', '5432'),
        'user': os.environ.get('DB_USER', 'postgres'),
        'password': os.environ.get('DB_PASSWORD', '1234'),
    }
    
    db_name = os.environ.get('DB_NAME', 'lateral360')
    
    try:
        # Conectar a PostgreSQL (base postgres)
        print(f"🔌 Conectando a PostgreSQL en {db_config['host']}:{db_config['port']}")
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database='postgres'  # Conectar a la DB por defecto
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Verificar si la base de datos existe
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()
        
        if exists:
            print(f"⚠️ Base de datos '{db_name}' ya existe. Eliminando...")
            
            # Terminar conexiones activas
            cursor.execute("""
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = %s AND pid <> pg_backend_pid()
            """, (db_name,))
            
            # Eliminar base de datos
            cursor.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
            print(f"🗑️ Base de datos '{db_name}' eliminada")
        
        # Crear base de datos con configuración UTF-8
        print(f"🏗️ Creando base de datos '{db_name}' con UTF-8...")
        cursor.execute(f'''
            CREATE DATABASE "{db_name}"
            WITH 
            OWNER = {db_config['user']}
            ENCODING = 'UTF8'
            LC_COLLATE = 'C'
            LC_CTYPE = 'C'
            TEMPLATE = template0
        ''')
        
        print(f"✅ Base de datos '{db_name}' creada exitosamente")
        
        # Verificar la configuración
        cursor.execute(f"SELECT datname, encoding, datcollate, datctype FROM pg_database WHERE datname = %s", (db_name,))
        result = cursor.fetchone()
        if result:
            print(f"📊 Configuración:")
            print(f"   Nombre: {result[0]}")
            print(f"   Encoding: {result[1]}")
            print(f"   Collate: {result[2]}")
            print(f"   Ctype: {result[3]}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)
