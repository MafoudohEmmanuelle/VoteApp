import axios from "axios";
import { getAuthHeader } from "./auth";

const API_URL = "http://127.0.0.1:8000/api";

export async function fetchPolls() {
  const res = await axios.get(`${API_URL}/polls/`);
  return res.data;
}

export async function fetchPoll(id) {
  const res = await axios.get(`${API_URL}/polls/${id}/`);
  return res.data;
}

export async function createPoll(data) {
  const res = await axios.post(
    `${API_URL}/polls/create/`,
    data,
    { headers: getAuthHeader() }
  );
  return res.data;
}

export async function vote(pollId, choiceId, voterToken) {
  return axios.post(`${API_URL}/polls/${pollId}/vote/`, {
    choice_id: choiceId,
    voter_token: voterToken
  });
}
