// app/utils/roleToDashboard.ts
import type { Role } from "~/utils/auth.server";

export function roleToDashboard(role: Role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
      return "/owner";
    case "developer":
      return "/developer";
    default:
      return "/";
  }
}
