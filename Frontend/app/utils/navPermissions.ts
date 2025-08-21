import type { UserRole } from "~/types/auth";

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

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
    case "propietario":
      return [
        { href: "/dashboard/owner", label: "Mi Dashboard", roles: ["propietario"] },
        { href: "/lot/new", label: "Registrar Lote", roles: ["propietario"] },
        { href: "/lots/my", label: "Mis Lotes", roles: ["propietario"] },
        { href: "/documents", label: "Documentos", roles: ["propietario"] },
      ];
    case "desarrollador":
      return [
        { href: "/dashboard/developer", label: "Dashboard", roles: ["desarrollador"] },
        { href: "/lots/search", label: "Buscar Lotes", roles: ["desarrollador"] },
        { href: "/favorites", label: "Favoritos", roles: ["desarrollador"] },
        { href: "/search-criteria", label: "Criterios de Búsqueda", roles: ["desarrollador"] },
        { href: "/analisis-lote", label: "Análisis Urbanístico", roles: ["desarrollador"] },
      ];
    default:
      return [];
  }
}
