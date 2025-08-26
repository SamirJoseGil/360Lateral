// app/routes/api.auth.login.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { commitAuthCookies } from "~/utils/auth.server";
import { ENV } from "~/env.server";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const res = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    return json({ error: data?.message ?? "Credenciales inválidas" }, { status: 401 });
  }

  const { token, refreshToken, user } = data.data;
  const headers = await commitAuthCookies({ access: token, refresh: refreshToken });
  return json({ user }, { headers });
}
