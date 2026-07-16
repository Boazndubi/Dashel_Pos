import axios from "axios"

// ─── Shared config ───
// next.config.js rewrites /api/:path* -> http://localhost:5000/api/:path*
// so both apiFetch and the axios instance just hit relative "/api" paths.
const BASE_URL = "/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function handleUnauthorized() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}

// ─── fetch-based client ───
// Used by pages that call apiFetch("/contacts"), apiFetch("/orders"), etc.
interface ApiFetchOptions extends RequestInit {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const token = getToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    handleUnauthorized()
    throw new Error("Session expired. Please log in again.")
  }

  // 204 No Content (e.g. DELETE) has no body to parse
  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`)
  }

  return data
}

// ─── Dashboard ───
export async function fetchDashboardData() {
  return apiFetch("/dashboard")
}

// ─── axios instance ───
// Used by pages that do `import api from "@/src/lib/api"` then api.get/post/put/delete
// (e.g. products.tsx). Kept alongside apiFetch since both patterns exist in this codebase.
const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    }
    return Promise.reject(error)
  }
)

export default api
