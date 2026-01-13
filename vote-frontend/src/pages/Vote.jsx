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

  return (
    <div className="page">
      <h2>{poll.title}</h2>

      <input
        placeholder="Voter token"
        onChange={e => setToken(e.target.value)}
      />

      {poll.choices.map(c => (
        <button
          key={c.id}
          className="btn"
          onClick={() => vote(poll.id, c.id, token)}
        >
          {c.text}
        </button>
      ))}

      <LiveResults choices={poll.choices} results={results} />
    </div>
  );
}
