import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
    // Redirigir a la página "about"
    return redirect("/about");
}

// Este componente nunca se renderizará debido a la redirección
export default function Nosotros() {
    return null;
}
