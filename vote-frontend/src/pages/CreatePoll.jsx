import PollForm from "../components/PollForm";
import { useNavigate } from "react-router-dom";

export default function CreatePoll() {
  const navigate = useNavigate();

  const handlePollCreated = (poll) => {
    // Redirect to dashboard to see the poll card with tokens and link
    navigate("/");
  };

  return (
    <div className="page">
      <PollForm onPollCreated={handlePollCreated} />
    </div>
  );
}
