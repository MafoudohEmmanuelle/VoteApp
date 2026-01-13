import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPoll, vote } from "../api/polls";
import { connectToPollSocket } from "../api/socket";
import LiveResults from "../components/LiveResults";

export default function Vote() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [token, setToken] = useState("");
  const [results, setResults] = useState({});

  useEffect(() => {
    fetchPoll(pollId).then(setPoll);

    const socket = connectToPollSocket(pollId, data => {
      setResults(data.votes || {});
    });

    return () => socket.close();
  }, [pollId]);

  if (!poll) return null;

  const handleVote = async (choiceId) => {
    try {
      await vote(poll.id, choiceId, token);
      alert("Vote recorded");
    } catch (err) {
      alert(err.response?.data?.error || "Error voting");
    }
  };

  return (
    <div className="page">
      <h2>{poll.title}</h2>
      {poll.voting_mode === "restricted" && (
        <input
          placeholder="Voter token"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
      )}

      {poll.choices.map(c => (
        <button key={c.id} className="btn" onClick={() => handleVote(c.id)}>
          {c.text}
        </button>
      ))}

      <h3>Live Results</h3>
      <LiveResults choices={poll.choices} results={results} />
    </div>
  );
}
