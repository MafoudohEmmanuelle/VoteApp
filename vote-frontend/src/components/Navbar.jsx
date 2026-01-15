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
      <Link to="/" className="navbar-logo">
        <h1>VoteApp</h1>
      </Link>
      <div className="navbar-links">
        {user && (
          <>
            <span className="navbar-user">Welcome, {user.username}!</span>
            <Link to="/" className="navbar-link">Dashboard</Link>
            <Link to="/create" className="navbar-link">Create Poll</Link>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
