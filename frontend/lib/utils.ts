import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend file endpoints (profile photos, certificates, course images) return
// paths relative to the backend, e.g. "/profiles/employee_123_167.jpg". The
// frontend and backend run on different origins (ports 3000 vs 8080 locally,
// separate containers/hosts once deployed), so those paths need the API
// origin prefixed before they can be used as an <img>/<Image> src. Already-
// absolute URLs (default avatar fallback, external URLs) are passed through.
export function resolveUploadUrl(path?: string | null): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  return path.startsWith("/") ? `${apiUrl}${path}` : `${apiUrl}/${path}`
}
