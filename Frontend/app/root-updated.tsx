import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import "./tailwind.css";

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

export const loader: LoaderFunction = async ({ request }) => {
    // Configuración del entorno para el cliente
    return json({
        ENV: {
            API_URL: process.env.API_URL || "http://localhost:8000",
            NODE_ENV: process.env.NODE_ENV || "development",
        },
    });
};

export default function App() {
    const data = useLoaderData<typeof loader>();

    return (
        <html lang="es">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="bg-gray-50 min-h-screen">
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
                    }}
                />
                <LiveReload />
            </body>
        </html>
    );
}

// Declaración global para TypeScript
declare global {
    interface Window {
        ENV: {
            API_URL: string;
            NODE_ENV: string;
        };
    }
}