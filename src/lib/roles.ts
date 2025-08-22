
export type Role = "root" | "admin" | "coadmin" | "user" | "guest";

export function getRoleFromClaims(claims: any): Role {
  if (claims?.isRoot) return "root";
  const r = claims?.role ?? "";
  if (r === "admin") return "admin";
  if (r === "coadmin") return "coadmin";
  if (r === "user") return "user";
  return "guest";
}

export function isElevated(role: Role) {
  return role === "root" || role === "admin" || role === "coadmin";
}
