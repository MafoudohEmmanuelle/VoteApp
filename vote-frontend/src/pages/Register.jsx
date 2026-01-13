import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      alert("Error registering user");
    }
  };

  return (
    <div className="page">
      <form className="form" onSubmit={submit}>
        <h2>Register</h2>
        {["username","email","first_name","last_name","password","password2"].map(f => (
          <div className="form-group" key={f}>
            <label>{f}</label>
            <input
              type={f.includes("password") ? "password" : "text"}
              onChange={e => setForm({...form, [f]: e.target.value})}
            />
          </div>
        ))}
        <button className="btn">Register</button>
      </form>
    </div>
  );
}
