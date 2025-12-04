/**
 * Lista de ciudades principales de Colombia
 * Usada en formularios de perfil de inversión
 */
export const CIUDADES_COLOMBIA = [
  { value: 'medellin', label: 'Medellín' },
  { value: 'bogota', label: 'Bogotá' },
  { value: 'cali', label: 'Cali' },
  { value: 'barranquilla', label: 'Barranquilla' },
  { value: 'cartagena', label: 'Cartagena' },
  { value: 'cucuta', label: 'Cúcuta' },
  { value: 'bucaramanga', label: 'Bucaramanga' },
  { value: 'pereira', label: 'Pereira' },
  { value: 'santa_marta', label: 'Santa Marta' },
  { value: 'ibague', label: 'Ibagué' },
  { value: 'pasto', label: 'Pasto' },
  { value: 'manizales', label: 'Manizales' },
  { value: 'neiva', label: 'Neiva' },
  { value: 'villavicencio', label: 'Villavicencio' },
  { value: 'armenia', label: 'Armenia' },
  { value: 'valledupar', label: 'Valledupar' },
  { value: 'monteria', label: 'Montería' },
  { value: 'sincelejo', label: 'Sincelejo' },
  { value: 'popayan', label: 'Popayán' },
  { value: 'tunja', label: 'Tunja' },
] as const;

export type CiudadColombia = typeof CIUDADES_COLOMBIA[number];
