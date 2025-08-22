import type { UserRole, NavItem } from "~/types/userRole";

export function getNavItemsByRole(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return [
        { href: "/dashboard/admin", label: "Panel de Control", roles: ["admin"] },
        { href: "/admin/users", label: "Usuarios", roles: ["admin"] },
        { href: "/admin/stats", label: "Estadísticas", roles: ["admin"] },
        { href: "/admin/validation", label: "Validaciones", roles: ["admin"] },
        { href: "/analisis-lote", label: "Análisis Urbanístico", roles: ["admin"] },
        { href: "/scrapinfo", label: "MapGIS Debug", roles: ["admin"] },
      ];
    case "owner":
      return [
        { href: "/dashboard/owner", label: "Mi Dashboard", roles: ["owner"] },
        { href: "/lot/new", label: "Registrar Lote", roles: ["owner"] },
        { href: "/lots/my", label: "Mis Lotes", roles: ["owner"] },
        { href: "/documents", label: "Documentos", roles: ["owner"] },
      ];
    case "developer":
      return [
        { href: "/dashboard/developer", label: "Dashboard", roles: ["developer"] },
        { href: "/lots/search", label: "Buscar Lotes", roles: ["developer"] },
        { href: "/favorites", label: "Favoritos", roles: ["developer"] },
        { href: "/search-criteria", label: "Criterios de Búsqueda", roles: ["developer"] },
        { href: "/analisis-lote", label: "Análisis Urbanístico", roles: ["developer"] },
      ];
    default:
      return [];
  }
}

// Función auxiliar para obtener la ruta del dashboard según el rol
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin": return "/dashboard/admin";
    case "owner": return "/dashboard/owner";
    case "developer": return "/dashboard/developer";
    default: return "/dashboard";
  }
}

// Función para normalizar roles para compatibilidad
export function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  
  const r = role.toLowerCase();
  if (["admin", "administrator", "administrador"].includes(r)) return "admin";
  if (["owner", "propietario", "dueno", "dueño"].includes(r)) return "owner";
  if (["developer", "desarrollador"].includes(r)) return "developer";
  
  return null;
}

// Función para mostrar nombre legible del rol
export function getRoleDisplay(role: string | null): string {
  const normalizedRole = normalizeRole(role);
  
  switch (normalizedRole) {
    case "admin": return "Administrador";
    case "owner": return "Dueño de Lote";
    case "developer": return "Desarrollador";
    default: return role || "Usuario";
  }
}
