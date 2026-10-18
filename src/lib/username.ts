/** Login is by user name only; auth needs an email, so we derive a fixed internal one from the name. */
export const LOGIN_DOMAIN = "usuarios.oticalouise.app";

export function normalizeUsername(nome: string): string {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()
    .replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "").replace(/\.+/g, ".").replace(/^\.|\.$/g, "");
}

/** Accounts created before name-only login still sign in with their e-mail. */
export function loginEmail(input: string): string {
  const v = input.trim();
  return v.includes("@") ? v.toLowerCase() : `${normalizeUsername(v)}@${LOGIN_DOMAIN}`;
}

export function displayLogin(email: string): string {
  return email.endsWith(`@${LOGIN_DOMAIN}`) ? email.slice(0, -LOGIN_DOMAIN.length - 1) : email;
}
