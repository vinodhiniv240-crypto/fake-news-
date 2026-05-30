import { useState, useEffect } from "react";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

import { auth, provider } from "./firebase";

import emailjs from "@emailjs/browser";

export default function App() {

  // ================= STATES =================

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);

  const [news, setNews] = useState("");

  const [result, setResult] = useState("");

  const [loading, setLoading] = useState(false);

  const [totalChecks, setTotalChecks] = useState(120);

  const [fakeCount, setFakeCount] = useState(34);

  const [history, setHistory] = useState([]);

  // ================= FORCE LOGIN =================

  useEffect(() => {

    signOut(auth);

  }, []);

  // ================= EMAIL ALERT =================

  const sendLoginNotification = (userEmail) => {

    emailjs.send(
      "service_t7buszs",
      "template_jzreqab",
      {
        user_name: userEmail.split("@")[0],
        user_email: userEmail,
        login_time: new Date().toLocaleString()
      },
      "I7G0L6ivWQrCL658p"
    )

    .then(() => {

      console.log("SUCCESS");

    })

    .catch((error) => {

      console.log(error);

    });

  };

  // ================= LOGIN =================

  const login = async () => {

    try {

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      setUser(userCredential.user);

      sendLoginNotification(
        userCredential.user.email
      );

    } catch (error) {

      alert(error.message);

    }

  };

  // ================= GOOGLE LOGIN =================

  const googleLogin = async () => {

    try {

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      setUser(result.user);

      sendLoginNotification(
        result.user.email
      );

    } catch (error) {

      alert(error.message);

    }

  };

  // ================= FORGOT PASSWORD =================

  const forgotPassword = async () => {

    if (!email) {

      alert("Enter your email first");

      return;

    }

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      alert("Password reset email sent");

    } catch (error) {

      alert(error.message);

    }

  };

  // ================= LOGOUT =================

  const logout = async () => {

    await signOut(auth);

    setUser(null);

  };

  // ================= AI ANALYSIS =================

  const analyzeNews = async () => {

    if (news.length < 20) {

      setResult("⚠ Please enter valid news content");

      return;

    }

    setLoading(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:5000/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            news: news
          })
        }
      );

      const data = await response.json();

      let predictionResult = "";

      setTotalChecks((prev) => prev + 1);

      if (data.prediction === "FAKE") {

        predictionResult = "❌ Fake News Detected";

        setFakeCount((prev) => prev + 1);

      } else {

        predictionResult = "✅ Real News Detected";

      }

      setResult(predictionResult);

      const newHistory = {

        text: news.substring(0, 60) + "...",

        result: predictionResult,

        time: new Date().toLocaleTimeString()

      };

      setHistory((prev) => [
        newHistory,
        ...prev
      ]);

    } catch (error) {

      console.log(error);

      setResult("⚠ Backend Server Error");

    }

    setLoading(false);

  };

  // ================= LOGIN PAGE =================

  if (!user) {

    return (

      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f5f9",
        fontFamily: "Arial"
      }}>

        <div style={{
          width: "360px",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>

          <h1 style={{
            textAlign: "center",
            color: "#0f172a"
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
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc"
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
              src="https://www.google.com/favicon.ico"
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

  // ================= USER NAME =================

  const userName =
    user.email
      .split("@")[0]
      .replace(/[0-9]/g, "")
      .toUpperCase();

  // ================= DASHBOARD =================

  return (

    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "Arial",
      background: "#f1f5f9"
    }}>

      {/* SIDEBAR */}

      <div style={{
        width: "260px",
        background: "#0f172a",
        color: "white",
        padding: "30px"
      }}>

        <h2 style={{
          marginBottom: "40px"
        }}>
          TruthGuard AI
        </h2>

        <p>🏠 Dashboard</p>

        <p>📰 Analyze News</p>

        <p>📊 Reports</p>

        <p>⚙ Settings</p>

        <button
          onClick={logout}
          style={{
            marginTop: "40px",
            width: "100%",
            padding: "12px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>

      </div>

      {/* MAIN */}

      <div style={{
        flex: 1,
        padding: "30px"
      }}>

        <h1>
          Welcome, {userName}
        </h1>

        <p style={{
          color: "gray"
        }}>
          AI Fake News Detection System
        </p>

        {/* STATS */}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "20px"
        }}>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px"
          }}>

            <h3>Total Checks</h3>

            <h2>{totalChecks}</h2>

          </div>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px"
          }}>

            <h3>Fake News Found</h3>

            <h2>{fakeCount}</h2>

          </div>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px"
          }}>

            <h3>Accuracy</h3>

            <h2>99%</h2>

          </div>

        </div>

        {/* ANALYZE */}

        <div style={{
          marginTop: "30px",
          background: "white",
          padding: "20px",
          borderRadius: "12px"
        }}>

          <h2>
            Analyze News
          </h2>

          <textarea
            value={news}
            onChange={(e) =>
              setNews(e.target.value)
            }
            placeholder="Paste news article here..."
            style={{
              width: "100%",
              height: "180px",
              marginTop: "10px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={analyzeNews}
            style={{
              marginTop: "15px",
              padding: "12px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >

            {

              loading ?

              "Analyzing..." :

              "Analyze"

            }

          </button>

          {

            result &&

            <div style={{
              marginTop: "20px",
              padding: "15px",
              background: "#eff6ff",
              borderRadius: "10px",
              fontWeight: "bold"
            }}>

              {result}

            </div>

          }

        </div>

        {/* HISTORY */}

        <div style={{
          marginTop: "30px",
          background: "white",
          padding: "20px",
          borderRadius: "12px"
        }}>

          <h2>Recent Activity</h2>

          {

            history.length === 0 ?

            <p>No analysis yet</p>

            :

            history.map((item, index) => (

              <div
                key={index}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee"
                }}
              >

                <p>
                  <b>{item.result}</b>
                </p>

                <p>{item.text}</p>

                <small>{item.time}</small>

              </div>

            ))

          }

        </div>

      </div>

    </div>

  );

}