// pages/PollDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPoll, vote } from "../api/polls";
import { connectToPollSocket } from "../api/socket";
import LiveResults from "../components/LiveResults";

export default function PollDetail() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [token, setToken] = useState("");
  const [results, setResults] = useState({});

  useEffect(() => {
    fetchPoll(pollId).then(data => {
      setPoll(data);
      setResults(data.results || {});
    });

    const socket = connectToPollSocket(pollId, msg => {
      if (msg.votes) setResults(msg.votes);
    });

    return () => socket.close();
  }, [pollId]);

  if (!poll) return <p>Loading...</p>;

  const handleVote = async (choiceId) => {
    try {
      await vote(poll.public_id, choiceId, token);
      alert("Vote recorded");
    } catch (err) {
      alert(err.response?.data?.error || "Voting failed");
    }
  };

  return (
    <div className="page">
      <h2>{poll.title}</h2>
      <p>{poll.description}</p>

      {poll.voting_mode === "restricted" && (
        <input
          placeholder="Voter token"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
      )}

      {poll.choices.map(c => (
        <button key={c.id} onClick={() => handleVote(c.id)} className="btn">
          {c.text}
        </button>
      ))}

      <LiveResults choices={poll.choices} results={results} />
    </div>
  );
}
