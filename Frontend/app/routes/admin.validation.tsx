import { useState, useEffect } from "react";
import { useAuth } from "~/hooks/useAuth";
import { Navigate } from "@remix-run/react";
import { logger } from "~/utils/logger";

interface PendingValidation {
  id: string;
  type: "lote" | "document" | "user";
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
}

export default function AdminValidation() {
  const { user, isLoading, hasRole, initialCheckDone } = useAuth();
  const [validations, setValidations] = useState<PendingValidation[]>([]);
  const [loadingValidations, setLoadingValidations] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    logger.info('AdminValidation', '🔍 Componente AdminValidation montado');
    return () => {
      logger.debug('AdminValidation', '🔍 Componente AdminValidation desmontado');
    };
  }, []);

  // ✅ Corregido: No usar window.location.href en el renderizado
  // En su lugar, usar useEffect para verificar permisos después del renderizado inicial
  useEffect(() => {
    if (!isLoading && initialCheckDone) {
      logger.debug('AdminValidation', '🔒 Verificando permisos de administrador');
      
      if (!user || !hasRole("admin")) {
        logger.warn('AdminValidation', '🚫 Usuario sin permisos de administrador');
        // La redirección se maneja con el componente Navigate
      } else {
        logger.info('AdminValidation', '✅ Acceso de administrador verificado');
        loadValidations();
      }
    }
  }, [isLoading, initialCheckDone, user, hasRole]);

  // Verificación de permisos durante el renderizado
  if (!isLoading && initialCheckDone && (!user || !hasRole("admin"))) {
    logger.warn('AdminValidation', '🚫 Redirigiendo: sin permisos de administrador');
    return <Navigate to="/auth/login" replace />;
  }

  const loadValidations = async () => {
    try {
      logger.info('AdminValidation', '📋 Cargando lista de validaciones pendientes');
      setLoadingValidations(true);
      // ✅ Aquí llamarías a tu API real
      // const response = await ValidationService.getPending();
      // setValidations(response.data);

      // Mock data por ahora
      setValidations([
        {
          id: "1",
          type: "lote",
          title: "Modificación de área del lote",
          description: "Solicitud para cambiar el área de 150m² a 180m²",
          submittedBy: "María González",
          submittedAt: "2024-01-15T10:30:00Z",
          priority: "high",
          status: "pending",
        },
        {
          id: "2",
          type: "document",
          title: "Validación de escritura",
          description: "Documento de escritura para lote en El Poblado",
          submittedBy: "Carlos López",
          submittedAt: "2024-01-15T09:15:00Z",
          priority: "medium",
          status: "pending",
        },
        {
          id: "3",
          type: "user",
          title: "Verificación de desarrollador",
          description: "Solicitud de verificación para cuenta empresarial",
          submittedBy: "Ana Rodríguez",
          submittedAt: "2024-01-14T16:45:00Z",
          priority: "low",
          status: "pending",
        },
      ]);
      
      logger.info('AdminValidation', '✅ Validaciones cargadas exitosamente', {
        count: 3
      });
    } catch (error) {
      logger.error('AdminValidation', '❌ Error cargando validaciones', { error });
    } finally {
      setLoadingValidations(false);
    }
  };

  const handleValidation = async (
    id: string,
    action: "approve" | "reject",
    comment?: string
  ) => {
    try {
      logger.info('AdminValidation', `🔄 Procesando validación: ${action}`, { id, comment });
      // ✅ Aquí llamarías a tu API real
      // await ValidationService.process(id, action, comment);

      // Actualizar estado local
      setValidations((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: action === "approve" ? "approved" : "rejected" }
            : v
        )
      );

      logger.info('AdminValidation', `✅ Validación ${action} exitosa`, { id });
    } catch (error) {
      logger.error('AdminValidation', `❌ Error procesando validación ${action}`, { id, error });
    }
  };

  const filteredValidations = validations.filter((v) => {
    return selectedType === "all" || v.type === selectedType;
  });

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "lote":
        return "Lote";
      case "document":
        return "Documento";
      case "user":
        return "Usuario";
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "lote":
        return "bg-blue-100 text-blue-800";
      case "document":
        return "bg-green-100 text-green-800";
      case "user":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || !initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Validaciones Pendientes
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Revisa y aprueba solicitudes de cambios críticos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {validations.filter((v) => v.status === "pending").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alta Prioridad
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      validations.filter(
                        (v) => v.priority === "high" && v.status === "pending"
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      validations.filter(
                        (v) =>
                          new Date(v.submittedAt).toDateString() ===
                          new Date().toDateString()
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Filtrar por tipo
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => {
                logger.debug('AdminValidation', '🔍 Filtro cambiado', { newType: e.target.value });
                setSelectedType(e.target.value);
              }}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="lote">Lotes</option>
              <option value="document">Documentos</option>
              <option value="user">Usuarios</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validations List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loadingValidations ? (
            <li className="px-4 py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">
                Cargando validaciones...
              </p>
            </li>
          ) : filteredValidations.length === 0 ? (
            <li className="px-4 py-4 text-center">
              <p className="text-sm text-gray-500">
                No hay validaciones pendientes
              </p>
            </li>
          ) : (
            filteredValidations.map((validation) => (
              <li key={validation.id}>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(
                            validation.type
                          )}`}
                        >
                          {getTypeDisplay(validation.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {validation.title}
                          </div>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(
                              validation.priority
                            )}`}
                          >
                            {validation.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {validation.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Por {validation.submittedBy} •{" "}
                          {new Date(
                            validation.submittedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {validation.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleValidation(validation.id, "approve")
                          }
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() =>
                            handleValidation(validation.id, "reject")
                          }
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                    {validation.status !== "pending" && (
                      <div
                        className={`text-sm font-medium ${
                          validation.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {validation.status === "approved"
                          ? "Aprobado"
                          : "Rechazado"}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
