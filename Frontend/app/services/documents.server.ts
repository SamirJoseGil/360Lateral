import { API_URL } from "~/utils/api.server";
import { fetchWithAuth } from "~/utils/auth.server";


export interface Document {
  id: number;
  title: string;
  description?: string;
  document_type: string;
  file: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  user: number;
  user_name?: string;
  lote?: number;
  lote_nombre?: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  is_active: boolean;
  status?: string;
}

export interface DocumentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Document[];
}

/**
 * Upload a document to the server
 */
export async function uploadDocument(request: Request, formData: FormData) {
  try {
    const endpoint = `${API_URL}/api/documents/`;
    
    console.log("[Documents] Uploading document to endpoint:", endpoint);
    
    // Parse tags if they exist
    const tagsString = formData.get("tags") as string | null;
    if (tagsString) {
      const tagsArray = tagsString.split(",").map(tag => tag.trim()).filter(Boolean);
      formData.delete("tags");
      formData.append("tags", JSON.stringify(tagsArray));
    }
    
    // Make API request
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: "POST",
      body: formData,
      // Important: Do not set Content-Type header when sending FormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Documents] Error uploading document:", response.status, errorText);
      throw new Error(`Error uploading document: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("[Documents] Document uploaded successfully with ID:", data.id);
    
    return { document: data, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Documents] Error in uploadDocument:", error);
    throw error;
  }
}

/**
 * Get documents for a specific lote
 */
export async function getLoteDocuments(request: Request, loteId: string) {
  try {
    const endpoint = `${API_URL}/api/documents/lote/${loteId}/`;
    
    console.log(`[Documents] Fetching documents for lote ${loteId} from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Documents] Error fetching documents for lote ${loteId}:`, response.status, errorText);
      
      // If 404, might mean no documents yet, return empty list instead of error
      if (response.status === 404) {
        return { documents: [], count: 0, headers: setCookieHeaders };
      }
      
      throw new Error(`Error fetching lote documents: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Documents] Received ${data.results?.length || 0} documents for lote ${loteId}`);
    
    return { 
      documents: data.results || [], 
      count: data.count || 0, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Documents] Error in getLoteDocuments:", error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(request: Request, documentId: string) {
  try {
    const endpoint = `${API_URL}/api/documents/${documentId}/`;
    
    console.log(`[Documents] Deleting document ${documentId} at endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Documents] Error deleting document ${documentId}:`, response.status, errorText);
      throw new Error(`Error deleting document: ${response.status} ${errorText}`);
    }
    
    console.log(`[Documents] Document ${documentId} deleted successfully`);
    
    return { success: true, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Documents] Error in deleteDocument:", error);
    throw error;
  }
}

/**
 * Archive a document (soft delete)
 */
export async function archiveDocument(request: Request, documentId: string) {
  try {
    const endpoint = `${API_URL}/api/documents/${documentId}/archive/`;
    
    console.log(`[Documents] Archiving document ${documentId} at endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: "POST",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Documents] Error archiving document ${documentId}:`, response.status, errorText);
      throw new Error(`Error archiving document: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Documents] Document ${documentId} archived successfully`);
    
    return { message: data.message, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Documents] Error in archiveDocument:", error);
    throw error;
  }
}

/**
 * Obtiene un resumen de documentos por estado de validación
 */
export async function getValidationSummary(request: Request) {
  try {
    const endpoint = `${API_URL}/api/documents/validation/summary/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo resumen de validación: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      validationSummary: data, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo resumen de validación:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de documentos para validación con filtros opcionales
 */
export async function getValidationDocuments(request: Request, filters?: {
  estado?: string;
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/documents/validation/list/`;
    
    // Añadir filtros a la URL si están presentes
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo documentos para validación: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      documents: data.results || [],
      pagination: {
        count: data.count,
        next: data.next,
        previous: data.previous,
      },
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo documentos para validación:', error);
    throw error;
  }
}

/**
 * Obtiene documentos recientes que requieren validación
 */
export async function getRecentDocumentsForValidation(request: Request, limit: number = 10) {
  try {
    const endpoint = `${API_URL}/api/documents/validation/recent/?limit=${limit}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo documentos recientes para validación: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      recentDocuments: data.results || [], 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo documentos recientes para validación:', error);
    throw error;
  }
}

/**
 * Obtiene detalles de un documento específico
 */
export async function getDocumentDetails(request: Request, documentId: string) {
  try {
    const endpoint = `${API_URL}/api/documents/validation/${documentId}/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo detalles del documento: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const documentDetails = await response.json();
    return { 
      documentDetails, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`Error obteniendo detalles del documento ${documentId}:`, error);
    throw error;
  }
}

/**
 * Realiza una acción de validación o rechazo sobre un documento
 */
export async function performDocumentAction(
  request: Request,
  documentId: string,
  action: 'validar' | 'rechazar',
  comentarios?: string
) {
  try {
    const endpoint = `${API_URL}/api/documents/validation/${documentId}/action/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        comentarios: comentarios || ''
      }),
    });
    
    if (!response.ok) {
      console.error(`Error realizando acción de documento: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return { 
      result, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`Error realizando acción ${action} en el documento ${documentId}:`, error);
    throw error;
  }
}