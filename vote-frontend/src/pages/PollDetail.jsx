import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPoll, vote } from "../api/polls";
import { getCurrentUser, logoutUser } from "../api/auth";
import { connectToPollSocket } from "../api/socket";
import LiveResults from "../components/LiveResults";

export default function PollDetail() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState({});
  const [token, setToken] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [votedChoice, setVotedChoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadPoll = async () => {
      try {
        const data = await fetchPoll(pollId);
        setPoll(data);
        setResults(data.results || {});
        // For open polls, no token needed
        if (data.voting_mode === "open") {
          setTokenValidated(true);
        }
      } catch (err) {
        setError("Failed to load poll");
      } finally {
        setLoading(false);
      }
    };
    loadPoll();

    // Setup polling for live results (fallback when WebSocket unavailable)
    const pollInterval = setInterval(async () => {
      try {
        const data = await fetchPoll(pollId);
        if (data.results) {
          setResults(data.results);
        }
      } catch (err) {
        // Silently fail - polling is just for live updates
      }
    }, 2000); // Poll every 2 seconds

    const socket = connectToPollSocket(pollId, msg => {
      if (msg.votes) setResults(msg.votes);
    });

    return () => {
      clearInterval(pollInterval);
      socket.close();
    };
  }, [pollId]);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      setTokenValidated(true);
      setError("");
    } else {
      setError("Please enter a token");
    }
  };

  const handleVote = async (choiceId) => {
    setError("");
    setSuccess("");
    try {
      await vote(pollId, choiceId, token);
      setVotedChoice(choiceId);
      setSuccess("Vote recorded! Thank you for voting.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record vote");
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.location.reload();
  };

  if (loading) {
    return <div className="page"><p className="loading">Loading poll...</p></div>;
  }

  if (!poll) {
    return (
      <div className="page">
        <div className="error-state">
          <p>Poll not found</p>
          <button className="btn" onClick={() => navigate("/")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // If restricted poll and token not validated yet
  if (poll.voting_mode === "restricted" && !tokenValidated) {
    return (
      <div className="page">
        {user && (
          <div className="poll-page-header">
            <p className="warning-message">⚠️ You are logged in as <strong>{user.username}</strong>. Other voters should use a different browser or incognito mode to ensure vote independence.</p>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        )}
        <div className="poll-container">
          <h2>{poll.title}</h2>
          <p className="poll-description">{poll.description}</p>
          
          <div className="token-form-wrapper">
            <p className="token-info">This is a restricted poll. Please enter your token to participate.</p>
            <form className="token-form" onSubmit={handleTokenSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Voter Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Enter your voting token"
                  disabled={loading}
                />
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Validating..." : "Access Poll"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main voting interface
  return (
    <div className="page">
      {user && (
        <div className="poll-page-header">
          <p className="warning-message">⚠️ You are logged in as <strong>{user.username}</strong>. Other voters should use a different browser or incognito mode to ensure vote independence.</p>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
      <div className="poll-container">
        <h2>{poll.title}</h2>
        <p className="poll-description">{poll.description}</p>
        <p className="poll-meta">
          <span className="badge">Status: {poll.status}</span>
          <span className="badge badge-mode">{poll.voting_mode === "open" ? "Open" : "Restricted"}</span>
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="choices-section">
          <h3>Choose an option:</h3>
          <div className="choices-grid">
            {poll.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => handleVote(choice.id)}
                className={`choice-btn ${votedChoice === choice.id ? 'voted' : ''}`}
                disabled={votedChoice !== null}
              >
                <span className="choice-text">{choice.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="results-section">
          <h3>Live Results</h3>
          <LiveResults choices={poll.choices} results={results} />
        </div>
      </div>
    </div>
  );
}
