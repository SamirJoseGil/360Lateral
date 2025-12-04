import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getPerfilInversion, updatePerfilInversion } from "~/services/investment.server";
import { useState, useEffect } from "react";
import { CIUDADES_COLOMBIA } from "~/utils/ciudades";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (!user || user.role !== 'developer') {
    return redirect('/developer');
  }

  try {
    // ✅ SIMPLIFICADO: Solo obtener perfil, ciudades vienen del frontend
    const perfilResult = await getPerfilInversion(request);

    // ✅ NUEVO: Log detallado para debugging
    console.log('📊 [Loader] Perfil obtenido:', {
      ciudades_interes: perfilResult.perfil?.ciudades_interes,
      usos_preferidos: perfilResult.perfil?.usos_preferidos,
      modelos_pago: perfilResult.perfil?.modelos_pago,
      volumen_ventas_min: perfilResult.perfil?.volumen_ventas_min,
      ticket_inversion_min: perfilResult.perfil?.ticket_inversion_min,
      perfil_completo: perfilResult.perfil?.perfil_completo
    });

    return json({
      user,
      perfil: perfilResult.perfil,
      ciudades: CIUDADES_COLOMBIA  // ✅ Array estático del frontend
    }, {
      headers: perfilResult.headers
    });
  } catch (error) {
    console.error('❌ [Loader] Error loading perfil:', error);
    return json({
      user,
      perfil: null,
      ciudades: CIUDADES_COLOMBIA  // ✅ Fallback local
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Parsear arrays
  const ciudades_interes = JSON.parse(formData.get('ciudades_interes') as string || '[]');
  const usos_preferidos = JSON.parse(formData.get('usos_preferidos') as string || '[]');
  const modelos_pago = JSON.parse(formData.get('modelos_pago') as string || '[]');

  const data = {
    ciudades_interes,
    usos_preferidos,
    modelos_pago,
    volumen_ventas_min: formData.get('volumen_ventas_min') as string,
    ticket_inversion_min: formData.get('ticket_inversion_min') as string || undefined,
  };

  // ✅ NUEVO: Log del payload
  console.log('📤 Sending to API:', JSON.stringify(data, null, 2));

  try {
    const result = await updatePerfilInversion(request, data);

    // ✅ NUEVO: Log de éxito
    console.log('✅ Update successful:', result);

    return json({
      success: true,
      message: result.message,
      perfil: result.perfil
    }, {
      headers: result.headers
    });
  } catch (error: any) {
    // ✅ MEJORADO: Log de error más detallado
    console.error('❌ Update failed:', error);
    
    return json({
      success: false,
      message: error.message || 'Error actualizando perfil',
      errors: error.errors || { general: error.message }
    }, { status: 400 });
  }
}

export default function InvestmentProfile() {
  const { user, perfil, ciudades } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // ✅ CRÍTICO: Inicializar con valores del perfil O vacíos
  const [selectedCiudades, setSelectedCiudades] = useState<string[]>([]);
  const [selectedUsos, setSelectedUsos] = useState<string[]>([]);
  const [selectedModelos, setSelectedModelos] = useState<string[]>([]);
  const [volumenVentas, setVolumenVentas] = useState('');
  const [ticketInversion, setTicketInversion] = useState('');

  // ✅ CORREGIDO: Sincronizar con perfil usando JSON.stringify para detectar cambios
  useEffect(() => {
    console.log('📊 [useEffect] Perfil recibido:', perfil);
    
    if (perfil) {
      console.log('✅ Sincronizando estados con perfil del servidor');
      
      // Actualizar SIEMPRE con los valores del perfil
      setSelectedCiudades(perfil.ciudades_interes || []);
      setSelectedUsos(perfil.usos_preferidos || []);
      setSelectedModelos(perfil.modelos_pago || []);
      setVolumenVentas(perfil.volumen_ventas_min || '');
      setTicketInversion(perfil.ticket_inversion_min || '');
      
      console.log('✅ Estados actualizados:', {
        ciudades: perfil.ciudades_interes,
        usos: perfil.usos_preferidos,
        modelos: perfil.modelos_pago,
        volumen: perfil.volumen_ventas_min,
        ticket: perfil.ticket_inversion_min
      });
    }
  }, [JSON.stringify(perfil)]); // ✅ Usar JSON.stringify para detectar cambios profundos

  // Estado para búsqueda de ciudades
  const [searchCiudad, setSearchCiudad] = useState('');

  // Mostrar modal de éxito
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [actionData]);

  // Usos de suelo con SVG icons
  const usos = [
    { 
      value: 'residencial', 
      label: 'Residencial',
      description: 'Viviendas y apartamentos',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      value: 'comercial', 
      label: 'Comercial',
      description: 'Oficinas y locales',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      value: 'industrial', 
      label: 'Industrial',
      description: 'Bodegas y fábricas',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v-2m6 2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    },
    { 
      value: 'logistico', 
      label: 'Logístico',
      description: 'Centros de distribución',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
  ];

  // Modelos de pago
  const modelos = [
    { value: 'contado', label: 'De Contado', description: 'Pago total al cierre' },
    { value: 'aporte', label: 'El Aporte', description: 'Aporte inicial y financiación' },
    { value: 'hitos', label: 'Pago por Hitos', description: 'Pagos según avance del proyecto' },
  ];

  // Rangos de inversión
  const rangos = [
    { value: 'menos_150', label: 'Menos de $150.000 millones', short: '< $150M' },
    { value: 'entre_150_350', label: 'Entre $150.000 y $350.000 millones', short: '$150M - $350M' },
    { value: 'mas_350', label: 'Más de $350.000 millones', short: '> $350M' },
  ];

  // Toggle ciudad
  const toggleCiudad = (ciudad: string) => {
    setSelectedCiudades(prev =>
      prev.includes(ciudad)
        ? prev.filter(c => c !== ciudad)
        : [...prev, ciudad]
    );
  };

  // Toggle uso
  const toggleUso = (uso: string) => {
    setSelectedUsos(prev =>
      prev.includes(uso)
        ? prev.filter(u => u !== uso)
        : [...prev, uso]
    );
  };

  // Toggle modelo
  const toggleModelo = (modelo: string) => {
    setSelectedModelos(prev =>
      prev.includes(modelo)
        ? prev.filter(m => m !== modelo)
        : [...prev, modelo]
    );
  };

  // Filtrar ciudades por búsqueda
  const filteredCiudades = ciudades.filter(ciudad =>
    ciudad.label.toLowerCase().includes(searchCiudad.toLowerCase())
  );

  // Verificar si ticket es necesario
  const requiresTicket = user.developer_type === 'fondo_inversion' || user.developer_type === 'inversionista';

  // Verificar si el formulario es válido
  const isFormValid = 
    selectedCiudades.length > 0 &&
    selectedUsos.length > 0 &&
    selectedModelos.length > 0 &&
    volumenVentas &&
    (!requiresTicket || ticketInversion);

  // Calcular progreso
  const calculateProgress = () => {
    let completed = 0;
    const total = requiresTicket ? 5 : 4;
    
    if (selectedCiudades.length > 0) completed++;
    if (selectedUsos.length > 0) completed++;
    if (selectedModelos.length > 0) completed++;
    if (volumenVentas) completed++;
    if (requiresTicket && ticketInversion) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Perfil de Inversión
              </h1>
              {/* ✅ NUEVO: Mostrar si es actualización o creación */}
              <p className="text-gray-600 mt-2">
                {perfil?.perfil_completo 
                  ? 'Actualiza tus preferencias de inversión' 
                  : 'Configura tus preferencias para recibir oportunidades personalizadas'}
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Completado</div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-indigo-600">{progress}%</span>
              </div>
            </div>
          </div>
          
          {/* ✅ NUEVO: Badge de estado */}
          {perfil?.perfil_completo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Perfil completo - Puedes actualizarlo cuando quieras
              </span>
            </div>
          )}
        </div>

        {/* Modal de éxito mejorado */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-white border border-green-200 rounded-lg shadow-xl p-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    ¡Perfil actualizado exitosamente!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {actionData?.message}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <Form method="post" className="space-y-6">
          {/* 1. Ciudades de Interés - MEJORADO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ciudades de Interés</h2>
                  <p className="text-sm text-gray-600">Selecciona las ciudades donde deseas invertir</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Buscador de ciudades */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchCiudad}
                    onChange={(e) => setSearchCiudad(e.target.value)}
                    placeholder="Buscar ciudad..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Ciudades seleccionadas */}
              {selectedCiudades.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-900">
                      {selectedCiudades.length} ciudad{selectedCiudades.length !== 1 ? 'es' : ''} seleccionada{selectedCiudades.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCiudades.map((ciudadValue) => {
                      const ciudad = ciudades.find(c => c.value === ciudadValue);
                      return (
                        <span
                          key={ciudadValue}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-300"
                        >
                          {ciudad?.label}
                          <button
                            type="button"
                            onClick={() => toggleCiudad(ciudadValue)}
                            className="hover:text-indigo-900"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid de ciudades con scroll */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
                  {filteredCiudades.map((ciudad) => (
                    <button
                      key={ciudad.value}
                      type="button"
                      onClick={() => toggleCiudad(ciudad.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium hover:scale-105 ${
                        selectedCiudades.includes(ciudad.value)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {ciudad.label}
                    </button>
                  ))}
                </div>
              </div>

              <input 
                type="hidden" 
                name="ciudades_interes" 
                value={JSON.stringify(selectedCiudades)} 
              />

              {selectedCiudades.length === 0 && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Debes seleccionar al menos una ciudad
                </p>
              )}
            </div>
          </div>

          {/* 2. Usos del Suelo - MEJORADO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Uso del Suelo</h2>
                  <p className="text-sm text-gray-600">Tipos de proyectos de tu interés</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usos.map((uso) => (
                  <button
                    key={uso.value}
                    type="button"
                    onClick={() => toggleUso(uso.value)}
                    className={`group p-5 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      selectedUsos.includes(uso.value)
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg transition-colors ${
                        selectedUsos.includes(uso.value)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        {uso.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{uso.label}</h3>
                          {selectedUsos.includes(uso.value) && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{uso.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <input 
                type="hidden" 
                name="usos_preferidos" 
                value={JSON.stringify(selectedUsos)} 
              />

              {selectedUsos.length === 0 && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Debes seleccionar al menos un tipo de uso
                </p>
              )}
            </div>
          </div>

          {/* 3. Modelo de Pago */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Modelo de Pago</h2>
                  <p className="text-sm text-gray-600">Métodos de pago preferidos</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {modelos.map((modelo) => (
                  <button
                    key={modelo.value}
                    type="button"
                    onClick={() => toggleModelo(modelo.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                      selectedModelos.includes(modelo.value)
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedModelos.includes(modelo.value)
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedModelos.includes(modelo.value) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{modelo.label}</p>
                        <p className="text-sm text-gray-600">{modelo.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <input 
                type="hidden" 
                name="modelos_pago" 
                value={JSON.stringify(selectedModelos)} 
              />

              {selectedModelos.length === 0 && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Debes seleccionar al menos un modelo de pago
                </p>
              )}
            </div>
          </div>

          {/* 4. Volumen Mínimo de Ventas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Volumen Mínimo de Ventas</h2>
                  <p className="text-sm text-gray-600">Rango de inversión esperado</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                {rangos.map((rango) => (
                  <label
                    key={rango.value}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      volumenVentas === rango.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="volumen_ventas_min"
                        value={rango.value}
                        checked={volumenVentas === rango.value}
                        onChange={(e) => setVolumenVentas(e.target.value)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{rango.label}</span>
                        <span className="ml-2 text-sm text-gray-500">({rango.short})</span>
                      </div>
                    </div>
                    {volumenVentas === rango.value && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>

              {!volumenVentas && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Debes seleccionar un rango de volumen
                </p>
              )}
            </div>
          </div>

          {/* 5. Ticket Mínimo de Inversión - Condicional */}
          {requiresTicket && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ticket Mínimo de Inversión</h2>
                    <p className="text-sm text-gray-600">Monto mínimo por proyecto</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-2">
                  {rangos.map((rango) => (
                    <label
                      key={rango.value}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        ticketInversion === rango.value
                          ? 'border-amber-500 bg-amber-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ticket_inversion_min"
                          value={rango.value}
                          checked={ticketInversion === rango.value}
                          onChange={(e) => setTicketInversion(e.target.value)}
                          className="h-5 w-5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{rango.label}</span>
                          <span className="ml-2 text-sm text-gray-500">({rango.short})</span>
                        </div>
                      </div>
                      {ticketInversion === rango.value && (
                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>

                {!ticketInversion && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Este campo es obligatorio para {user.developer_type === 'fondo_inversion' ? 'fondos de inversión' : 'inversionistas'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {!isFormValid ? (
                  <>
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Completa todos los campos obligatorios</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-600 font-medium">Formulario completo</span>
                  </>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {perfil?.perfil_completo ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {perfil?.perfil_completo ? 'Actualizar Perfil' : 'Guardar Perfil de Inversión'}
                  </>
                )}
              </button>
            </div>
          </div>
        </Form>
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
