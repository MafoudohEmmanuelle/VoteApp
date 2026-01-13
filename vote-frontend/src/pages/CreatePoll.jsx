import { useState } from "react";
import { createPoll } from "../api/polls";
import { useNavigate } from "react-router-dom";

export default function CreatePoll() {
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState(["",""]);
  const navigate = useNavigate();

  const submit = async () => {
    await createPoll({
      title,
      choices: choices.map(text => ({ text }))
    });
    navigate("/");
  };

  return (
    <div className="page">
      <h2>Create Poll</h2>

      <input placeholder="Title" onChange={e => setTitle(e.target.value)} />

      {choices.map((c, i) => (
        <input
          key={i}
          placeholder={`Choice ${i+1}`}
          onChange={e => {
            const copy = [...choices];
            copy[i] = e.target.value;
            setChoices(copy);
          }}
        />
      ))}

      <button onClick={() => setChoices([...choices, ""])}>Add Choice</button>
      <button className="btn" onClick={submit}>Create</button>
    </div>
  );
}
