import React, { useState } from "react";
import "../styles/Login.scss";
import { setLogin, showNotification } from "../redux/state";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(
          setLogin({
            user: data.user,
            token: data.token,
          })
        );

        dispatch(
          showNotification({
            message: "Logged in successfully!",
            type: "success",
          })
        );

        navigate("/");
      } else {
        // Handle server errors
        dispatch(
          showNotification({
            message: data.message || "Login failed. Please try again.",
            type: "error",
          })
        );
      }
    } catch (err) {
      dispatch(
        showNotification({
          message: "An error occurred. Please try again.",
          type: "error",
        })
      );
      console.log("Login failed", err.message);
    }
  };

  return (
    <div className="login">
      <div className="login_content">
        <form className="login_content_form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">LOG IN</button>
        </form>
        <a href="/register">Don't have an account? Sign up here.</a>
      </div>
    </div>
  );
};

export default LoginPage;
