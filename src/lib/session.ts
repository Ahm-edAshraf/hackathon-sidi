export const SESSION_COOKIE = "ledgerly_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function setCookie(value: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function setSession() {
  setCookie("active");
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_COOKIE, "active");
  }
}

export function clearSession() {
  setCookie("", -1);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_COOKIE);
  }
}

export function hasSession(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .some((chunk) => chunk.startsWith(`${SESSION_COOKIE}=`));
}
