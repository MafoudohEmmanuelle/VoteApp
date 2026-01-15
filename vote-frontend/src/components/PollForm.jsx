import { useState } from "react";
import { createPoll, generateTokens } from "../api/polls";

export default function PollForm({ onPollCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingMode, setVotingMode] = useState("open");
  const [choices, setChoices] = useState(["", ""]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tokens, setTokens] = useState([]);
  const [tokenCount, setTokenCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [created, setCreated] = useState(false);

  const handleAddChoice = () => setChoices([...choices, ""]);

  const handleRemoveChoice = (index) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const handleChoiceChange = (index, value) => {
    const copy = [...choices];
    copy[index] = value;
    setChoices(copy);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("Poll title is required");
      return false;
    }
    if (choices.some(c => !c.trim())) {
      setError("All choices must have text");
      return false;
    }
    if (choices.length < 2) {
      setError("You need at least 2 choices");
      return false;
    }
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      setError("End time must be after start time");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const pollData = {
        title,
        description,
        voting_mode: votingMode,
        is_public: votingMode === "open",
        choices: choices.map((text, i) => ({ text, order: i }))
      };

      if (startsAt) pollData.starts_at = startsAt;
      if (endsAt) pollData.ends_at = endsAt;

      const poll = await createPoll(pollData);

      if (votingMode === "restricted") {
        try {
          const generatedTokens = await generateTokens(poll.public_id, parseInt(tokenCount));
          // generatedTokens is already an array from the API
          setTokens(Array.isArray(generatedTokens) ? generatedTokens : []);
        } catch (tokenErr) {
          console.error("Token generation error:", tokenErr);
          setError("Poll created but token generation failed. Try generating tokens manually.");
          setCreated(true);
          onPollCreated?.(poll);
          return;
        }
      }

      setCreated(true);
      onPollCreated?.(poll);
    } catch (err) {
      let errorMsg = "Error creating poll";
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (typeof err.response?.data === 'object') {
        // Handle field-specific errors from serializer
        const firstError = Object.values(err.response.data)[0];
        if (Array.isArray(firstError)) {
          errorMsg = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMsg = firstError;
        }
      }
      setError(errorMsg);
      console.error("Poll creation error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTokens = () => {
    navigator.clipboard.writeText(tokens.join('\n'));
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  const handleCopyLink = () => {
    const voteLink = `${window.location.origin}/poll/`;
    navigator.clipboard.writeText(voteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (created && tokens.length === 0) {
    return (
      <div className="form">
        <h2>✓ Poll Created Successfully!</h2>
        <p className="success-message">Your open poll is ready. Share the voting link with participants.</p>
      </div>
    );
  }

  if (created && tokens.length > 0) {
    const voteLink = `${window.location.origin}/poll/`;
    return (
      <div className="form">
        <h2>✓ Restricted Poll Created!</h2>
        <p className="success-message">Your poll has been created. Share the voting link and tokens with participants below.</p>
        
        <div className="token-display">
          <h3>Voting Link</h3>
          <p className="token-info">Share this link with voters. They will need to enter a token to participate.</p>
          <div className="token-copy-section">
            <input readOnly value={voteLink} className="share-input" />
            <button className="btn-copy" onClick={handleCopyLink}>
              {copiedLink ? '✓ Copied' : '📋 Copy Link'}
            </button>
          </div>
        </div>

        <div className="token-display">
          <h3>Voter Tokens (Share These Safely)</h3>
          <p className="token-info">Copy these tokens and share them securely with your voters. Each token allows one vote.</p>
          <div className="token-copy-section">
            <textarea readOnly value={tokens.join('\n')} className="tokens-textarea" />
            <button className="btn-copy" onClick={handleCopyTokens}>
              {copiedTokens ? '✓ Copied to Clipboard' : '📋 Copy All Tokens'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Create a New Poll</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Poll Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What would you like to ask?"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add context or details about your poll (optional)"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Voting Mode *</label>
        <select value={votingMode} onChange={e => setVotingMode(e.target.value)} disabled={loading}>
          <option value="open">🔓 Open (Anyone can vote)</option>
          <option value="restricted">🔒 Restricted (Token required)</option>
        </select>
      </div>

      {votingMode === "restricted" && (
        <div className="form-group">
          <label>Number of Voter Tokens</label>
          <input
            type="number"
            min="1"
            value={tokenCount}
            onChange={e => setTokenCount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={loading}
          />
        </div>
      )}

      <div className="form-group">
        <label>Choices *</label>
        <div className="choices-input">
          {choices.map((c, i) => (
            <div key={i} className="choice-input-group">
              <input
                type="text"
                value={c}
                onChange={e => handleChoiceChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                disabled={loading}
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveChoice(i)}
                  className="btn-remove"
                  disabled={loading}
                  title="Remove choice"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddChoice}
          className="btn-secondary"
          disabled={loading}
        >
          ➕ Add Another Option
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Time (optional)</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>End Time (optional)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Creating poll..." : "Create Poll"}
      </button>
    </form>
  );
}
