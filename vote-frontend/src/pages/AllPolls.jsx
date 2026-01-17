import { useEffect, useState } from "react";
import { fetchUserPolls, getPollTokens, deletePoll } from "../api/polls";
import { useNavigate } from "react-router-dom";

export default function AllPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [tokens, setTokens] = useState({});
  const [tokensLoading, setTokensLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchUserPolls()
      .then(setPolls)
      .catch(() => setPolls([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExpandPoll = async (pollId) => {
    if (expandedPoll === pollId) {
      setExpandedPoll(null);
      return;
    }

    setExpandedPoll(pollId);
    
    // Load tokens if restricted poll
    const poll = polls.find(p => p.public_id === pollId);
    if (poll.voting_mode === "restricted" && !tokens[pollId]) {
      setTokensLoading(prev => ({ ...prev, [pollId]: true }));
      try {
        const tokensData = await getPollTokens(pollId);
        setTokens(prev => ({ ...prev, [pollId]: tokensData.tokens }));
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setTokensLoading(prev => ({ ...prev, [pollId]: false }));
      }
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      try {
        await deletePoll(pollId);
        setPolls(polls.filter(p => p.public_id !== pollId));
        setExpandedPoll(null);
      } catch (err) {
        alert("Failed to delete poll: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleCopyLink = (pollId) => {
    const voteLink = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(voteLink);
    alert("Vote link copied to clipboard!");
  };

  const handleCopyTokens = (pollId) => {
    const pollTokens = tokens[pollId];
    if (pollTokens && pollTokens.length > 0) {
      navigator.clipboard.writeText(pollTokens.join('\n'));
      alert("Tokens copied to clipboard!");
    }
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <h2>All My Polls</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading polls...</p>
      ) : polls.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any polls yet.</p>
          <button className="btn" onClick={() => navigate("/create")}>
            Create Your First Poll
          </button>
        </div>
      ) : (
        <div className="all-polls-container">
          {polls.map(poll => {
            const totalVotes = poll.results 
              ? Object.values(poll.results).reduce((a, b) => a + b, 0)
              : 0;
            const createdDate = new Date(poll.created_at).toLocaleDateString();
            const isExpanded = expandedPoll === poll.public_id;
            
            return (
              <div key={poll.public_id} className="poll-detail-card">
                <div 
                  className="poll-card-header"
                  onClick={() => handleExpandPoll(poll.public_id)}
                >
                  <div className="poll-header-content">
                    <h3>{poll.title}</h3>
                    <div className="poll-meta-inline">
                      <span className="badge">
                        {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                      </span>
                      <span className={`badge ${poll.voting_mode === 'open' ? 'badge-public' : 'badge-restricted'}`}>
                        {poll.voting_mode === 'open' ? '🔓 Open' : '🔒 Restricted'}
                      </span>
                      <span className="badge">📊 {totalVotes} votes</span>
                      <span className="badge-date">{createdDate}</span>
                    </div>
                  </div>
                  <div className="expand-icon">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="poll-card-expanded">
                    {poll.description && (
                      <div className="poll-description-section">
                        <h4>Description</h4>
                        <p>{poll.description}</p>
                      </div>
                    )}

                    <div className="poll-results-section">
                      <h4>Results</h4>
                      <div className="results-grid">
                        {poll.choices.map(choice => {
                          const votes = poll.results ? poll.results[choice.id] || 0 : 0;
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          return (
                            <div key={choice.id} className="result-item">
                              <div className="result-header">
                                <span className="result-label">{choice.text}</span>
                                <span className="result-count">{votes} ({percentage}%)</span>
                              </div>
                              <div className="result-bar">
                                <div 
                                  className="result-bar-fill" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="poll-sharing-section">
                      <h4>Share with Voters</h4>
                      <div className="share-group">
                        <label>Voting Link</label>
                        <div className="share-content">
                          <input 
                            readOnly 
                            value={`${window.location.origin}/poll/${poll.public_id}`}
                            className="share-input"
                          />
                          <button 
                            className="btn-copy"
                            onClick={() => handleCopyLink(poll.public_id)}
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>

                      {poll.voting_mode === 'restricted' && (
                        <div className="share-group">
                          <label>Voter Tokens</label>
                          {tokensLoading[poll.public_id] ? (
                            <p className="loading-small">Loading tokens...</p>
                          ) : tokens[poll.public_id] && tokens[poll.public_id].length > 0 ? (
                            <div className="share-content">
                              <textarea 
                                readOnly 
                                value={tokens[poll.public_id].join('\n')}
                                className="share-input tokens"
                                rows={Math.min(tokens[poll.public_id].length, 5)}
                              />
                              <button 
                                className="btn-copy"
                                onClick={() => handleCopyTokens(poll.public_id)}
                              >
                                📋 Copy
                              </button>
                            </div>
                          ) : (
                            <p className="text-muted">No tokens generated yet</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="poll-actions-footer">
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeletePoll(poll.public_id)}
                      >
                        🗑️ Delete Poll
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
