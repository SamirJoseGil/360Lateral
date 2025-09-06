# Documentación: Sistema de Validación de Documentos

## Introducción

El sistema de validación de documentos permite gestionar el proceso de revisión de documentos subidos a la plataforma 360Lateral. Proporciona funcionalidades para validar, rechazar y consultar el estado de los documentos en el sistema.

## Endpoints Disponibles

### Resumen de Validación

Este endpoint proporciona un resumen cuantitativo de los documentos clasificados por su estado de validación.

```
GET /api/documents/validation/summary/
```

#### Respuesta

```json
{
  "total": 2359,
  "pendientes": 1054,
  "validados": 1094,
  "rechazados": 211
}
```

### Listar Documentos por Estado

Este endpoint permite listar y filtrar documentos según su estado de validación, con soporte para paginación.

```
GET /api/documents/validation/list/?status=pendiente&page=1&page_size=10
```

#### Parámetros

- `status` (opcional): Filtrar por estado ('pendiente', 'validado', 'rechazado')
- `page` (opcional): Número de página (por defecto: 1)
- `page_size` (opcional): Documentos por página (por defecto: 10)

#### Respuesta

```json
{
  "results": [
    {
      "id": 102,
      "nombre": "Certificado Lote 102",
      "tipo": "Certificado",
      "estado": "pendiente",
      "fecha_subida": "2025-08-08T00:00:00Z",
      "solicitante": "Carlos Ruiz"
    },
    {
      "id": 100,
      "nombre": "Escritura Lote 100",
      "tipo": "Escritura",
      "estado": "pendiente",
      "fecha_subida": "2025-08-06T00:00:00Z",
      "solicitante": "Juan Pérez"
    }
  ],
  "total": 1054,
  "page": 1,
  "page_size": 10,
  "total_pages": 106
}
```

### Documentos Recientes Pendientes

Este endpoint devuelve los documentos más recientes que requieren validación.

```
GET /api/documents/validation/recent/?limit=10
```

#### Parámetros

- `limit` (opcional): Cantidad de documentos a mostrar (por defecto: 10)

#### Respuesta

```json
[
  {
    "id": 102,
    "nombre": "Certificado Lote 102",
    "tipo": "Certificado",
    "estado": "pendiente",
    "fecha_subida": "2025-08-08T00:00:00Z",
    "solicitante": "Carlos Ruiz"
  },
  {
    "id": 100,
    "nombre": "Escritura Lote 100",
    "tipo": "Escritura",
    "estado": "pendiente",
    "fecha_subida": "2025-08-06T00:00:00Z",
    "solicitante": "Juan Pérez"
  }
]
```

### Ver Detalle de un Documento

Este endpoint permite ver la información detallada de un documento específico.

```
GET /api/documents/validation/123/
```

#### Respuesta

```json
{
  "id": 100,
  "nombre": "Escritura Lote 100",
  "file": "/media/documents/escritura_lote100.pdf",
  "document_type": "Escritura",
  "tipo_documento": "Escritura",
  "upload_date": "2025-08-06T00:00:00Z",
  "estado_validacion": "pendiente",
  "validacion_fecha": null,
  "validacion_comentarios": null,
  "lote": 100,
  "lote_nombre": "Lote 100",
  "uploader": 5,
  "solicitante_nombre": "Juan Pérez"
}
```

### Validar o Rechazar un Documento

Este endpoint permite cambiar el estado de validación de un documento.

```
POST /api/documents/validation/100/action/
Content-Type: application/json
```

#### Datos de Solicitud

```json
{
  "action": "validar",
  "comments": "Documento verificado y aprobado"
}
```

o

```json
{
  "action": "rechazar",
  "comments": "El documento está incompleto"
}
```

#### Respuesta Exitosa

```json
{
  "detail": "Documento validado correctamente",
  "document": {
    "id": 100,
    "nombre": "Escritura Lote 100",
    "file": "/media/documents/escritura_lote100.pdf",
    "document_type": "Escritura",
    "tipo_documento": "Escritura",
    "upload_date": "2025-08-06T00:00:00Z",
    "estado_validacion": "validado",
    "validacion_fecha": "2025-08-10T14:30:25Z",
    "validacion_comentarios": "Documento verificado y aprobado",
    "lote": 100,
    "lote_nombre": "Lote 100",
    "uploader": 5,
    "solicitante_nombre": "Juan Pérez"
  }
}
```

### Eliminar un Documento

Este endpoint permite eliminar un documento del sistema.

```
DELETE /api/documents/validation/100/
```

#### Respuesta Exitosa

```json
{
  "detail": "Documento eliminado correctamente"
}
```

## Integración con Frontend

### Componente de Resumen de Validación

```javascript
// Ejemplo usando React y Axios
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ValidationSummary = () => {
  const [summary, setSummary] = useState({
    total: 0,
    pendientes: 0,
    validados: 0,
    rechazados: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('/api/documents/validation/summary/');
        setSummary(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching validation summary:', error);
        setLoading(false);
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando resumen...</p>;

  return (
    <div className="validation-summary">
      <div className="summary-item pending">
        <h3>Pendientes</h3>
        <div className="count">{summary.pendientes}</div>
      </div>
      <div className="summary-item validated">
        <h3>Validados</h3>
        <div className="count">{summary.validados}</div>
      </div>
      <div className="summary-item rejected">
        <h3>Rechazados</h3>
        <div className="count">{summary.rechazados}</div>
      </div>
    </div>
  );
};

export default ValidationSummary;
```

### Tabla de Documentos Recientes

```javascript
// Ejemplo usando React y Axios
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecentDocumentsTable = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('/api/documents/validation/recent/');
        setDocuments(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recent documents:', error);
        setLoading(false);
      }
    };

    fetchDocuments();
    const interval = setInterval(fetchDocuments, 300000); // Actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  const validateDocument = async (id, action, comments = '') => {
    try {
      await axios.post(`/api/documents/validation/${id}/action/`, {
        action,
        comments
      });
      // Actualizar la lista después de validar/rechazar
      const response = await axios.get('/api/documents/validation/recent/');
      setDocuments(response.data);
    } catch (error) {
      console.error(`Error ${action === 'validar' ? 'validando' : 'rechazando'} documento:`, error);
    }
  };

  if (loading) return <p>Cargando documentos recientes...</p>;

  return (
    <div className="recent-documents">
      <h2>Documentos Recientes</h2>
      <p>Documentos que requieren validación</p>
      
      <table className="documents-table">
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>TIPO</th>
            <th>ESTADO</th>
            <th>FECHA DE SUBIDA</th>
            <th>SOLICITANTE</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.nombre}</td>
              <td>{doc.tipo}</td>
              <td>
                <span className={`status ${doc.estado}`}>{doc.estado}</span>
              </td>
              <td>{new Date(doc.fecha_subida).toLocaleDateString()}</td>
              <td>{doc.solicitante}</td>
              <td className="actions">
                <button onClick={() => window.open(`/documents/view/${doc.id}`, '_blank')}>
                  Ver
                </button>
                {doc.estado === 'pendiente' && (
                  <>
                    <button 
                      className="validate-btn"
                      onClick={() => validateDocument(doc.id, 'validar')}
                    >
                      Validar
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => {
                        const comments = window.prompt('Razón del rechazo:');
                        if (comments !== null) {
                          validateDocument(doc.id, 'rechazar', comments);
                        }
                      }}
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentDocumentsTable;
```

## Notas Adicionales

- Los documentos recién subidos se marcan automáticamente como "pendiente".
- Solo los usuarios con permisos adecuados pueden validar o rechazar documentos.
- El sistema mantiene un registro de cuándo y por quién fue validado o rechazado cada documento.
- Los comentarios son opcionales al validar, pero recomendados al rechazar un documento.

## Flujo de Trabajo Recomendado

1. Revisar regularmente el resumen de validación para estar al tanto de los documentos pendientes.
2. Consultar la lista de documentos recientes para procesar primero los más nuevos.
3. Abrir y revisar cada documento antes de validarlo o rechazarlo.
4. Proporcionar comentarios claros al rechazar documentos para que el usuario entienda qué debe corregir.
5. Utilizar los filtros para localizar documentos específicos cuando sea necesario.