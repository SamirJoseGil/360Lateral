# 📦 Documentación de Types

Esta carpeta contiene las definiciones de tipos TypeScript utilizadas en toda la aplicación. Los tipos aseguran type-safety y mejor autocompletado en el IDE.

---

## 📑 Índice de Tipos

1. [lote.ts](#lotet) - Tipos relacionados con lotes

---

# 🏘️ lote.ts

**Propósito:** Definiciones de tipos para el modelo de Lote.

## Tipo Principal: `Lote`

```typescript
export interface Lote {
    // Identificadores
    id: string;
    nombre: string;
    direccion: string;
    
    // Identificación catastral
    cbml?: string;
    matricula?: string;
    codigo_catastral?: string;
    
    // Ubicación geográfica
    ciudad?: string;              // ✅ NUEVO
    barrio?: string;
    estrato?: number;
    latitud?: number;
    longitud?: number;
    
    // Características físicas
    area?: number;                // Área en m²
    
    // Características urbanísticas
    uso_suelo?: string;
    clasificacion_suelo?: string;
    tratamiento_pot?: string;
    descripcion?: string;
    
    // ✅ NUEVOS CAMPOS COMERCIALES
    valor?: number;               // Precio del lote
    forma_pago?: 'contado' | 'financiado' | 'permuta' | 'mixto';
    es_comisionista?: boolean;
    carta_autorizacion?: string;  // URL del archivo
    
    // Estado del lote
    status: 'pending' | 'active' | 'rejected' | 'archived';
    is_verified: boolean;
    rejection_reason?: string;
    
    // Relaciones
    owner?: string;               // ID del propietario
    owner_name?: string;
    
    // Metadatos
    metadatos?: Record<string, any>;
    created_at: string;
    updated_at: string;
    verified_at?: string;
    rejected_at?: string;
}
```

### Estados del Lote

#### `status`
```typescript
type LoteStatus = 
    | 'pending'    // Pendiente de validación
    | 'active'     // Activo y visible
    | 'rejected'   // Rechazado por admin
    | 'archived';  // Archivado
```

**Flujo de estados:**
```
pending → (admin valida) → active
pending → (admin rechaza) → rejected
active → (admin archiva) → archived
rejected → (admin reactiva) → active
archived → (admin reactiva) → active
```

#### `is_verified`
```typescript
is_verified: boolean; // Si el lote fue verificado por admin
```

### Identificación Catastral

#### `cbml`
**Código Base de Medellín para Lotes**
- Formato: 11 dígitos numéricos
- Ejemplo: `"01234567890"`
- Usado para consultar normativa POT en MapGIS

#### `matricula`
**Matrícula inmobiliaria**
- Identificador único del predio
- Formato variable según ciudad

#### `codigo_catastral`
**Código catastral nacional**
- Sistema IGAC (Instituto Geográfico Agustín Codazzi)

### Ubicación Geográfica

```typescript
// Coordenadas
latitud?: number;   // Ejemplo: 6.244203
longitud?: number;  // Ejemplo: -75.581215

// Ubicación administrativa
ciudad?: string;    // "Medellín", "Bogotá", etc.
barrio?: string;    // Nombre del barrio
estrato?: number;   // 1-6 (Colombia)
```

### Campos Comerciales ✅ NUEVO

#### `valor`
Precio del lote en pesos colombianos (COP).

```typescript
valor?: number; // Ejemplo: 500000000 (500 millones)
```

#### `forma_pago`
Modalidades de pago aceptadas.

```typescript
type FormaPago = 
    | 'contado'      // Pago de contado
    | 'financiado'   // Financiación bancaria
    | 'permuta'      // Intercambio por otro inmueble
    | 'mixto';       // Combinación de modalidades
```

#### `es_comisionista`
Indica si el propietario es un comisionista.

```typescript
es_comisionista?: boolean;

// Si true, debe adjuntar:
carta_autorizacion?: string; // URL del archivo PDF
```

### Características Urbanísticas

#### `uso_suelo`
Uso permitido del suelo según POT.

```typescript
// Valores comunes:
"Residencial"
"Comercial"
"Mixto"
"Industrial"
"Dotacional"
"Institucional"
```

#### `clasificacion_suelo`
Clasificación del suelo.

```typescript
// Valores posibles:
"Urbano"
"Rural"
"Expansión Urbana"
"Suburbano"
"Protección"
```

#### `tratamiento_pot`
Tratamiento urbanístico según Plan de Ordenamiento Territorial.

```typescript
// Ejemplos:
"Consolidación Nivel 1 (CN1)"
"Desarrollo"
"Renovación Urbana"
"Conservación"
"Mejoramiento Integral"
```

---

## Tipo: `CreateLoteData` ✅ NUEVO

Para creación de lotes desde formularios.

```typescript
export interface CreateLoteData {
    // Básicos
    nombre: string;
    direccion: string;
    ciudad?: string;              // ✅ NUEVO
    area?: number;
    
    // Identificación
    cbml?: string;
    matricula?: string;
    codigo_catastral?: string;
    
    // Ubicación
    barrio?: string;
    estrato?: number;
    descripcion?: string;
    uso_suelo?: string;
    clasificacion_suelo?: string;
    latitud?: number;
    longitud?: number;
    
    // ✅ NUEVOS CAMPOS COMERCIALES
    valor?: number;
    forma_pago?: string;          // Se convertirá a FormaPago
    es_comisionista?: boolean;
    carta_autorizacion?: File | null; // Archivo (no URL)
}
```

**Diferencias con `Lote`:**
- `carta_autorizacion` es `File` (no `string`)
- No incluye campos de estado (`status`, `is_verified`)
- No incluye metadatos del sistema (`created_at`, etc.)
- `forma_pago` es `string` (se valida en backend)

---

## Uso de Tipos

### En Componentes

```tsx
import type { Lote } from '~/types/lote';

interface LoteCardProps {
    lote: Lote;
    onFavorite?: (id: string) => void;
}

export function LoteCard({ lote, onFavorite }: LoteCardProps) {
    return (
        <div>
            <h3>{lote.nombre}</h3>
            <p>{lote.direccion}</p>
            {lote.valor && (
                <p>Precio: ${lote.valor.toLocaleString('es-CO')}</p>
            )}
            {lote.es_comisionista && (
                <span>Comisionista</span>
            )}
        </div>
    );
}
```

### En Loaders

```typescript
import type { Lote } from '~/types/lote';

export async function loader({ params }: LoaderFunctionArgs) {
    const { res } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/${params.id}/`
    );
    
    const lote: Lote = await res.json();
    
    return json({ lote });
}
```

### En Actions (Creación)

```typescript
import type { CreateLoteData } from '~/types/lote';

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    
    const loteData: CreateLoteData = {
        nombre: formData.get('nombre') as string,
        direccion: formData.get('direccion') as string,
        ciudad: formData.get('ciudad') as string,
        area: parseFloat(formData.get('area') as string),
        valor: parseFloat(formData.get('valor') as string),
        forma_pago: formData.get('forma_pago') as string,
        es_comisionista: formData.get('es_comisionista') === 'on',
        carta_autorizacion: formData.get('carta_autorizacion') as File,
    };
    
    // Validaciones...
    
    // Crear FormData para envío multipart
    const uploadData = new FormData();
    Object.entries(loteData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            uploadData.append(key, value);
        }
    });
    
    const { res } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/`,
        { method: 'POST', body: uploadData }
    );
    
    const newLote: Lote = await res.json();
    return redirect(`/owner/lote/${newLote.id}`);
}
```

---

## Validaciones de Tipo

### Guards de Tipo

```typescript
// Guard para verificar si un objeto es un Lote válido
export function isValidLote(obj: any): obj is Lote {
    return (
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.nombre === 'string' &&
        typeof obj.direccion === 'string' &&
        ['pending', 'active', 'rejected', 'archived'].includes(obj.status)
    );
}

// Uso:
if (isValidLote(data)) {
    // TypeScript sabe que data es Lote
    console.log(data.nombre);
}
```

### Tipos Parciales

```typescript
// Para actualizaciones parciales
type UpdateLoteData = Partial<Lote>;

// Ejemplo:
const updates: UpdateLoteData = {
    nombre: "Nuevo nombre",
    area: 300
    // Otros campos opcionales
};
```

### Omisión de Campos

```typescript
// Para formularios (sin campos del sistema)
type LoteFormData = Omit<Lote, 
    'id' | 'created_at' | 'updated_at' | 'owner' | 'owner_name'
>;
```

---

## Extensiones de Tipos

### Con Información Adicional

```typescript
// Lote con información de propietario completa
interface LoteConPropietario extends Lote {
    propietario_info: {
        id: string;
        nombre: string;
        email: string;
        telefono: string;
    };
}

// Lote con análisis POT
interface LoteConPOT extends Lote {
    pot_data: {
        tratamiento: string;
        indice_ocupacion: number;
        indice_construccion: number;
        altura_maxima: number;
    };
}
```

### Con Estado de Favorito

```typescript
interface LoteConFavorito extends Lote {
    is_favorite: boolean;
    favorite_id?: string;
}
```

---

## Utilidades de Tipo

### Formateo de Moneda

```typescript
export function formatPrecioLote(valor?: number): string {
    if (!valor) return 'Precio no especificado';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(valor);
}

// Uso:
<p>{formatPrecioLote(lote.valor)}</p>
// Output: "$500.000.000"
```

### Formateo de Área

```typescript
export function formatAreaLote(area?: number): string {
    if (!area) return 'Área no especificada';
    return `${area.toLocaleString('es-CO')} m²`;
}

// Uso:
<p>{formatAreaLote(lote.area)}</p>
// Output: "250 m²"
```

### Validación de CBML

```typescript
export function isValidCBML(cbml?: string): boolean {
    if (!cbml) return false;
    
    // CBML debe tener exactamente 11 dígitos
    return /^\d{11}$/.test(cbml);
}

// Uso:
if (!isValidCBML(lote.cbml)) {
    errors.cbml = "CBML debe tener 11 dígitos";
}
```

---

## Enums vs Union Types

### Forma de Pago (Union Type - Preferido)

```typescript
// ✅ PREFERIDO: Union type
type FormaPago = 'contado' | 'financiado' | 'permuta' | 'mixto';

// Ventajas:
// - Más simple
// - Mejor inferencia de tipos
// - No necesita importar enum
```

### Estado del Lote (Union Type)

```typescript
// ✅ PREFERIDO: Union type
type LoteStatus = 'pending' | 'active' | 'rejected' | 'archived';
```

### Constantes de Display

```typescript
export const FORMA_PAGO_DISPLAY: Record<FormaPago, string> = {
    'contado': 'Pago de Contado',
    'financiado': 'Financiado',
    'permuta': 'Permuta',
    'mixto': 'Mixto'
};

export const STATUS_DISPLAY: Record<LoteStatus, string> = {
    'pending': 'Pendiente',
    'active': 'Activo',
    'rejected': 'Rechazado',
    'archived': 'Archivado'
};

// Uso:
<span>{FORMA_PAGO_DISPLAY[lote.forma_pago]}</span>
```

---

## Tipos Adicionales (Futuros)

### Usuario (pendiente de documentar)

```typescript
export interface User {
    id: string;
    email: string;
    role: 'admin' | 'owner' | 'developer';
    first_name?: string;
    last_name?: string;
    // ... más campos
}
```

### Documento (pendiente de documentar)

```typescript
export interface Document {
    id: string;
    document_type: string;
    title: string;
    file: string;
    lote: string;
    // ... más campos
}
```

### Análisis (pendiente de documentar)

```typescript
export interface Analisis {
    id: string;
    lote: string;
    tipo_analisis: string;
    estado: string;
    // ... más campos
}
```

---

## Mejores Prácticas

### 1. Siempre Tipar Funciones

```typescript
// ✅ BUENO
function getLoteById(id: string): Lote | null {
    // ...
}

// ❌ MALO
function getLoteById(id) {
    // ...
}
```

### 2. Usar Tipos Opcionales Correctamente

```typescript
// ✅ BUENO: Campo opcional
interface Lote {
    valor?: number;
}

// Si no existe, es undefined
if (lote.valor) {
    // TypeScript sabe que aquí valor existe
}

// ❌ MALO: No usar null y undefined juntos
interface Lote {
    valor?: number | null; // Redundante
}
```

### 3. Validar en Runtime

```typescript
// TypeScript solo valida en compile-time
// Siempre validar datos del servidor en runtime

const response = await fetch(url);
const data = await response.json();

// ✅ BUENO: Validar antes de usar
if (isValidLote(data)) {
    processLote(data);
} else {
    throw new Error('Invalid lote data');
}
```

### 4. Usar Type Aliases para Complejos

```typescript
// ✅ BUENO: Extraer tipos complejos
type LoteWithRelations = Lote & {
    propietario_info: User;
    documentos: Document[];
    analisis: Analisis[];
};

// Reutilizar
function displayLote(lote: LoteWithRelations) {
    // ...
}
```

---

## Testing con Tipos

```typescript
import type { Lote } from '~/types/lote';

// Mock data con tipos correctos
const mockLote: Lote = {
    id: 'test-123',
    nombre: 'Lote Test',
    direccion: 'Calle Falsa 123',
    status: 'active',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

describe('LoteCard', () => {
    it('renders lote info', () => {
        render(<LoteCard lote={mockLote} />);
        expect(screen.getByText('Lote Test')).toBeInTheDocument();
    });
});
```

---

## Recursos Adicionales

### TypeScript Utility Types

```typescript
// Partial<T> - Todos los campos opcionales
type PartialLote = Partial<Lote>;

// Required<T> - Todos los campos requeridos
type RequiredLote = Required<Lote>;

// Pick<T, K> - Solo campos específicos
type LoteBasico = Pick<Lote, 'id' | 'nombre' | 'direccion'>;

// Omit<T, K> - Excluir campos específicos
type LoteSinMetadata = Omit<Lote, 'created_at' | 'updated_at'>;

// Record<K, V> - Objeto con claves de tipo K y valores de tipo V
type LotesByStatus = Record<LoteStatus, Lote[]>;
```

---

**Última actualización:** Enero 2025  
**Total de tipos documentados:** 2 principales + utilidades  
**TypeScript:** 5.x  
**Framework:** Remix 2.x
