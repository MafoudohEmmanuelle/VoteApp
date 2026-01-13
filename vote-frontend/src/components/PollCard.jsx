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
        onClick={() => navigate(`/poll/${poll.id}`)}
      >
        View Details
      </button>

      {poll.voting_mode === "restricted" && poll.tokens?.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <p>Tokens:</p>
          <textarea
            readOnly
            style={{ width: "100%", minHeight: "3rem" }}
            value={poll.tokens.join("\n")}
          />
        </div>
      )}
    </div>
  );
}
