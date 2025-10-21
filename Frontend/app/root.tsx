// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import "./tailwind.css";
import { getUser } from "~/utils/auth.server";
import { getEnvDebugInfo } from "~/utils/env.server";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { API_URL } from "~/utils/env.server";

// CRÍTICO: Loader SIN timestamp para evitar revalidaciones infinitas
export async function loader({ request }: LoaderFunctionArgs) {
  // ✅ ELIMINAR logs excesivos
  // console.log("=== ROOT LOADER START ===");

  const user = await getUser(request);

  // ✅ Solo loguear en desarrollo y sin repetir
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Root] User: ${user ? user.email : 'None'}`);
  }

  return json({
    user,
    env: {
      API_URL: process.env.API_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, env } = useLoaderData<typeof loader>();

  // ✅ ELIMINAR log de environment - solo si es necesario debuggear
  // useEffect(() => {
  //   console.log("[App] Environment:", env);
  // }, []);

  // CRÍTICO: NO revalidar automáticamente, esto causa loops infinitos
  // La revalidación se hará automáticamente después del logout

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}