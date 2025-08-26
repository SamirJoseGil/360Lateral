import { redirect } from "@remix-run/node";
import { API_URL } from "./auth.server";

export async function loginWithDebug(email: string, password: string) {
  console.log('=== DEBUG LOGIN START ===');
  console.log('Login attempt for:', email);
  console.log('API URL:', API_URL);

  try {
    // Direct fetch to API for login
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log('API response status:', response.status);
    console.log('API response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API error:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log('API response data structure:', Object.keys(data));
    
    return {
      success: true,
      data,
      access: data.access || data.token || data.data?.access,
      refresh: data.refresh || data.refreshToken || data.data?.refresh,
      user: data.user || data.data?.user
    };
  } catch (error) {
    console.log('Login debug error:', error);
    return { success: false, error: String(error) };
  } finally {
    console.log('=== DEBUG LOGIN END ===');
  }
}
