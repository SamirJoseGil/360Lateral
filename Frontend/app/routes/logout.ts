// app/routes/auth.logout.ts
import type { ActionFunction } from "@remix-run/node";
import { logoutAction } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return logoutAction(request); // logoutAction devuelve redirect con Set-Cookie (limpieza)
};