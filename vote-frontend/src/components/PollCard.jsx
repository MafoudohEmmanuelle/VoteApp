import { Link } from "react-router-dom";

export default function PollCard({ poll }) {
  return (
    <div className="poll-card">
      <h3>{poll.title}</h3>
      <p>{poll.description}</p>
      <Link className="btn" to={`/vote/${poll.id}`}>
        Vote
      </Link>
    </div>
  );
}
