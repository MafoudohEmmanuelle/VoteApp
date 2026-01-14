import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";

export default function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          {/* Dashboard (default route) */}
          <Route path="/" element={<Dashboard />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Poll creation */}
          <Route path="/create" element={<CreatePoll />} />

          {/* Poll detail & voting */}
          <Route path="/poll/:pollId" element={<PollDetail />} />
        </Routes>
      </div>
    </Router>
  );
}
