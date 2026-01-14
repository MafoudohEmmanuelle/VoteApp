import { useNavigate } from "react-router-dom";

export default function PollCard({ poll }) {
  const navigate = useNavigate();

  return (
    <div className="poll-card">
      <h3>{poll.title}</h3>
      <p>{poll.description}</p>
      <p>Status: {poll.status}</p>
      <p>Voting Mode: {poll.voting_mode}</p>

      <button
        className="btn btn-secondary"
        onClick={() => navigate(`/poll/${poll.public_id}`)}
      >
        View Details
      </button>
    </div>
  );
}
