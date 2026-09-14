import { useState } from "react";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isRegister
      ? "https://expiryalert-backend.onrender.com/api/auth/register/"
      : "https://expiryalert-backend.onrender.com/api/auth/login/";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong");
        return;
      }

      if (isRegister) {
        setMessage(
          "Registration successful! You can now login."
        );

        setIsRegister(false);
        setPassword("");
      } else {
        // Save JWT tokens
        localStorage.setItem(
          "accessToken",
          data.access
        );

        localStorage.setItem(
          "refreshToken",
          data.refresh
        );

        localStorage.setItem(
          "username",
          data.username
        );

        setMessage("Login successful! 🎉");

        onLogin(data.username);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1>ExpiryAlert</h1>

        <p className="auth-subtitle">
          {isRegister
            ? "Create your account"
            : "Welcome back!"}
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            {isRegister
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        <button
          className="switch-button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New user? Create an account"}
        </button>

      </div>
    </div>
  );
}

export default Login;