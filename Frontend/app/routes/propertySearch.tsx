import { json } from "@remix-run/node";


import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const searchType = url.searchParams.get("type");
    const searchValue = url.searchParams.get("value");

    if (!searchType || !searchValue) {
        return json({ property: null });
    }

    try {
        let endpoint = '';
        let payload = {};

        switch (searchType) {
            case 'cbml':
                endpoint = '/api/lotes/public/cbml/';
                payload = { cbml: searchValue };
                break;
            case 'matricula':
                endpoint = '/api/lotes/public/matricula/';
                payload = { matricula: searchValue };
                break;
            case 'direccion':
                endpoint = '/api/lotes/public/direccion/';
                payload = { direccion: searchValue };
                break;
            default:
                return json({ property: null });
        }

        // ...existing code for fetching data from the endpoint and returning the response...
    } catch (error) {
        // ...existing error handling code...
    }
}