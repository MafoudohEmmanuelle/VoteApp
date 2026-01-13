import { useEffect, useState } from "react";
import { fetchUserPolls } from "../api/polls";
import PollCard from "../components/PollCard";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPolls().then(setPolls);
  }, []);

  return (
    <div className="page">
      <h2>Your Polls</h2>

      <button className="btn" onClick={() => navigate("/create")}>
        Create Poll
      </button>

      {polls.length === 0 ? (
        <p>You have not created any polls yet.</p>
      ) : (
        polls.map(poll => <PollCard key={poll.id} poll={poll} />)
      )}
    </div>
  );
}
