import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";

type Lot = {
    id: number;
    name: string;
    address: string;
    area: number;
    price: number;
    zone: string;
    treatment: string;
    potentialValue: number;
    isFavorite: boolean;
    owner: {
        name: string;
        contactInfo: string;
        verified: boolean;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
    description: string;
    documents: {
        id: string;
        name: string;
        type: string;
        url: string;
    }[];
    images: string[];
    details: {
        yearBuilt?: number;
        zoning: string;
        landUse: string;
        buildingHeight: string;
        amenities: string[];
    };
};

type LoaderData = {
    lot: Lot;
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);
    const lotId = params.lotId;

    if (!lotId) {
        return json<LoaderData>({
            lot: {} as Lot,
            error: "ID de lote inválido"
        }, { status: 400 });
    }

    try {
        // Registrar evento de vista del lote
        await recordEvent(request, {
            type: "view",
            name: "developer_lot_detail",
            value: {
                user_id: user?.id || "unknown",
                lot_id: lotId
            }
        });

        // En una aplicación real, estos datos vendrían de una API
        // Datos de ejemplo para el lote
        const lot: Lot = {
            id: parseInt(lotId),
            name: `Lote ${lotId}`,
            address: "Calle 123 #45-67, Comuna 2",
            area: 450,
            price: 520000000,
            zone: "Norte",
            treatment: "Residencial",
            potentialValue: 650000000,
            isFavorite: true,
            owner: {
                name: "Juan Pérez",
                contactInfo: "juan.perez@ejemplo.com",
                verified: true
            },
            coordinates: {
                lat: 6.2476,
                lng: -75.5658
            },
            description: "Excelente lote ubicado en zona residencial con potencial para desarrollo de vivienda multifamiliar. Cuenta con todos los servicios públicos y fácil acceso a transporte público.",
            documents: [
                { id: "doc1", name: "Escritura Pública", type: "pdf", url: "#" },
                { id: "doc2", name: "Certificado Catastral", type: "pdf", url: "#" },
                { id: "doc3", name: "Plano Topográfico", type: "dwg", url: "#" }
            ],
            images: [
                "https://via.placeholder.com/800x600?text=Lote+1",
                "https://via.placeholder.com/800x600?text=Lote+2",
                "https://via.placeholder.com/800x600?text=Lote+3"
            ],
            details: {
                yearBuilt: 0, // Sin construcción
                zoning: "R-4 Residencial de Alta Densidad",
                landUse: "Vivienda multifamiliar",
                buildingHeight: "Hasta 8 pisos",
                amenities: ["Servicios públicos", "Acceso pavimentado", "Transporte público cercano"]
            }
        };

        return json<LoaderData>({ lot });

    } catch (error) {
        console.error(`Error cargando detalles del lote ${lotId}:`, error);
        return json<LoaderData>({
            lot: {} as Lot,
            error: "Error al cargar los detalles del lote"
        }, { status: 500 });
    }
}

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function LotDetail() {
    const { lot, error } = useLoaderData<typeof loader>();
    const [activeImage, setActiveImage] = useState(0);

    // Calcular ROI
    const roi = ((lot.potentialValue - lot.price) / lot.price) * 100;

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4">
                            <Link to="/developer/search" className="text-sm font-medium text-red-600 hover:text-red-500">
                                Volver a la búsqueda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{lot.name}</h1>
                    <p className="text-gray-600">{lot.address}</p>
                </div>
                <div className="flex space-x-2">
                    <button className={`p-2 rounded-full ${lot.isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50 hover:text-red-500'}`}>
                        <svg className="h-6 w-6" fill={lot.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <Link to={`/developer/analysis/${lot.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Análisis Urbanístico
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Galería de imágenes */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="p-4">
                            <div className="relative h-96 mb-2 bg-gray-200 rounded overflow-hidden">
                                {lot.images && lot.images.length > 0 ? (
                                    <img
                                        src={lot.images[activeImage]}
                                        alt={`Vista de ${lot.name}`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No hay imágenes disponibles
                                    </div>
                                )}
                            </div>
                            <div className="flex overflow-x-auto space-x-2 py-2">
                                {lot.images && lot.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden ${activeImage === index ? 'ring-2 ring-indigo-500' : ''}`}
                                    >
                                        <img src={image} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Descripción y detalles */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Descripción</h2>
                            <p className="text-gray-700 mb-6">
                                {lot.description}
                            </p>

                            <h2 className="text-xl font-bold mb-4">Detalles del Lote</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-500">Zonificación</h3>
                                    <p className="font-medium">{lot.details.zoning}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Uso de Suelo</h3>
                                    <p className="font-medium">{lot.details.landUse}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Altura Permitida</h3>
                                    <p className="font-medium">{lot.details.buildingHeight}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Tratamiento</h3>
                                    <p className="font-medium">{lot.treatment}</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Características</h3>
                            <div className="flex flex-wrap gap-2">
                                {lot.details.amenities.map((amenity, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Documentos Disponibles</h2>

                            <div className="space-y-2">
                                {lot.documents && lot.documents.length > 0 ? (
                                    lot.documents.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                            <div className="flex items-center">
                                                <svg className="h-6 w-6 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium">{doc.name}</p>
                                                    <p className="text-xs text-gray-500 uppercase">{doc.type}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={doc.url}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Ver
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No hay documentos disponibles</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar con información resumida y contacto */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Información principal */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Resumen</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Área</span>
                                <span className="font-medium">{lot.area} m²</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Precio</span>
                                <span className="font-medium">{formatCurrency(lot.price)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Precio por m²</span>
                                <span className="font-medium">{formatCurrency(lot.price / lot.area)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Zona</span>
                                <span className="font-medium">{lot.zone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tratamiento</span>
                                <span className="font-medium">{lot.treatment}</span>
                            </div>
                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Valor Potencial</span>
                                    <span className="font-medium text-green-600">{formatCurrency(lot.potentialValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ROI Estimado</span>
                                    <span className="font-medium text-green-600">{roi.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información del propietario */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Propietario</h2>
                        <div className="flex items-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                {lot.owner.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium flex items-center">
                                    {lot.owner.name}
                                    {lot.owner.verified && (
                                        <svg className="h-4 w-4 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">{lot.owner.verified ? 'Propietario verificado' : 'Propietario'}</div>
                            </div>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                            Contactar Propietario
                        </button>
                    </div>

                    {/* Ubicación */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Ubicación</h2>
                        <div className="h-48 bg-gray-200 rounded mb-3">
                            {/* Aquí iría el mapa */}
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Mapa no disponible
                            </div>
                        </div>
                        <p className="text-gray-700">{lot.address}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
