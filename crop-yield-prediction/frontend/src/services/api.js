import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});

/** Turn any axios failure into { message, fields, status } the UI can show. Never leaks internals. */
export function toApiError(err) {
  if (err.response?.data?.error) {
    const e = err.response.data.error;
    return { message: e.message, fields: e.details || {}, status: err.response.status, code: e.code };
  }
  if (err.code === "ECONNABORTED") return { message: "The server took too long to respond.", fields: {}, status: 0 };
  return { message: "Cannot reach the server. Check that the backend is running.", fields: {}, status: 0 };
}

const wrap = async (promise) => {
  try {
    return (await promise).data;
  } catch (err) {
    throw toApiError(err);
  }
};

export const getHealth = () => client.get("/health", { validateStatus: () => true }).then((r) => r.data).catch((e) => { throw toApiError(e); });
export const getOptions = () => wrap(client.get("/options"));
export const postPrediction = (payload) => wrap(client.post("/predict", payload));
export const getPredictions = (params) => wrap(client.get("/predictions", { params }));
export const getPrediction = (id) => wrap(client.get(`/predictions/${id}`));
export const deletePrediction = (id) => wrap(client.delete(`/predictions/${id}`));
export const getDashboardStats = (params) => wrap(client.get("/dashboard/stats", { params }));
