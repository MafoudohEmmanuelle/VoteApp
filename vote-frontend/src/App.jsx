import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import { getCurrentUser } from "./api/auth";

function PrivateRoute({ children }) {
  const user = getCurrentUser();
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const user = getCurrentUser();
  const location = useLocation();
  const isPollPage = location.pathname.startsWith("/poll/");

  return (
    <div className="app">
      {user && !isPollPage && <Navbar />}
      <Routes>
        {/* Dashboard (default route - private) */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Poll creation (private) */}
        <Route path="/create" element={<PrivateRoute><CreatePoll /></PrivateRoute>} />

        {/* Poll detail & voting - public, no navbar */}
        <Route path="/poll/:pollId" element={<PollDetail />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
