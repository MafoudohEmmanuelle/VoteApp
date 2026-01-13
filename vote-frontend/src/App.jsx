import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Polls from "./pages/Polls";
import CreatePoll from "./pages/CreatePoll";
import Vote from "./pages/Vote";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Polls />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/vote/:pollId" element={<Vote />} />
      </Routes>
    </div>
  );
}
