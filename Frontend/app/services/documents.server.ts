import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export type DocumentType = 
  | "ctl" 
  | "planos" 
  | "topografia" 
  | "licencia_construccion" 
  | "escritura_publica" 
  | "certificado_libertad" 
  | "avaluo_comercial" 
  | "estudio_suelos" 
  | "otros";

export interface DocumentUpload {
  document_type: DocumentType;
  title: string;
  description?: string;
  file: File;
  lote?: string;
}

export interface Document {
  id: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file: string;
  file_url?: string;  // ✅ NUEVO: URL absoluta del archivo
  file_name?: string;  // ✅ NUEVO: Nombre del archivo
  download_url?: string;  // ✅ NUEVO: URL de descarga
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  lote?: string;
  is_active: boolean;
}

export interface DocumentsResponse {
  success: boolean;
  documents?: Document[];
  document?: Document;
  message?: string;
  error?: string;
}

/**
 * ✅ CORREGIDO: Subir documento usando FormData (no JSON)
 */
export async function uploadDocument(request: Request, documentData: DocumentUpload): Promise<DocumentsResponse> {
  try {
    console.log(`[Documentos] Subiendo documento: ${documentData.title}`);
    
    // ✅ CRÍTICO: Usar FormData para archivos, NO JSON
    const formData = new FormData();
    formData.append('document_type', documentData.document_type);
    formData.append('title', documentData.title);
    if (documentData.description) {
      formData.append('description', documentData.description);
    }
    if (documentData.lote) {
      formData.append('lote', documentData.lote);
    }
    formData.append('file', documentData.file);

    const endpoint = `${API_URL}/api/documents/documents/`;
    console.log(`[Documentos] Endpoint: ${endpoint}`);
    console.log(`[Documentos] File name: ${documentData.file.name}, size: ${documentData.file.size}`);
    
    // ✅ CRÍTICO: NO pasar headers - fetchWithAuth los manejará correctamente
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      body: formData,
      // ✅ NO incluir headers aquí - fetchWithAuth detectará FormData automáticamente
    });

    console.log(`[Documentos] Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error response: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `HTTP ${res.status}: ${errorText}` };
      }
      
      return {
        success: false,
        error: errorData.error || errorData.message || `Error ${res.status}`,
      };
    }

    const result = await res.json();
    console.log(`[Documentos] Documento subido exitosamente: ${result.id || 'N/A'}`);

    return {
      success: true,
      document: result,
      message: 'Documento subido exitosamente',
    };

  } catch (error) {
    console.error('[Documentos] Error al subir documento:', error);
    return {
      success: false,
      error: `Error uploading document: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Obtener documentos de un lote
 */
export async function getLoteDocuments(request: Request, loteId: string): Promise<DocumentsResponse> {
  try {
    console.log(`[Documentos] Obteniendo documentos del lote: ${loteId}`);
    
    const endpoint = `${API_URL}/api/documents/lote/${loteId}/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo documentos: ${res.status} - ${errorText}`);
      return {
        success: false,
        error: `Error ${res.status}: ${errorText}`,
      };
    }

    const documents = await res.json();
    console.log(`[Documentos] Documentos obtenidos: ${documents.length || 0}`);

    return {
      success: true,
      documents: Array.isArray(documents) ? documents : [],
    };

  } catch (error) {
    console.error('[Documentos] Error obteniendo documentos:', error);
    return {
      success: false,
      error: `Error fetching documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Obtener documentos del usuario actual
 */
export async function getUserDocuments(request: Request): Promise<DocumentsResponse> {
  try {
    console.log(`[Documentos] Obteniendo documentos del usuario`);
    
    const endpoint = `${API_URL}/api/documents/user/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo documentos de usuario: ${res.status} - ${errorText}`);
      return {
        success: false,
        error: `Error ${res.status}: ${errorText}`,
      };
    }

    const documents = await res.json();
    console.log(`[Documentos] Documentos de usuario obtenidos: ${documents.length || 0}`);

    return {
      success: true,
      documents: Array.isArray(documents) ? documents : [],
    };

  } catch (error) {
    console.error('[Documentos] Error obteniendo documentos de usuario:', error);
    return {
      success: false,
      error: `Error fetching user documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Eliminar documento
 */
export async function deleteDocument(request: Request, documentId: string): Promise<DocumentsResponse> {
  try {
    console.log(`[Documentos] Eliminando documento: ${documentId}`);
    
    const endpoint = `${API_URL}/api/documents/documents/${documentId}/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error eliminando documento: ${res.status} - ${errorText}`);
      return {
        success: false,
        error: `Error ${res.status}: ${errorText}`,
      };
    }

    console.log(`[Documentos] Documento eliminado exitosamente: ${documentId}`);

    return {
      success: true,
      message: 'Documento eliminado exitosamente',
    };

  } catch (error) {
    console.error('[Documentos] Error eliminando documento:', error);
    return {
      success: false,
      error: `Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Obtener tipos de documento disponibles
 */
export function getDocumentTypes(): { value: DocumentType; label: string }[] {
  return [
    { value: "ctl", label: "Certificado de Tradición y Libertad" },
    { value: "planos", label: "Planos Arquitectónicos" },
    { value: "topografia", label: "Levantamiento Topográfico" },
    { value: "licencia_construccion", label: "Licencia de Construcción" },
    { value: "escritura_publica", label: "Escritura Pública" },
    { value: "certificado_libertad", label: "Certificado de Libertad" },
    { value: "avaluo_comercial", label: "Avalúo Comercial" },
    { value: "estudio_suelos", label: "Estudio de Suelos" },
    { value: "otros", label: "Otros Documentos" },
  ];
}

/**
 * Obtener resumen de validación de documentos
 */
export async function getValidationSummary(request: Request) {
  try {
    console.log(`[Documentos] Obteniendo resumen de validación`);
    
    const endpoint = `${API_URL}/api/documents/validation/summary/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo resumen: ${res.status} - ${errorText}`);
      
      // Retornar datos por defecto en caso de error
      return {
        validationSummary: {
          pendientes: 0,
          validados: 0,
          rechazados: 0,
          total: 0
        },
        headers: new Headers()
      };
    }

    const summary = await res.json();
    console.log(`[Documentos] Resumen obtenido:`, summary);

    return {
      validationSummary: summary,
      headers: setCookieHeaders
    };

  } catch (error) {
    console.error('[Documentos] Error obteniendo resumen de validación:', error);
    return {
      validationSummary: {
        pendientes: 0,
        validados: 0,
        rechazados: 0,
        total: 0
      },
      headers: new Headers()
    };
  }
}

/**
 * Obtener documentos recientes que necesitan validación
 */
export async function getRecentDocumentsForValidation(request: Request, limit: number = 10) {
  try {
    console.log(`[Documentos] Obteniendo ${limit} documentos recientes para validación`);
    
    const endpoint = `${API_URL}/api/documents/validation/list/?status=pendiente&limit=${limit}`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo documentos recientes: ${res.status} - ${errorText}`);
      
      return {
        recentDocuments: [],
        headers: new Headers()
      };
    }

    const data = await res.json();
    const documents = data.results || data || [];
    
    console.log(`[Documentos] ${documents.length} documentos recientes obtenidos`);

    return {
      recentDocuments: documents,
      headers: setCookieHeaders
    };
    

  } catch (error) {
    console.error('[Documentos] Error obteniendo documentos recientes:', error);
    return {
      recentDocuments: [],
      headers: new Headers()
    };
  }
}

/**
 * Obtener lista de documentos con filtros y paginación para validación
 */
export async function getValidationDocuments(
  request: Request, 
  options: { page?: number; page_size?: number; status?: string } = {}
) {
  try {
    const { page = 1, page_size = 10, status } = options;
    
    console.log(`[Documentos] Obteniendo documentos de validación - página ${page}`);
    
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: page_size.toString()
    });
    
    if (status) {
      params.append('status', status);
    }
    
    const endpoint = `${API_URL}/api/documents/validation/list/?${params.toString()}`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo lista de validación: ${res.status} - ${errorText}`);
      
      return {
        documents: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0
        },
        headers: new Headers()
      };
    }

    const data = await res.json();
    
    // ✅ CRÍTICO: Mapear correctamente los documentos con file_url
    const mappedDocuments = (data.results || []).map((doc: any) => {
      // ✅ CORREGIR: Reemplazar URLs internas de Docker con localhost
      let fileUrl = doc.file_url || doc.file;
      
      if (fileUrl && (fileUrl.includes('backend:8000') || fileUrl.includes('lateral360_backend'))) {
        // Reemplazar URL interna de Docker con localhost
        fileUrl = fileUrl.replace(/http:\/\/(backend|lateral360_backend):8000/, 'http://localhost:8000');
        console.log(`[Documentos] 🔧 Corrigiendo URL: ${doc.file_url} → ${fileUrl}`);
      }
      
      console.log(`[Documentos] Doc ${doc.id}:`, {
        title: doc.title,
        file: doc.file,
        file_url_original: doc.file_url,
        file_url_corrected: fileUrl,
        file_name: doc.file_name
      });
      
      return {
        ...doc,
        // ✅ Usar URL corregida
        file_url: fileUrl,
        file: fileUrl,
        // ✅ Mapear campos de nombre consistentes
        nombre: doc.nombre || doc.title,
        tipo: doc.tipo || doc.document_type,
        estado: doc.estado || doc.metadata?.validation_status || 'pendiente',
        fecha_subida: doc.fecha_subida || doc.created_at,
        solicitante: doc.solicitante || doc.user_name || 'Desconocido',
      };
    });
    
    console.log(`[Documentos] Lista de validación obtenida: ${mappedDocuments.length} documentos`);
    
    // ✅ LOGGING: Verificar que los documentos tengan file_url
    const docsWithoutUrl = mappedDocuments.filter((doc: any) => !doc.file_url);
    if (docsWithoutUrl.length > 0) {
      console.error(`[Documentos] ⚠️ ${docsWithoutUrl.length} documentos sin file_url!`);
      docsWithoutUrl.forEach((doc: any) => {
        console.error(`   - Doc ${doc.id}: ${doc.nombre}`);
      });
    }

    return {
      documents: mappedDocuments,
      pagination: {
        page: data.page || 1,
        page_size: data.page_size || 10,
        total: data.total || 0,
        total_pages: data.total_pages || 0
      },
      headers: setCookieHeaders
    };

  } catch (error) {
    console.error('[Documentos] Error obteniendo documentos de validación:', error);
    return {
      documents: [],
      pagination: {
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 0
      },
      headers: new Headers()
    };
  }
}

/**
 * Realizar acción de validación o rechazo en un documento
 */
export async function performDocumentAction(
  request: Request,
  documentId: string,
  action: 'validar' | 'rechazar',
  comments: string = ''
) {
  try {
    console.log(`[Documentos] Realizando acción ${action} en documento ${documentId}`);
    
    const endpoint = `${API_URL}/api/documents/validation/${documentId}/action/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        comments
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error realizando acción: ${res.status} - ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Error ${res.status}: ${errorText}` };
      }
      
      throw new Error(errorData.detail || errorData.error || `Error ${res.status}`);
    }

    const result = await res.json();
    console.log(`[Documentos] Acción ${action} realizada exitosamente`);

    return {
      result,
      headers: setCookieHeaders
    };

  } catch (error) {
    console.error(`[Documentos] Error realizando acción ${action}:`, error);
    throw error;
  }
}

/**
 * Obtener detalles de un documento específico para validación
 */
export async function getDocumentValidationDetails(request: Request, documentId: string) {
  try {
    console.log(`[Documentos] Obteniendo detalles de validación del documento ${documentId}`);
    
    const endpoint = `${API_URL}/api/documents/validation/${documentId}/`;
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Documentos] Error obteniendo detalles: ${res.status} - ${errorText}`);
      throw new Error(`Error ${res.status}: No se pudo obtener los detalles del documento`);
    }

    const document = await res.json();
    console.log(`[Documentos] Detalles obtenidos para documento ${documentId}`);

    return {
      document,
      headers: setCookieHeaders
    };

  } catch (error) {
    console.error('[Documentos] Error obteniendo detalles de validación:', error);
    throw error;
  }
}