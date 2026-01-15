// api/auth.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

async function refreshAccessToken() {
  try {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return false;

    const res = await axios.post(`${API_URL}/auth/token/refresh/`, {
      refresh
    });
    
    localStorage.setItem("access", res.data.access);
    return true;
  } catch (err) {
    // Refresh failed, clear tokens
    localStorage.clear();
    return false;
  }
}

export async function loginUser(data) {
  const res = await axios.post(`${API_URL}/auth/login/`, data);
  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data.user;
}

export async function registerUser(data) {
  const res = await axios.post(`${API_URL}/auth/register/`, data);
  // Automatically log in after registration
  if (res.data.access && res.data.user) {
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function logoutUser() {
  try {
    await axios.post(`${API_URL}/auth/logout/`, {}, {
      headers: getAuthHeader()
    });
  } finally {
    localStorage.clear();
  }
}

export function getAuthHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAuthHeaderWithRefresh() {
  let token = localStorage.getItem("access");
  
  if (!token) {
    return {};
  }

  // Try to refresh the token to ensure it's valid
  await refreshAccessToken();
  
  // Get the (potentially refreshed) token
  token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
