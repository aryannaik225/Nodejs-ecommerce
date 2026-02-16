const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

let refreshPromise: Promise<any> | null = null;

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `${BASE_URL}/api/${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers && typeof options.headers === "object" && !Array.isArray(options.headers)) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers: headers as HeadersInit,
  });

  if (response.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to refresh token")
          const data  = await res.json()
          localStorage.setItem("token", data.token);
          return data.token;
        })
      }

      const newToken = await refreshPromise

      const newHeaders = {
        ...headers,
        "Authorization": `Bearer ${newToken}`,
      }
    } catch (error) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/auth"
    } finally {
      refreshPromise = null;
    }
  }

  return response;
};