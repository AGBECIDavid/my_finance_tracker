const BASE = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("cf_token");
const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data;
};
export const api = {
  register: (b) => req("POST", "/auth/register", b),
  login:    (b) => req("POST", "/auth/login", b),
  me:       ()  => req("GET",  "/auth/me"),
  getTransactions:   ()      => req("GET",    "/transactions"),
  createTransaction: (b)     => req("POST",   "/transactions", b),
  deleteTransaction: (id)    => req("DELETE", `/transactions/${id}`),
  getCategories:     ()      => req("GET",    "/categories"),
  createCategory:    (b)     => req("POST",   "/categories", b),
  updateCategory:    (id, b) => req("PUT",    `/categories/${id}`, b),
  deleteCategory:    (id)    => req("DELETE", `/categories/${id}`),
};
