// app/routes/api.auth.me.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user, headers } = await getUser(request);
    return json({ user }, { headers });
  } catch {
    return json({ user: null }, { status: 401 });
  }
}
