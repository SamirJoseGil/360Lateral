import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import { useState, useEffect } from "react";

// Tipos
type InvestmentCriteria = {
  id: number;
  name: string;
  developer: {
    id: string;
    email: string;
    name: string;
    developer_type?: string;
  };
  ciudades_interes: string[];
  usos_preferidos: string[];
  modelos_pago: string[];
  volumen_ventas_min: string;
  ticket_inversion_min?: string;
  perfil_completo: boolean;
  created_at: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (!user || user.role !== 'admin') {
    return redirect('/admin');
  }

  try {
    // ✅ Obtener todos los perfiles de inversión
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/perfiles-inversion/`
    );

    if (!res.ok) {
      throw new Error(`Error fetching investment profiles: ${res.status}`);
    }

    const data = await res.json();
    
    return json({
      user,
      profiles: data.profiles || [],
      total: data.total || 0
    }, {
      headers: setCookieHeaders
    });
  } catch (error) {
    console.error('Error loading investment profiles:', error);
    return json({
      user,
      profiles: [],
      total: 0
    });
  }
}

export default function AdminInvestments() {
  const { user, profiles, total } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompleto, setFilterCompleto] = useState<'all' | 'completo' | 'incompleto'>('all');
  // ✅ NUEVO: Estado para modal de recomendación
  const [selectedProfile, setSelectedProfile] = useState<InvestmentCriteria | null>(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);

  // Filtrar perfiles
  const filteredProfiles = profiles.filter((profile: InvestmentCriteria) => {
    const matchSearch = 
      profile.developer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.developer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchFilter = 
      filterCompleto === 'all' ||
      (filterCompleto === 'completo' && profile.perfil_completo) ||
      (filterCompleto === 'incompleto' && !profile.perfil_completo);

    return matchSearch && matchFilter;
  });

  // Mapeo de rangos
  const rangoLabels: Record<string, string> = {
    'menos_150': '< $150M',
    'entre_150_350': '$150M - $350M',
    'mas_350': '> $350M'
  };

  // ✅ NUEVO: Función para calcular qué falta en el perfil
  const getProfileIncompleteReasons = (profile: InvestmentCriteria): string[] => {
    const reasons: string[] = [];
    
    // ✅ Verificar ciudades
    if (!profile.ciudades_interes || profile.ciudades_interes.length === 0) {
      reasons.push('No ha seleccionado ciudades de interés');
    }
    
    // ✅ Verificar usos
    if (!profile.usos_preferidos || profile.usos_preferidos.length === 0) {
      reasons.push('No ha seleccionado tipos de uso de suelo');
    }
    
    // ✅ Verificar modelos de pago
    if (!profile.modelos_pago || profile.modelos_pago.length === 0) {
      reasons.push('No ha seleccionado modelos de pago');
    }
    
    // ✅ Verificar volumen de ventas
    if (!profile.volumen_ventas_min || profile.volumen_ventas_min.trim() === '') {
      reasons.push('No ha definido volumen mínimo de ventas');
    }
    
    // ✅ Solo para fondos e inversionistas
    const requiresTicket = profile.developer?.developer_type === 'fondo_inversion' || 
                          profile.developer?.developer_type === 'inversionista';
    
    if (requiresTicket && (!profile.ticket_inversion_min || profile.ticket_inversion_min.trim() === '')) {
      reasons.push('No ha definido ticket mínimo de inversión (obligatorio para fondos e inversionistas)');
    }
    
    return reasons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criterios de Inversión</h1>
          <p className="text-sm text-gray-600 mt-1">
            Perfiles de inversión de los desarrolladores
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar desarrollador
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o email..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filtro por completitud */}
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Estado del perfil
            </label>
            <select
              id="filter"
              value={filterCompleto}
              onChange={(e) => setFilterCompleto(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="completo">Completos</option>
              <option value="incompleto">Incompletos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Perfiles Completos</p>
              <p className="text-2xl font-bold text-green-600">
                {profiles.filter((p: InvestmentCriteria) => p.perfil_completo).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Perfiles Incompletos</p>
              <p className="text-2xl font-bold text-orange-600">
                {profiles.filter((p: InvestmentCriteria) => !p.perfil_completo).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">% Completitud</p>
              <p className="text-2xl font-bold text-indigo-600">
                {total > 0 ? Math.round((profiles.filter((p: InvestmentCriteria) => p.perfil_completo).length / total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de perfiles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desarrollador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volumen Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                {/* ✅ NUEVO: Columna de acciones */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No se encontraron perfiles</p>
                      <p className="text-sm">Intenta con otros filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile: InvestmentCriteria) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {profile.developer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.developer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {profile.developer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {profile.ciudades_interes.slice(0, 3).map((ciudad) => (
                          <span
                            key={ciudad}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {ciudad}
                          </span>
                        ))}
                        {profile.ciudades_interes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{profile.ciudades_interes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {profile.usos_preferidos.map((uso) => (
                          <span
                            key={uso}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {uso}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {rangoLabels[profile.volumen_ventas_min] || profile.volumen_ventas_min}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.perfil_completo ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completo
                        </span>
                      ) : (
                        <div className="group relative">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 cursor-help">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Incompleto
                          </span>
                          
                          {/* ✅ NUEVO: Tooltip con razones */}
                          <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                            <div className="font-semibold mb-2">Campos faltantes:</div>
                            <ul className="space-y-1">
                              {getProfileIncompleteReasons(profile).map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                            {/* Arrow del tooltip */}
                            <div className="absolute top-full left-4 -mt-1">
                              <div className="border-8 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString('es-CO')}
                    </td>
                    
                    {/* ✅ NUEVO: Columna de acciones */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedProfile(profile);
                          setShowRecommendModal(true);
                        }}
                        disabled={!profile.perfil_completo}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          profile.perfil_completo
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!profile.perfil_completo ? 'Complete el perfil primero' : 'Recomendar lote'}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Recomendar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ NUEVO: Modal de recomendación de lote */}
      {showRecommendModal && selectedProfile && (
        <RecommendLotModal
          profile={selectedProfile}
          onClose={() => {
            setShowRecommendModal(false);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
}

// ✅ NUEVO: Componente de modal de recomendación
function RecommendLotModal({ 
  profile, 
  onClose 
}: { 
  profile: InvestmentCriteria; 
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const [selectedLote, setSelectedLote] = useState<string>('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [matchingLotes, setMatchingLotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar lotes que coincidan con el perfil
  useEffect(() => {
    const fetchMatchingLotes = async () => {
      try {
        const params = new URLSearchParams();
        
        // Filtrar por ciudades
        if (profile.ciudades_interes?.length > 0) {
          params.append('ciudad', profile.ciudades_interes[0]);
        }
        
        // Filtrar por usos
        if (profile.usos_preferidos?.length > 0) {
          params.append('uso', profile.usos_preferidos[0]);
        }
        
        // Solo lotes activos
        params.append('status', 'active');
        params.append('limit', '10');
        
        const response = await fetch(`/api/lotes/available/?${params.toString()}`);
        const data = await response.json();
        
        setMatchingLotes(data.results || []);
      } catch (error) {
        console.error('Error fetching lotes:', error);
        setMatchingLotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchingLotes();
  }, [profile]);

  // Generar mensaje de recomendación automático
  const generateRecommendationMessage = (lote: any) => {
    const reasons: string[] = [];
    
    // Coincidencia de ciudad
    if (profile.ciudades_interes?.includes(lote.ciudad)) {
      reasons.push(`está en ${lote.ciudad}, una de tus ciudades de interés`);
    }
    
    // Coincidencia de uso
    if (profile.usos_preferidos?.includes(lote.uso_suelo)) {
      reasons.push(`tiene uso ${lote.uso_suelo}, que es uno de tus preferidos`);
    }
    
    // Volumen de ventas
    if (lote.volumen_ventas) {
      reasons.push(`tiene un volumen de ventas estimado de ${formatCurrency(lote.volumen_ventas)}`);
    }
    
    // Área
    if (lote.area) {
      reasons.push(`cuenta con ${lote.area.toLocaleString('es-CO')} m²`);
    }
    
    const baseMessage = `Hola ${profile.developer.name}, te recomendamos este lote porque ${reasons.join(', ')}.`;
    const suggestion = reasons.length > 0 
      ? ` Creemos que se ajusta perfectamente a tu perfil de inversión.`
      : ` Tiene características interesantes para tu perfil.`;
    
    return baseMessage + suggestion;
  };

  const handleLoteSelect = (loteId: string, lote: any) => {
    setSelectedLote(loteId);
    setRecommendationMessage(generateRecommendationMessage(lote));
  };

  const handleSubmit = () => {
    if (!selectedLote || !recommendationMessage.trim()) return;

    fetcher.submit(
      {
        intent: 'recommend-lote',
        profileId: profile.id.toString(),
        loteId: selectedLote,
        message: recommendationMessage
      },
      { method: 'post' }
    );
  };

  // Cerrar modal al completar acción
  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === 'idle') {
      onClose();
    }
  }, [fetcher.data, fetcher.state, onClose]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Recomendar Lote</h3>
                <p className="text-indigo-100 text-sm">Para: {profile.developer.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Perfil del desarrollador */}
          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-indigo-900 mb-2">Perfil de Inversión</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-indigo-700 font-medium">Ciudades:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.ciudades_interes?.map((ciudad) => (
                    <span key={ciudad} className="bg-white px-2 py-0.5 rounded text-indigo-700 text-xs">
                      {ciudad}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-indigo-700 font-medium">Usos:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.usos_preferidos?.map((uso) => (
                    <span key={uso} className="bg-white px-2 py-0.5 rounded text-indigo-700 text-xs">
                      {uso}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de lotes */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Selecciona un lote que coincida con el perfil ({matchingLotes.length} disponibles)
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : matchingLotes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">No hay lotes disponibles que coincidan con este perfil</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {matchingLotes.map((lote) => (
                  <div
                    key={lote.id}
                    onClick={() => handleLoteSelect(lote.id, lote)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLote === lote.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{lote.nombre || lote.cbml}</h5>
                        <p className="text-sm text-gray-600 mt-1">{lote.direccion}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lote.ciudad}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {lote.uso_suelo || 'Residencial'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {lote.area?.toLocaleString('es-CO')} m²
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(lote.precio_estimado || 0)}
                        </p>
                        {selectedLote === lote.id && (
                          <svg className="w-6 h-6 text-indigo-600 mt-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mensaje de recomendación */}
          {selectedLote && (
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de recomendación
              </label>
              <textarea
                id="message"
                rows={4}
                value={recommendationMessage}
                onChange={(e) => setRecommendationMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Personaliza el mensaje de recomendación..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Este mensaje se enviará al desarrollador junto con la información del lote
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLote || !recommendationMessage.trim() || fetcher.state === 'submitting'}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedLote && recommendationMessage.trim() && fetcher.state !== 'submitting'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {fetcher.state === 'submitting' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar Recomendación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
