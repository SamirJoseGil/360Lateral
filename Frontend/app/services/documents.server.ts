import { API_URL, fetchWithAuth } from "~/utils/auth.server";

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