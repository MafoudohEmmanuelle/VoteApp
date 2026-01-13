import { useState } from "react";
import { createPoll } from "../api/polls";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";

export default function CreatePoll() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  if (!user) navigate("/login");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [choices, setChoices] = useState(["",""]);
  const [votingMode, setVotingMode] = useState("public"); // public / restricted
  const [isPublic, setIsPublic] = useState(true);

  const submit = async () => {
    await createPoll({
      title,
      description,
      choices: choices.map(text => ({ text })),
      voting_mode: votingMode,
      is_public: isPublic
    });
    navigate("/");
  };

  return (
    <div className="page">
      <h2>Create Poll</h2>
      <div className="form-group">
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div>
        <label>Voting Mode:</label>
        <select onChange={e => setVotingMode(e.target.value)}>
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      <div>
        <label>Choices:</label>
        {choices.map((c, i) => (
          <input key={i} value={c} onChange={e => {
            const copy = [...choices];
            copy[i] = e.target.value;
            setChoices(copy);
          }} />
        ))}
        <button onClick={() => setChoices([...choices, ""])}>Add Choice</button>
      </div>

      <button className="btn" onClick={submit}>Create Poll</button>
    </div>
  );
}
