/**
 * Helpers para manejo de documentos
 */

export function getDocumentDownloadUrl(document: any): string {
  // Prioridad: download_url > file_url > file
  const url = document.download_url || document.file_url || document.file;
  
  if (!url) {
    console.error('[Documents] No URL found for document:', document);
    return '';
  }
  
  return url;
}

export function logDocumentAccess(document: any, action: 'download' | 'preview') {
  const url = getDocumentDownloadUrl(document);
  
  console.log(`[Documents] ${action.toUpperCase()}:`, {
    id: document.id,
    title: document.title || document.nombre,
    url,
    type: document.document_type || document.tipo,
    size: document.file_size,
    mime_type: document.mime_type
  });
}

export function handleDocumentDownload(document: any) {
  logDocumentAccess(document, 'download');
  
  const url = getDocumentDownloadUrl(document);
  if (!url) {
    alert('No se pudo obtener la URL del documento');
    return;
  }
  
  // Crear elemento <a> temporal para forzar descarga
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.file_name || document.title || 'documento';
  link.target = '_blank';
  
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
}

export function handleDocumentPreview(document: any) {
  logDocumentAccess(document, 'preview');
  
  const url = getDocumentDownloadUrl(document);
  if (!url) {
    alert('No se pudo obtener la URL del documento');
    return;
  }
  
  window.open(url, '_blank');
}
