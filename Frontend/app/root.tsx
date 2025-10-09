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
import Navbar from "./components/navbar";
import Footer from "./components/footer";

// CRÍTICO: Loader SIN timestamp para evitar revalidaciones infinitas
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUser(request);

    // NO usar headers de no-cache aquí, causan revalidaciones infinitas
    return json({
      user,
      env: {
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error("Error in root loader:", error);
    return json({
      user: null,
      env: {
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  }
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
  const { user } = useLoaderData<typeof loader>();

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