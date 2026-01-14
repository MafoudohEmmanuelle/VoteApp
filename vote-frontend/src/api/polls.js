import axios from "axios";
import { getAuthHeader } from "./auth";

const API_URL = "http://127.0.0.1:8000/api";

export async function fetchPolls() {
  const res = await axios.get(`${API_URL}/polls/`);
  return res.data;
}

export async function fetchPoll(publicId) {
  const res = await axios.get(`${API_URL}/polls/${publicId}/`);
  return res.data;
}

export async function createPoll(data) {
  const res = await axios.post(`${API_URL}/polls/create/`, data, {
    headers: getAuthHeader()
  });
  return res.data;
}

export async function vote(pollId, choiceId, voterToken) {
  const res = await axios.post(`${API_URL}/polls/${pollId}/vote/`, {
    choice_id: choiceId,
    voter_token: voterToken
  });
  return res.data;
}

export async function generateTokens(pollId, count) {
  const res = await axios.post(
    `${API_URL}/polls/${pollId}/tokens/`,
    { count },
    { headers: getAuthHeader() }
  );
  return res.data.tokens;
}

export async function finalizePoll(pollId) {
  const res = await axios.post(
    `${API_URL}/polls/${pollId}/finalize/`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
}

