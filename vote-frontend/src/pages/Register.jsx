import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fields = [
    { name: "username", label: "Username", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "first_name", label: "First Name", type: "text" },
    { name: "last_name", label: "Last Name", type: "text" },
    { name: "password", label: "Password", type: "password" },
    { name: "password2", label: "Confirm Password", type: "password" }
  ];

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      // After successful registration, redirect to dashboard (already logged in)
      navigate("/");
    } catch (err) {
      let errorMsg = "Registration failed";
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (typeof err.response?.data === 'object') {
        // Handle field-specific errors from serializer
        const fieldErrors = Object.entries(err.response.data);
        if (fieldErrors.length > 0) {
          const [field, messages] = fieldErrors[0];
          if (Array.isArray(messages)) {
            errorMsg = messages[0];
          } else if (typeof messages === 'string') {
            errorMsg = messages;
          }
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="form-container">
        <form className="form" onSubmit={submit}>
          <h2>Create Account</h2>

          {error && <div className="error-message">{error}</div>}

          {fields.map(field => (
            <div className="form-group" key={field.name}>
              <label>{field.label}</label>
              <input
                type={field.type}
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                value={form[field.name]}
                onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                disabled={loading}
              />
            </div>
          ))}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <Link to="/login" className="link">Login here</Link>
        </div>
      </div>
    </div>
  );
}
