import { useEffect, useState } from "react";
import { fetchPolls } from "../api/polls";
import PollCard from "../components/PollCard";

export default function Polls() {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    fetchPolls().then(setPolls);
  }, []);

  return (
    <div className="page">
      <h2>Available Polls</h2>
      {polls.map(p => <PollCard key={p.id} poll={p} />)}
    </div>
  );
}
