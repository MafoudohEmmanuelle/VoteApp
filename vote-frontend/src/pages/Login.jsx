import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    await loginUser(form);
    navigate("/");
  };

  return (
    <div className="page">
      <form className="form" onSubmit={submit}>
        <h2>Login</h2>

        <div className="form-group">
          <label>Username</label>
          <input onChange={e => setForm({...form, username: e.target.value})} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" onChange={e => setForm({...form, password: e.target.value})} />
        </div>

        <button className="btn">Login</button>
      </form>
    </div>
  );
}
