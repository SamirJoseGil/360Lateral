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
import { useEffect, useState } from "react";

import "./tailwind.css";
import { getUser } from "./utils/auth.server";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { StatsProvider, PageViewTracker } from "./components/StatsTracker";
import { getOrCreateSessionId } from "./services/stats.server";

// 🔗 Cargar fuentes y estilos
export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
  },
];

// 📌 Loader global → obtiene el usuario (si existe)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log(`Root loader - route: ${url.pathname}`); // Debug ruta actual

  const user = await getUser(request); // usando función original
  console.log('Root loader - user:', user?.email, user?.role); // Debug info de usuario más compacta

  // Obtener o crear session ID para estadísticas
  const sessionId = getOrCreateSessionId(request);

  return json({
    user,
    sessionId,
    ENV: {
      API_URL: process.env.API_URL || "http://localhost:8000",
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

// 📌 App principal
export default function App() {
  const data = useLoaderData<typeof loader>();
  const [currentUser, setCurrentUser] = useState(data.user);

  // Mantener el estado del usuario actualizado cuando cambia en el loader
  useEffect(() => {
    setCurrentUser(data.user);
  }, [data.user]);

  // Escuchar evento personalizado para logout
  useEffect(() => {
    const handleLogout = () => {
      console.log("Auth logout event detected, updating state");
      setCurrentUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  return (
    <StatsProvider sessionId={data.sessionId}>
      <html lang="es" className="h-full">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="h-full">
          {/* Stats tracking for all page views */}
          <PageViewTracker />

          <div className="flex flex-col min-h-screen">
            <Navbar user={currentUser} />
            <main className="flex-grow">
              <Outlet />
            </main>
            <Footer />
          </div>

          {/* 
            Script mejorado para detectar cambios en las cookies
            y actualizar el estado de autenticación
          */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Función para detectar cambios en las cookies
                function checkCookieChanges() {
                  const currentCookies = document.cookie;
                  if (window.lastKnownCookies && window.lastKnownCookies !== currentCookies) {
                    console.log("Cookie changes detected");
                    
                    // Verificar específicamente si las cookies de autenticación fueron eliminadas
                    const hasAuthCookie = document.cookie.includes('l360_access=');
                    const hadAuthCookie = window.lastKnownCookies.includes('l360_access=');
                    
                    if (hadAuthCookie && !hasAuthCookie) {
                      console.log("Auth cookies removed, refreshing app state");
                      // Disparar un evento de cierre de sesión
                      window.dispatchEvent(new CustomEvent('auth:logout'));
                      // Recargar la página para actualizar todo el estado
                      window.location.reload();
                    }
                  }
                  window.lastKnownCookies = currentCookies;
                }
                
                // Establecer el estado inicial de las cookies
                window.lastKnownCookies = document.cookie;
                
                // Comprobar cambios cada 500ms
                setInterval(checkCookieChanges, 500);
                
                // También escuchar evento personalizado
                window.addEventListener('auth:logout', function() {
                  console.log("Auth logout event detected, refreshing");
                });
              `,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(
                data.ENV
              )}`,
            }}
          />
        </body>
      </html>
    </StatsProvider>
  );
}