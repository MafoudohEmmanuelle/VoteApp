import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Polls from "./pages/Polls";
import CreatePoll from "./pages/CreatePoll";
import Vote from "./pages/Vote";
import { getCurrentUser } from "./api/auth";

function PrivateRoute({ children }) {
  const user = getCurrentUser();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Polls />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/create"
            element={<PrivateRoute><CreatePoll /></PrivateRoute>}
          />
          <Route path="/vote/:pollId" element={<Vote />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
