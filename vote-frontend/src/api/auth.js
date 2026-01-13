import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

// ---------------- JWT AUTH ----------------

export async function loginUser(data) {
  const res = await axios.post(`${API_URL}/login/`, data);
  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data.user;
}

export async function registerUser(data) {
  const res = await axios.post(`${API_URL}/register/`, data);
  return res.data;
}

export function logoutUser() {
  localStorage.clear();
}

export function getAuthHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}
