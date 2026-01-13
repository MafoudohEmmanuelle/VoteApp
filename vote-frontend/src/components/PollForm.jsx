import { useState } from "react";
import { createPoll } from "../api/polls";

export default function PollForm({ onPollCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingMode, setVotingMode] = useState("public");
  const [choices, setChoices] = useState(["", ""]);
  const [tokens, setTokens] = useState([]);

  const handleAddChoice = () => setChoices([...choices, ""]);

  const handleChoiceChange = (index, value) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const pollData = { title, description, voting_mode: votingMode, choices };
      const res = await createPoll(pollData);

      // If restricted, show tokens
      if (votingMode === "restricted" && res.tokens) {
        setTokens(res.tokens);
      }

      onPollCreated?.(res);
    } catch (err) {
      alert(err.response?.data?.error || "Error creating poll");
    }
  };

  return (
    <div className="form">
      <h2>Create Poll</h2>
      <div className="form-group">
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Voting Mode</label>
        <select value={votingMode} onChange={e => setVotingMode(e.target.value)}>
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      <div>
        <label>Choices</label>
        {choices.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={e => handleChoiceChange(i, e.target.value)}
            style={{ display: "block", marginBottom: "0.5rem" }}
          />
        ))}
        <button className="btn-secondary" type="button" onClick={handleAddChoice}>
          Add Choice
        </button>
      </div>

      <button className="btn" onClick={handleSubmit}>
        Create Poll
      </button>

      {tokens.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Generated Tokens (copy them!)</h3>
          <textarea readOnly style={{ width: "100%", minHeight: "3rem" }} value={tokens.join("\n")} />
        </div>
      )}
    </div>
  );
}
