import PollForm from "../components/PollForm";
import { useNavigate } from "react-router-dom";

export default function CreatePoll() {
  const navigate = useNavigate();

  const handlePollCreated = (poll) => {
    navigate(`/poll/${poll.public_id}`);
  };

  return (
    <div className="page">
      <PollForm onPollCreated={handlePollCreated} />
    </div>
  );
}
