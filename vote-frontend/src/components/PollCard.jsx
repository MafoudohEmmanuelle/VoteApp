import { useState, useEffect } from "react";
import { fetchPoll } from "../api/polls";
import LiveResults from "./LiveResults";

export default function PollCard({ poll }) {
  const [copiedVoteLink, setCopiedVoteLink] = useState(false);
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [results, setResults] = useState({});
  const [pollData, setPollData] = useState(poll);

  const voteLink = `${window.location.origin}/poll/${poll.public_id}`;

  // Poll for live results every 2 seconds
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await fetchPoll(poll.public_id);
        setResults(data.results || {});
        setPollData(data);
      } catch (err) {
        // Silently fail
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [poll.public_id]);

  const handleCopyVoteLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voteLink);
    setCopiedVoteLink(true);
    setTimeout(() => setCopiedVoteLink(false), 2000);
  };

  const handleCopyTokens = (e) => {
    e.stopPropagation();
    if (pollData.tokens && pollData.tokens.length > 0) {
      navigator.clipboard.writeText(pollData.tokens.join('\n'));
      setCopiedTokens(true);
      setTimeout(() => setCopiedTokens(false), 2000);
    }
  };

  return (
    <div className="poll-card">
      <h3>{pollData.title}</h3>
      {pollData.description && <p className="poll-description">{pollData.description}</p>}
      
      <div className="poll-badges">
        <span className="badge">Status: {pollData.status}</span>
        <span className={`badge ${pollData.voting_mode === 'open' ? 'badge-public' : 'badge-restricted'}`}>
          {pollData.voting_mode === 'open' ? '🔓 Open' : '🔒 Restricted'}
        </span>
      </div>

      {/* Live Results Section */}
      <div className="poll-results-preview">
        <h4>Live Results</h4>
        <LiveResults choices={pollData.choices || []} results={results} />
      </div>

      <div className="poll-share">
        <div className="share-item">
          <label>Vote Link:</label>
          <div className="share-content">
            <input type="text" value={voteLink} readOnly className="share-input" />
            <button 
              className="btn-copy"
              onClick={handleCopyVoteLink}
              title="Copy vote link"
            >
              {copiedVoteLink ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {pollData.voting_mode === 'restricted' && pollData.tokens && pollData.tokens.length > 0 && (
          <div className="share-item">
            <label>Voter Tokens:</label>
            <div className="share-content">
              <textarea
                readOnly
                className="share-input tokens"
                value={pollData.tokens.join('\n')}
                rows={Math.min(pollData.tokens.length, 4)}
              />
              <button
                className="btn-copy"
                onClick={handleCopyTokens}
                title="Copy all tokens"
              >
                {copiedTokens ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
