// app/routes/auth.logout.ts
import type { ActionFunction } from "@remix-run/node";
import { logoutAction } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("Route logout action called");
  return logoutAction(request);
};

// Agregar un loader para manejar peticiones GET a /logout
export async function loader() {
  console.log("Route logout loader called, redirecting to /");

  // Crear headers para limpiar cookies
  const headers = new Headers();

  // Limpiar todas las cookies relevantes
  headers.append(
    "Set-Cookie",
    "l360_access=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );
  headers.append(
    "Set-Cookie",
    "l360_refresh=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );
  headers.append(
    "Set-Cookie",
    "l360_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );
  headers.append(
    "Set-Cookie",
    "__360lateral=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  // Redirigir con las cookies limpias
  return new Response("Redirecting...", {
    status: 302,
    headers: {
      ...headers,
      Location: "/",
    },
  });
}