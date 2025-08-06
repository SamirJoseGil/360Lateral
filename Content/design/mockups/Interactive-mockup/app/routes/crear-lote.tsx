import { Link } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Navbar";

export default function CrearLote() {
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    areaTotal: "",
    estrato: "",
    cedulaCatastral: "",
    matriculaInmobiliaria: "",
    tipoTerreno: "",
    serviciosDisponibles: "",
    precioVenta: "",
    ocupado: "no",
    fechaEntrega: "",
    observaciones: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    const loteId = Math.floor(Math.random() * 1000) + 1;
    alert("Lote registrado exitosamente");
    // Redirect to upload documents for this new lot
    window.location.href = `/subir-documentos/${loteId}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm">
        <Navbar currentPath="/crear-lote" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-white hover:text-orange-400 transition-colors mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver al Dashboard
          </Link>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Registrar Lote</h1>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Información del Lote</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Nombre (Opcional)"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          name="ubicacion"
                          value={formData.ubicacion}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Ubicación"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          name="areaTotal"
                          value={formData.areaTotal}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Área total"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          name="estrato"
                          value={formData.estrato}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Estrato"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          name="cedulaCatastral"
                          value={formData.cedulaCatastral}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Número de cédula catastral"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          name="matriculaInmobiliaria"
                          value={formData.matriculaInmobiliaria}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Número de matrícula inmobiliaria"
                          required
                        />
                      </div>

                      <div>
                        <select
                          name="tipoTerreno"
                          value={formData.tipoTerreno}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          required
                        >
                          <option value="">Tipo de terreno (Urbano o Rural)</option>
                          <option value="urbano">Urbano</option>
                          <option value="rural">Rural</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          name="serviciosDisponibles"
                          value={formData.serviciosDisponibles}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Servicios disponibles"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          name="precioVenta"
                          value={formData.precioVenta}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Precio de venta (negociable?)"
                        />
                      </div>

                      {/* Ocupado field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          ¿El lote está ocupado actualmente?
                        </label>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="ocupado-si"
                              name="ocupado"
                              value="si"
                              checked={formData.ocupado === "si"}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="ocupado-si" className="ml-2 text-sm text-gray-700">
                              Sí
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="ocupado-no"
                              name="ocupado"
                              value="no"
                              checked={formData.ocupado === "no"}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="ocupado-no" className="ml-2 text-sm text-gray-700">
                              No
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fechas disponibles para entrega
                        </label>
                        <input
                          type="date"
                          name="fechaEntrega"
                          value={formData.fechaEntrega}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        />
                      </div>

                      <div>
                        <textarea
                          name="observaciones"
                          value={formData.observaciones}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 resize-none"
                          placeholder="Observaciones adicionales (Opcional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-6 space-x-4">
                  <Link
                    to="/dashboard"
                    className="px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    className="px-12 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    Registrar y Subir Documentos
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}