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
import { getUser } from "./utils/auth.server";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

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
];

// 📌 Loader global → obtiene el usuario (si existe)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log(`Root loader - route: ${url.pathname}`); // Debug ruta actual

  const user = await getUser(request); // usando función original
  console.log('Root loader - user:', user?.email, user?.role); // Debug info de usuario más compacta

  return json({ user });
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

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />

      {/* 
        Este script ayuda a manejar la actualización del estado de autenticación
        en toda la aplicación. Es especialmente útil para cerrar sesión.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Función para detectar cambios en las cookies
            function checkCookieChanges() {
              const currentCookies = document.cookie;
              if (window.lastKnownCookies && window.lastKnownCookies !== currentCookies) {
                // Las cookies han cambiado, verificar si las de autenticación fueron eliminadas
                if (!document.cookie.includes('l360_access=') && !document.cookie.includes('l360_session=')) {
                  console.log("Auth cookies removed, refreshing app state");
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
              window.location.reload();
            });
          `,
        }}
      />
    </>
  );
}