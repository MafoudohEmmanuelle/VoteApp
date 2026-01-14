// components/PollForm.jsx
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

  const handleAddChoice = () => setChoices([...choices, ""]);

  const handleChoiceChange = (index, value) => {
    const copy = [...choices];
    copy[index] = value;
    setChoices(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const poll = await createPoll({
        title,
        description,
        voting_mode: votingMode,
        starts_at: startsAt,
        ends_at: endsAt,
        choices: choices.map((c, i) => ({ text: c, order: i }))
      });

      if (votingMode === "restricted") {
        const generated = await generateTokens(poll.public_id, tokenCount);
        setTokens(generated);
      }

      onPollCreated?.(poll);
    } catch (err) {
      alert(err.response?.data?.error || "Error creating poll");
    }
  };

  return (
    <div className="form">
      <h2>Create Poll</h2>

      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

      <select value={votingMode} onChange={e => setVotingMode(e.target.value)}>
        <option value="open">Open</option>
        <option value="restricted">Restricted</option>
      </select>

      {votingMode === "restricted" && (
        <input
          type="number"
          min="1"
          value={tokenCount}
          onChange={e => setTokenCount(e.target.value)}
          placeholder="Number of tokens"
        />
      )}

      {choices.map((c, i) => (
        <input
          key={i}
          value={c}
          onChange={e => handleChoiceChange(i, e.target.value)}
          placeholder={`Choice ${i + 1}`}
        />
      ))}

      <button type="button" onClick={handleAddChoice}>Add choice</button>
      <button className="btn" onClick={handleSubmit}>Create Poll</button>

      {tokens.length > 0 && (
        <>
          <h3>Generated Tokens</h3>
          <textarea readOnly value={tokens.join("\n")} />
        </>
      )}
    </div>
  );
}
