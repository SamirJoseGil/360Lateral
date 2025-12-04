// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import "./tailwind.css";
import leafletStyles from '~/styles/leaflet.css?url';
import { getUser } from "~/utils/auth.server";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { NotificationProvider } from "~/contexts/NotificationContext";
import NotificationBell from "~/components/NotificationBell";

// CRÍTICO: Loader SIN timestamp para evitar revalidaciones infinitas
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Root] User: ${user ? user.email : 'None'}`);
  }

  return json({
    user,
    env: {
      API_URL: process.env.API_URL || 'http://localhost:8000',
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
        {/* ✅ NUEVO: Exponer variables de entorno al cliente */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify({
              API_URL: typeof window === 'undefined' 
                ? process.env.API_URL || 'http://localhost:8000'
                : window.ENV?.API_URL || 'http://localhost:8000'
            })}`,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: leafletStyles },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    crossOrigin: "anonymous"
  },
];

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  const shouldHideNavbarAndFooter = () => {
    const dashboardRoutes = ['/admin', '/developer', '/owner'];
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

    const isDashboard = dashboardRoutes.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    const isAuth = authRoutes.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    return isDashboard || isAuth;
  };

  const showNavbarAndFooter = !shouldHideNavbarAndFooter();

  return (
    <>
      {showNavbarAndFooter && <Navbar />}

      {/* ✅ NUEVO: Campana de notificaciones flotante (solo si hay usuario) */}
      {user && (
        <NotificationProvider>
          <div className="fixed top-4 right-4 z-50">
            <NotificationBell />
          </div>
          <Outlet />
        </NotificationProvider>
      )}

      {/* Si no hay usuario, solo mostrar el Outlet sin notificaciones */}
      {!user && <Outlet />}

      {showNavbarAndFooter && <Footer />}
    </>
  );
}