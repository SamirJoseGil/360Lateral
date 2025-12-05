import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";
import { getLoteDocuments, type Document } from "~/services/documents.server";
import DocumentStatusIndicator from "~/components/lotes/DocumentStatusIndicator";
import RequiredDocumentsNotice from "~/components/lotes/RequiredDocumentsNotice";
import POTInfo from "~/components/lotes/POTInfo";
import { MapView } from "~/components/lotes/MapView";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner" && user.role !== "admin") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    const loteId = params.loteId;

    if (!loteId) {
        return json({ error: "ID de lote no proporcionado" }, { status: 400 });
    }

    try {
        // Get lote details
        const loteResponse = await getLoteById(request, loteId);

        // Verificar que el lote pertenezca al usuario (a menos que sea admin)
        if (user.role !== 'admin' && loteResponse.lote.owner !== user.id) {
            return json({ error: "No tienes permiso para ver este lote" }, { status: 403 });
        }

        // Get POT normativa if CBML is available
        let normativaPOT = null;
        if (loteResponse.lote.cbml) {
            try {
                const potResponse = await getNormativaPorCBML(request, loteResponse.lote.cbml);
                normativaPOT = potResponse.normativa;
                console.log(`[LotePage] Normativa POT obtenida para CBML ${loteResponse.lote.cbml}`);
            } catch (potError) {
                console.error(`[LotePage] Error fetching POT data for CBML ${loteResponse.lote.cbml}:`, potError);
                // Continue without POT data
            }
        }

        // Get documents for this lote (with error handling)
        let documents: Document[] = [];
        let documentsCount = 0;

        try {
            const docsResponse = await getLoteDocuments(request, loteId);

            // ✅ CORREGIDO: Verificar que docsResponse tenga la estructura esperada
            if (docsResponse.success && docsResponse.documents) {
                documents = docsResponse.documents;
                documentsCount = docsResponse.documents.length;
            }

            console.log(`[LotePage] Documentos obtenidos para lote ${loteId}: ${documentsCount}`);
        } catch (docsError) {
            console.error(`[LotePage] Error fetching documents for lote ${loteId}:`, docsError);
            // Continue even if documents couldn't be fetched
        }

        // ✅ CORREGIDO: Combinar headers correctamente
        const combinedHeaders = new Headers();

        // Agregar headers del lote si existen
        if (loteResponse.headers) {
            for (const [key, value] of loteResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }

        return json({
            lote: loteResponse.lote,
            normativaPOT,
            documents,
            documentsCount
        }, {
            headers: combinedHeaders
        });
    } catch (error) {
        console.error(`[LotePage] Error al cargar lote ${loteId}:`, error);
        return json({ error: "Error al cargar la información del lote" }, { status: 500 });
    }
}

export default function LoteDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const loteId = params.loteId; // ✅ CRÍTICO: Obtener loteId de params
  
  // ✅ Manejar caso de error
  if ('error' in loaderData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{loaderData.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { lote, normativaPOT, documents, documentsCount } = loaderData;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header con botón de volver */}
      <div className="mb-6">
        <Link
          to="/owner/lotes"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a mis lotes
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalles del Lote</h1>

        <div className="flex space-x-3">
          <Link
            to={`/owner/lote/${loteId}/documentos`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documentos
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card principal del lote */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6 flex justify-between items-start">
            <h2 className="text-xl font-semibold">{lote.nombre || 'Lote sin nombre'}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lote.status === 'active' ? 'bg-green-100 text-green-800' :
              lote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lote.status === 'active' ? 'Activo' :
               lote.status === 'pending' ? 'Pendiente' :
               lote.status || 'Estado desconocido'}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* ✅ Ciudad */}
              {lote.ciudad && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lote.ciudad}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                <dd className="mt-1 text-sm text-gray-900">{lote.direccion || 'No especificada'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Área</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lote.area ? `${lote.area.toLocaleString()} m²` : 'No especificada'}
                </dd>
              </div>

              {/* ✅ Matrícula */}
              {lote.matricula && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Matrícula Inmobiliaria</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{lote.matricula}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">CBML</dt>
                <dd className="mt-1 text-sm text-gray-900">{lote.cbml || 'No especificado'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Barrio</dt>
                <dd className="mt-1 text-sm text-gray-900">{lote.barrio || 'No especificado'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Estrato</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lote.estrato ? `Estrato ${lote.estrato}` : 'No especificado'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Código catastral</dt>
                <dd className="mt-1 text-sm text-gray-900">{lote.codigo_catastral || 'No especificado'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lote.created_at ? new Date(lote.created_at).toLocaleDateString() : 'No disponible'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Descripción si está disponible */}
          {lote.descripcion && (
            <div className="mt-8 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium mb-2">Descripción</h3>
              <p className="text-sm text-gray-900">{lote.descripcion}</p>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN: Información Comercial */}
        {(lote.valor || lote.forma_pago || lote.es_comisionista) && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Información Comercial
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lote.valor && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Valor del Lote</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(lote.valor)}
                  </p>
                </div>
              )}
              
              {lote.forma_pago && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Forma de Pago</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {lote.forma_pago === 'contado' ? '💵 De Contado' :
                     lote.forma_pago === 'financiado' ? '🏦 Financiado' :
                     lote.forma_pago === 'permuta' ? '🔄 Permuta' :
                     lote.forma_pago === 'mixto' ? '🔀 Mixto' : lote.forma_pago}
                  </p>
                </div>
              )}
              
              {lote.es_comisionista && (
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                  <p className="text-sm text-gray-500 mb-2">Tipo de Registro</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      👤 Comisionista
                    </span>
                  </div>
                  {lote.carta_autorizacion && (
                    <a
                      href={lote.carta_autorizacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-700 hover:text-yellow-900 text-sm flex items-center gap-1 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ver Carta
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ SECCIÓN: Ubicación con Mapa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ubicación
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info de ubicación */}
            <div className="space-y-3">
              {lote.direccion && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dirección</p>
                  <p className="text-base font-medium text-gray-900">{lote.direccion}</p>
                </div>
              )}
              
              {lote.ciudad && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ciudad</p>
                  <p className="text-base font-medium text-gray-900">{lote.ciudad}</p>
                </div>
              )}
              
              {lote.barrio && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Barrio</p>
                  <p className="text-base font-medium text-gray-900">{lote.barrio}</p>
                </div>
              )}
              
              {/* ✅ CORREGIDO: Validación de tipos antes de usar toFixed */}
              {(lote.latitud && lote.longitud) && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Coordenadas</p>
                  <p className="text-xs font-mono text-gray-700">
                    {typeof lote.latitud === 'number'
                      ? lote.latitud.toFixed(6)
                      : parseFloat(lote.latitud).toFixed(6)
                    },{" "}
                    {typeof lote.longitud === 'number'
                      ? lote.longitud.toFixed(6)
                      : parseFloat(lote.longitud).toFixed(6)
                    }
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lote.latitud},${lote.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10.5a8.38 8.38 0 01-.9 3.8c-.6 1.2-1.5 2.3-2.6 3.2a8.5 8.5 0 01-10.6 0c-1.1-.9-2-2-2.6-3.2A8.38 8.38 0 013 10.5C3 6.36 6.36 3 10.5 3S18 6.36 18 10.5z" />
                      <circle cx="12" cy="10.5" r="2.5" />
                    </svg>
                    Abrir en Google Maps
                  </a>
                </div>
              )}
            </div>
            
            {/* Mapa */}
            <div className="lg:col-span-2">
              <MapView
                latitud={lote.latitud}
                longitud={lote.longitud}
                direccion={lote.direccion}
                nombre={lote.nombre}
                height="350px"
              />
            </div>
          </div>
        </div>

        {/* POT Information */}
        {(lote.tratamiento_pot || lote.uso_suelo || lote.clasificacion_suelo) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Información normativa</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {lote.tratamiento_pot && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tratamiento POT</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lote.tratamiento_pot}</dd>
                </div>
              )}
              {lote.uso_suelo && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uso del suelo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lote.uso_suelo}</dd>
                </div>
              )}
              {lote.clasificacion_suelo && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Clasificación del suelo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lote.clasificacion_suelo}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* POT detallada */}
        {normativaPOT && normativaPOT.codigo_tratamiento && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Normativa POT Detallada</h3>
            <POTInfo
              potData={normativaPOT}
              showMapGisData={true}
              className="shadow-sm"
            />
          </div>
        )}

        {/* Document status */}
        {lote.status === 'incomplete' && (
          <RequiredDocumentsNotice lote={lote} />
        )}

        <DocumentStatusIndicator
          loteId={loteId || ''}
          documents={documents || []}
          totalCount={documentsCount}
        />
      </div>
    </div>
  );
}