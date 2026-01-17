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
    
    if (res.data.access) {
      localStorage.setItem("access", res.data.access);
      return true;
    }
    return false;
  } catch (err) {
    // Refresh failed, clear tokens and redirect to login
    localStorage.clear();
    window.location.href = "/login";
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
  const token = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");
  
  if (!token || !refresh) {
    // No tokens, redirect to login
    window.location.href = "/login";
    return {};
  }

  // Try to refresh the token to ensure it's valid
  const refreshed = await refreshAccessToken();
  
  if (!refreshed) {
    // Refresh failed, token cleared and redirected already
    return {};
  }
  
  // Get the refreshed token
  const newToken = localStorage.getItem("access");
  return newToken ? { Authorization: `Bearer ${newToken}` } : {};
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
