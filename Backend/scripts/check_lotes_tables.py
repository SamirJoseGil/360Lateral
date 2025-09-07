"""
Script para verificar si las tablas de la app 'lotes' existen en la base de datos.
"""
import os
import sys
import django
import psycopg2
from psycopg2 import sql
import configparser

# Configurar Django - usar la configuración principal
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

def get_db_config():
    """Obtener configuración de la base de datos desde Django settings"""
    databases = settings.DATABASES
    if 'default' not in databases:
        print("Error: No se encontró la configuración de base de datos predeterminada.")
        sys.exit(1)
        
    db_config = databases['default']
    
    # Extraer valores relevantes
    config = {
        'dbname': db_config.get('NAME'),
        'user': db_config.get('USER'),
        'password': db_config.get('PASSWORD'),
        'host': db_config.get('HOST') or 'localhost',
        'port': db_config.get('PORT') or '5432',
    }
    
    return config

def check_lotes_tables():
    """Verifica si las tablas de la app 'lotes' existen en la base de datos"""
    db_config = get_db_config()
    
    try:
        # Conectar a la base de datos
        print(f"Conectando a la base de datos {db_config['dbname']} en {db_config['host']}...")
        conn = psycopg2.connect(
            dbname=db_config['dbname'],
            user=db_config['user'],
            password=db_config['password'],
            host=db_config['host'],
            port=db_config['port']
        )
        
        # Crear un cursor para ejecutar consultas
        cursor = conn.cursor()
        
        # Consultar las tablas con prefijo 'lotes_'
        print("\nBuscando tablas de la app 'lotes'...")
        cursor.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_name LIKE %s AND table_schema = 'public'",
            ('lotes_%',)
        )
        
        # Obtener resultados
        tables = cursor.fetchall()
        
        if not tables:
            print("\n❌ No se encontraron tablas para la app 'lotes'.")
            print("   Esto confirma el problema: las tablas no existen.")
            print("   Ejecuta 'python apply_migrations.py' para crear las tablas.")
        else:
            print(f"\n✅ Se encontraron {len(tables)} tablas para la app 'lotes':")
            for table in tables:
                print(f"   - {table[0]}")
                
            # Verificar específicamente la tabla lotes_lote
            if ('lotes_lote',) in tables:
                print("\n✅ La tabla 'lotes_lote' existe.")
                
                # Contar registros
                cursor.execute("SELECT COUNT(*) FROM lotes_lote")
                count = cursor.fetchone()[0]
                print(f"   Contiene {count} registros.")
                
                # Mostrar estructura si hay menos de 100 registros
                if count < 100:
                    print("\n🔍 Estructura de la tabla 'lotes_lote':")
                    cursor.execute(
                        "SELECT column_name, data_type FROM information_schema.columns "
                        "WHERE table_name = 'lotes_lote' ORDER BY ordinal_position"
                    )
                    for column in cursor.fetchall():
                        print(f"   - {column[0]}: {column[1]}")
            else:
                print("\n❌ La tabla 'lotes_lote' no existe, confirmando el error.")
                print("   Ejecuta 'python apply_migrations.py' para crear esta tabla.")
        
        # Cerrar conexión
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error al conectar o consultar la base de datos: {str(e)}")
        print("\nSugerencias para resolver el problema:")
        print("1. Verifica que la base de datos esté en ejecución")
        print("2. Confirma que las credenciales en settings sean correctas")
        print("3. Ejecuta 'python apply_migrations.py' para crear las tablas")

if __name__ == "__main__":
    check_lotes_tables()