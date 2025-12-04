export interface Lote {
  id: string;
  nombre: string;
  direccion: string;
  area?: number;
  
  // Identificación
  cbml?: string;
  matricula?: string;
  codigo_catastral?: string;
  
  // Ubicación
  ciudad?: string;  // ✅ NUEVO
  barrio?: string;
  estrato?: number;
  latitud?: number;
  longitud?: number;
  
  // Características
  uso_suelo?: string;
  clasificacion_suelo?: string;
  tratamiento_pot?: string;
  descripcion?: string;
  
  // ✅ NUEVOS CAMPOS COMERCIALES
  valor?: number;
  forma_pago?: 'contado' | 'financiado' | 'permuta' | 'mixto';
  es_comisionista?: boolean;
  carta_autorizacion?: string;
  
  // Estado
  status: 'pending' | 'active' | 'rejected' | 'archived';
  is_verified: boolean;
  rejection_reason?: string;
  
  // Relaciones
  owner?: string;
  owner_name?: string;
  
  // Metadatos
  metadatos?: Record<string, any>;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  rejected_at?: string;
}

// ✅ NUEVO: Tipo para crear lote
export interface CreateLoteData {
  nombre: string;
  direccion: string;
  ciudad?: string;
  area?: number;
  cbml?: string;
  matricula?: string;
  codigo_catastral?: string;
  barrio?: string;
  estrato?: number;
  descripcion?: string;
  uso_suelo?: string;
  clasificacion_suelo?: string;
  latitud?: number;
  longitud?: number;
  
  // Campos comerciales
  valor?: number;
  forma_pago?: string;
  es_comisionista?: boolean;
  carta_autorizacion?: File | null;
}
