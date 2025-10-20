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
  console.log("=== ROOT LOADER START ===");
  console.log(`🔗 Using API_URL: ${API_URL}`);

  // Log de cookies recibidas
  const cookieHeader = request.headers.get("Cookie");
  console.log(`[Root] Cookie header: ${cookieHeader ? 'PRESENT' : '❌ MISSING'}`);
  if (cookieHeader) {
    console.log(`[Root] Cookie length: ${cookieHeader.length} characters`);
    console.log(`[Root] Cookie preview: ${cookieHeader.substring(0, 150)}...`);

    // Parsear cookies para debugging
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const l360Cookies = cookies.filter(c => c.startsWith('l360_'));
    console.log(`[Root] L360 cookies found: ${l360Cookies.length}`);
    l360Cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      console.log(`   - ${name}`);
    });
  }

  const user = await getUser(request);
  console.log("User loaded:", user ? `${user.email} (${user.role})` : "No user");

  // Log de variables de entorno (solo server-side)
  if (typeof window === 'undefined') {
    console.log("[App] Environment:", {
      API_URL,
      BACKEND_HOST: process.env.BACKEND_HOST,
      BACKEND_PORT: process.env.BACKEND_PORT,
      DOCKER_ENV: process.env.DOCKER_ENV,
      NODE_ENV: process.env.NODE_ENV,
      isDocker: process.env.DOCKER_ENV === 'true' || process.env.BACKEND_HOST === 'backend',
    });
  }

  console.log("=== ROOT LOADER END ===");

  // Headers estándar (sin no-cache para evitar revalidaciones infinitas)
  const headers = new Headers({
    "Cache-Control": "private, max-age=60",
  });

  return json({
    user,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      // Debug info solo en desarrollo
      ...(process.env.NODE_ENV === "development" ? { debug: getEnvDebugInfo() } : {}),
    }
  }, { headers });
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

  // Log debug info en desarrollo
  if (env.NODE_ENV === "development" && env.debug) {
    console.log("[App] Environment:", env.debug);
  }

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