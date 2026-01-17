import axios from "axios";
import { getAuthHeader, getAuthHeaderWithRefresh } from "./auth";

const API_URL = "http://127.0.0.1:8000/api";

export async function fetchPolls() {
  const res = await axios.get(`${API_URL}/polls/`);
  return res.data;
}

export async function fetchUserPolls() {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.get(`${API_URL}/polls/`, {
    headers,
    params: { owner: true }
  });
  // Filter to show only polls created by the current user
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchPoll(publicId) {
  const res = await axios.get(`${API_URL}/polls/${publicId}/`);
  return res.data;
}

export async function createPoll(data) {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.post(`${API_URL}/polls/create/`, data, {
    headers
  });
  return res.data;
}

export async function vote(pollId, choiceId, voterToken) {
  // Generate a unique token for open polls if not provided
  const token = voterToken || `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const res = await axios.post(`${API_URL}/polls/${pollId}/vote/`, {
    choice_id: choiceId,
    voter_token: token
  });
  return res.data;
}

export async function generateTokens(pollId, count) {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.post(
    `${API_URL}/polls/${pollId}/tokens/`,
    { count },
    { headers }
  );
  return res.data.tokens;
}

export async function finalizePoll(pollId) {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.post(
    `${API_URL}/polls/${pollId}/finalize/`,
    {},
    { headers }
  );
  return res.data;
}

export async function getPollTokens(pollId) {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.get(
    `${API_URL}/polls/${pollId}/get-tokens/`,
    { headers }
  );
  return res.data;
}

export async function deletePoll(pollId) {
  const headers = await getAuthHeaderWithRefresh();
  const res = await axios.delete(
    `${API_URL}/polls/${pollId}/delete/`,
    { headers }
  );
  return res.data;
}

