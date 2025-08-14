import { useAuth } from "~/hooks/useAuth";
import { AdminDashboard } from "~/components/dashboards/AdminDashboard";
import { PropietarioDashboard } from "~/components/dashboards/PropietarioDashboard";
import { DesarrolladorDashboard } from "~/components/dashboards/DesarrolladorDashboard";
import { Navigate } from "@remix-run/react";

export default function Dashboard() {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "propietario":
        return <PropietarioDashboard />;
      case "desarrollador":
        return <DesarrolladorDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">
              Rol no reconocido
            </h2>
            <p className="text-gray-600">
              Contacta al administrador para configurar tu cuenta
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderDashboard()}
      </div>
    </div>
  );
}
