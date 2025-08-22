import { LinksFunction } from "@remix-run/node";
import "./tailwind.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import Footer from "./components/organisms/Footer";
import { Navbar } from "./components/organisms/Navbar";
import { AuthProvider } from "~/components/auth/AuthProvider";
import AuditDebug from "~/components/auth/AuditDebug";

// Estrategia de hidratación: Asegurar la consistencia cliente-servidor
export const clientHints = {
  mode: "media",
};

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
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  return (
    <html lang="es">
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <Outlet />
          <Footer />
          {process.env.NODE_ENV !== "production" && <AuditDebug />}
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}