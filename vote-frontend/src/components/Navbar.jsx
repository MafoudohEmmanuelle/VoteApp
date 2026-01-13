import { Link, useNavigate } from "react-router-dom";
import { logoutUser, getCurrentUser } from "../api/auth";

export default function Navbar() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h1>VoteApp</h1>
      <div className="navbar-links">
        <Link to="/">Polls</Link>
        {user && <Link to="/create">Create Poll</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
