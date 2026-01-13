import { Link } from "react-router-dom";
import { logoutUser } from "../api/auth";

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <nav className="navbar">
      <h1>VoteApp</h1>
      <div className="navbar-links">
        <Link to="/">Polls</Link>
        {user && <Link to="/create">Create</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <button onClick={logoutUser} className="btn-secondary">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
