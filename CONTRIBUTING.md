# Guía de Contribución - Lateral 360°

## Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Estándares de Código](#estándares-de-código)
4. [Proceso de Pull Request](#proceso-de-pull-request)
5. [Estructura de Commits](#estructura-de-commits)
6. [Testing](#testing)
7. [Documentación](#documentación)

## Código de Conducta

Este proyecto se adhiere a un código de conducta profesional. Al participar, se espera que mantengas este código.

### Nuestros Estándares

- Uso de lenguaje acogedor e inclusivo
- Respeto a diferentes puntos de vista y experiencias
- Aceptación de crítica constructiva
- Enfoque en lo que es mejor para la comunidad
- Empatía hacia otros miembros de la comunidad

## Cómo Contribuir

### Reportar Bugs

Antes de crear un reporte de bug:
- Verifica si el bug ya ha sido reportado
- Asegúrate de que es un bug real y reproducible
- Recopila información detallada sobre el bug

Incluye en tu reporte:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del entorno (OS, versión, etc.)

### Sugerir Mejoras

Las sugerencias de mejoras son bienvenidas. Incluye:
- Descripción clara de la mejora
- Justificación de por qué es útil
- Ejemplos de uso
- Posible implementación

### Tu Primera Contribución

Busca issues etiquetados con:
- `good first issue` - Ideal para principiantes
- `help wanted` - Issues donde necesitamos ayuda
- `documentation` - Mejoras a la documentación

## Estándares de Código

### Python (Backend)

Seguimos PEP 8 con algunas modificaciones:

```python
# Buenas prácticas

# 1. Imports organizados
import os
import sys

from django.db import models
from rest_framework import serializers

from apps.users.models import User


# 2. Docstrings completos
def calcular_area(ancho: float, largo: float) -> float:
    """
    Calcula el área de un rectángulo.
    
    Args:
        ancho: Ancho del rectángulo en metros
        largo: Largo del rectángulo en metros
        
    Returns:
        float: Área en metros cuadrados
        
    Raises:
        ValueError: Si ancho o largo son negativos
    """
    if ancho < 0 or largo < 0:
        raise ValueError("Las dimensiones no pueden ser negativas")
    return ancho * largo


# 3. Type hints
from typing import List, Dict, Optional

def obtener_usuarios(role: str = None) -> List[Dict[str, any]]:
    """Obtiene lista de usuarios filtrados por rol"""
    queryset = User.objects.all()
    if role:
        queryset = queryset.filter(role=role)
    return list(queryset.values())


# 4. Nombres descriptivos
def es_lote_disponible(lote: Lote) -> bool:
    """Verifica si un lote está disponible para venta"""
    return lote.status == 'active' and lote.owner is not None
```

### TypeScript (Frontend)

Seguimos las guías de TypeScript y React:

```typescript
// Buenas prácticas

// 1. Tipos explícitos
interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'developer';
}

// 2. Componentes funcionales con hooks
export function UserCard({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Side effects
  }, [user.id]);
  
  return (
    <div className="user-card">
      {user.email}
    </div>
  );
}

// 3. Manejo de errores
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// 4. Validación de tipos
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### SQL

```sql
-- Buenas prácticas

-- 1. Nombres descriptivos en snake_case
CREATE TABLE user_lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    lote_cbml VARCHAR(14) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices apropiados
CREATE INDEX idx_user_lotes_user_id ON user_lotes(user_id);
CREATE INDEX idx_user_lotes_cbml ON user_lotes(lote_cbml);

-- 3. Constraints claros
ALTER TABLE user_lotes
ADD CONSTRAINT fk_user_lotes_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;
```

## Proceso de Pull Request

### Antes de Crear el PR

1. **Fork el repositorio**
2. **Crea una rama con nombre descriptivo**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   git checkout -b fix/corregir-bug
   git checkout -b docs/actualizar-readme
   ```

3. **Realiza tus cambios**
4. **Ejecuta los tests**
   ```bash
   # Backend
   python manage.py test
   
   # Frontend
   npm test
   ```

5. **Actualiza documentación si es necesario**

### Crear el Pull Request

1. **Título claro y descriptivo**
   ```
   feat: Agregar búsqueda por dirección en lotes
   fix: Corregir validación de CBML
   docs: Actualizar README con nuevos endpoints
   ```

2. **Descripción completa**
   ```markdown
   ## Descripción
   Breve descripción de los cambios
   
   ## Motivación
   Por qué son necesarios estos cambios
   
   ## Cambios
   - Lista de cambios específicos
   - Otro cambio
   
   ## Tests
   Cómo se probaron los cambios
   
   ## Screenshots (si aplica)
   Imágenes mostrando los cambios
   
   ## Checklist
   - [ ] Tests pasan
   - [ ] Documentación actualizada
   - [ ] Código formateado
   - [ ] Sin warnings
   ```

3. **Asigna revisores**
4. **Vincula issues relacionados**

### Proceso de Revisión

- Los revisores darán feedback
- Realiza cambios solicitados
- Una vez aprobado, se hará merge
- La rama será eliminada automáticamente

## Estructura de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos de Commits

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

### Ejemplos

```bash
# Feature
git commit -m "feat(lotes): agregar búsqueda por dirección"

# Fix
git commit -m "fix(auth): corregir validación de email"

# Docs
git commit -m "docs(readme): actualizar instrucciones de instalación"

# Breaking change
git commit -m "feat(api)!: cambiar estructura de respuesta de login

BREAKING CHANGE: La respuesta ahora incluye un objeto 'data'"
```

## Testing

### Backend Testing

```python
# tests/test_example.py
from django.test import TestCase
from apps.users.models import User

class UserModelTest(TestCase):
    """Tests para el modelo User"""
    
    def setUp(self):
        """Configuración inicial para cada test"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='owner'
        )
    
    def test_user_creation(self):
        """Test creación de usuario"""
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.is_owner)
    
    def test_user_str(self):
        """Test representación string del usuario"""
        self.assertIn(self.user.email, str(self.user))
    
    def tearDown(self):
        """Limpieza después de cada test"""
        self.user.delete()
```

### Frontend Testing

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Coverage Requirements

- Mínimo 80% de cobertura para nuevo código
- 100% para funciones críticas
- Tests tanto unitarios como de integración

## Documentación

### Documentar Código

```python
# Python
def funcion_compleja(param1: str, param2: int = 0) -> dict:
    """
    Descripción breve de la función.
    
    Descripción más detallada si es necesaria.
    Puede incluir múltiples párrafos.
    
    Args:
        param1: Descripción del parámetro 1
        param2: Descripción del parámetro 2 (opcional)
        
    Returns:
        dict: Descripción del valor retornado
        {
            'key1': 'descripción',
            'key2': 'descripción'
        }
        
    Raises:
        ValueError: Cuando param1 está vacío
        TypeError: Cuando param2 no es un número
        
    Example:
        >>> funcion_compleja('test', 5)
        {'result': 'test5'}
    """
    pass
```

```typescript
// TypeScript
/**
 * Descripción breve de la función.
 * 
 * Descripción más detallada si es necesaria.
 * 
 * @param param1 - Descripción del parámetro 1
 * @param param2 - Descripción del parámetro 2 (opcional)
 * @returns Descripción del valor retornado
 * @throws {Error} Cuando param1 está vacío
 * 
 * @example
 * ```typescript
 * const result = funcionCompleja('test', 5);
 * console.log(result); // { result: 'test5' }
 * ```
 */
function funcionCompleja(param1: string, param2: number = 0): object {
  // Implementation
}
```

### README de Módulos

Cada módulo debe tener su README.md con:
- Descripción del módulo
- Características principales
- API/Endpoints
- Ejemplos de uso
- Tests
- Troubleshooting

## Agradecimientos

Gracias por contribuir a Lateral 360°. Tu trabajo ayuda a mejorar la plataforma para todos los usuarios.

## Preguntas

Si tienes preguntas, puedes:
- Abrir un issue con la etiqueta `question`
- Contactar al equipo de desarrollo
- Revisar la documentación existente
