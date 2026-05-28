import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";

import { auth, provider } from "./firebase";

export default function App() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const login = async () => {

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Successful");

    } catch (error) {

      alert(error.message);

    }

  };

  const googleLogin = async () => {

    try {

      await signInWithPopup(auth, provider);

      alert("Google Login Successful");

    } catch (error) {

      alert(error.message);

    }

  };

  const forgotPassword = async () => {

    if (!email) {

      alert("Enter Email First");

      return;

    }

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      alert("Password Reset Email Sent");

    } catch (error) {

      alert(error.message);

    }

  };

  return (

    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#dbeafe",
      fontFamily: "Arial"
    }}>

      <div style={{
        width: "350px",
        background: "white",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>

        <h1 style={{
          textAlign: "center",
          color: "#1e3a8a"
        }}>
          TruthGuard AI
        </h1>

        <p style={{
          textAlign: "center",
          color: "gray",
          marginBottom: "20px"
        }}>
          Fake News Detection System
        </p>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px"
          }}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px"
          }}
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Login
        </button>

        <button
          onClick={googleLogin}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "12px",
            borderRadius: "8px",
            border: "1px solid #dadce0",
            background: "white",
            color: "#3c4043",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}
        >

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google"
            style={{
              width: "20px",
              height: "20px"
            }}
          />

          Continue with Google

        </button>

        <p
          onClick={forgotPassword}
          style={{
            color: "#2563eb",
            cursor: "pointer",
            marginTop: "20px",
            textAlign: "center",
            fontSize: "14px"
          }}
        >
          Forgot Password?
        </p>

      </div>

    </div>

  );

}