import { useEffect, useState } from "react";
import { fetchUserPolls } from "../api/polls";
import PollCard from "../components/PollCard";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchUserPolls()
      .then(setPolls)
      .catch(() => setPolls([]))
      .finally(() => setLoading(false));
  }, []);

  // Show only 2 most recent polls
  const recentPolls = polls.slice(0, 2);

  return (
    <div className="page">
      <div className="dashboard-header">
        <h2>My Polls</h2>
        <button className="btn btn-primary" onClick={() => navigate("/create")}>
          ➕ Create New Poll
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading your polls...</p>
      ) : polls.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any polls yet.</p>
          <button className="btn" onClick={() => navigate("/create")}>
            Create Your First Poll
          </button>
        </div>
      ) : (
        <>
          <div className="polls-grid">
            {recentPolls.map(poll => (
              <PollCard key={poll.public_id} poll={poll} />
            ))}
          </div>

          {polls.length > 2 && (
            <div className="view-all-section">
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate("/polls")}
              >
                View All Polls ({polls.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
