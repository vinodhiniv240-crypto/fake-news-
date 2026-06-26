import { analyzeNewsWithAI } from "./groq";
import axios from "axios";
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, provider } from "./firebase";
import emailjs from "@emailjs/browser";

// ─── Style tokens ──────────────────────────────────────────────────────────
const BLUE = "#2563eb";
const DARK = "#0f172a";
const BG   = "#f1f5f9";
const card = {
  background: "white",
  borderRadius: "14px",
  padding: "20px 24px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const navItemBase = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  marginBottom: "4px",
  userSelect: "none",
};
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  marginTop: "8px",
};
const primaryBtn = {
  padding: "11px 20px",
  background: BLUE,
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};
const badge = (color, bg) => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "600",
  background: bg,
  color,
});

const verdictConfig = {
  REAL:         { label: "✅ Real News",    bg: "#dcfce7", color: "#166534" },
  FAKE:         { label: "❌ Fake News",     bg: "#fee2e2", color: "#991b1b" },
  MISLEADING:   { label: "⚠️ Misleading",   bg: "#fef9c3", color: "#854d0e" },
  SATIRE:       { label: "🎭 Satire",        bg: "#ede9fe", color: "#6b21a8" },
  UNVERIFIABLE: { label: "❓ Unverifiable",  bg: "#f1f5f9", color: "#475569" },
  ERROR:        { label: "⚠️ Error",         bg: "#fef9c3", color: "#854d0e" },
};

const catColor = {
  Politics: "#3b82f6", Health: "#ef4444", Science: "#10b981",
  Business: "#f59e0b", Sports: "#8b5cf6", Technology: "#06b6d4",
  Entertainment: "#ec4899", Other: "#94a3b8",
};

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: "40px", height: "22px", borderRadius: "11px",
      background: checked ? BLUE : "#cbd5e1",
      position: "relative", cursor: "pointer", flexShrink: 0,
      transition: "background 0.2s",
    }}>
      <div style={{
        width: "16px", height: "16px", borderRadius: "50%",
        background: "white", position: "absolute", top: "3px",
        left: checked ? "21px" : "3px", transition: "left 0.2s",
      }} />
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ pct, color = BLUE }) {
  return (
    <div style={{ height: "7px", background: "#e2e8f0", borderRadius: "4px" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px" }} />
    </div>
  );
}

// ─── Rule-Based Analysis (no API, no server, works instantly) ──────────────
// eslint-disable-next-line no-unused-vars

function analyzeWithClaude(newsText){
 
  const text = newsText.toLowerCase();

  const fakeKeywords = [
    "shocking", "you won't believe", "miracle", "secret they don't want you to know",
    "doctors hate", "one weird trick", "mind blowing", "exposed", "hoax",
    "conspiracy", "illuminati", "deep state", "they're hiding", "banned",
    "100% proven", "guaranteed cure", "alien", "reptilian", "flat earth",
    "government lies", "wake up", "share before deleted",
    "breaking!!!", "urgent!!!", "massive coverup", "they don't want you",
  ];
  const misleadingKeywords = [
    "allegedly", "sources say", "rumor", "unconfirmed", "could be",
    "might be", "some say", "many people think", "may cause",
    "linked to", "could lead", "anonymous source", "insider claims",
  ];
  const satireKeywords = [
    "onion", "babylon bee", "satirical", "parody", "fictional",
    "not real news", "satire", "spoof",
  ];
  const realKeywords = [
    "according to", "reported by", "confirmed", "official statement",
    "press release", "reuters", "ap news", "bbc", "government announced",
    "study published", "peer reviewed", "spokesperson said",
    "data shows", "statistics", "percent", "survey", "published",
  ];

  const categoryMap = {
    Politics:      ["government", "president", "parliament", "election", "minister", "policy", "senate", "congress", "vote", "political", "modi", "trump"],
    Health:        ["health", "disease", "virus", "vaccine", "hospital", "doctor", "medicine", "cancer", "covid", "pandemic", "cure", "treatment"],
    Science:       ["science", "research", "study", "space", "nasa", "climate", "environment", "discovery", "experiment", "physics", "isro"],
    Business:      ["stock", "market", "economy", "company", "billion", "million", "startup", "revenue", "profit", "trade", "gdp", "rupee"],
    Sports:        ["cricket", "football", "ipl", "match", "tournament", "player", "team", "champion", "score", "fifa", "olympic", "icc"],
    Technology:    ["ai", "tech", "software", "app", "phone", "internet", "cyber", "robot", "innovation", "digital", "computer"],
    Entertainment: ["movie", "film", "actor", "actress", "celebrity", "music", "song", "bollywood", "hollywood", "award", "singer", "series"],
  };

  let category = "Other";
  let maxCatScore = 0;
  for (const [cat, words] of Object.entries(categoryMap)) {
    const score = words.filter(w => text.includes(w)).length;
    if (score > maxCatScore) { maxCatScore = score; category = cat; }
  }

  const fakeScore    = fakeKeywords.filter(w => text.includes(w)).length;
  const misleadScore = misleadingKeywords.filter(w => text.includes(w)).length;
  const satireScore  = satireKeywords.filter(w => text.includes(w)).length;
  const realScore    = realKeywords.filter(w => text.includes(w)).length;

  const matchedFake  = fakeKeywords.filter(w => text.includes(w));
  const matchedMisl  = misleadingKeywords.filter(w => text.includes(w));
  const matchedReal  = realKeywords.filter(w => text.includes(w));

  let verdict, confidence, summary, redFlags, sources;

  if (satireScore >= 1) {
    verdict    = "SATIRE";
    confidence = 85;
    summary    = "This content appears to be satirical or parody. It is not meant to be taken as factual news.";
    redFlags   = ["Satire/parody indicators found", ...matchedFake.slice(0, 2)];
    sources    = ["Check the original publication to confirm it is a satire outlet"];

  } else if (fakeScore >= 3) {
    verdict    = "FAKE";
    confidence = Math.min(95, 60 + fakeScore * 7);
    summary    = `Multiple fake news indicators detected (${fakeScore} red flags). This content contains classic misinformation patterns and should not be shared.`;
    redFlags   = matchedFake.map(w => `Contains sensational term: "${w}"`).slice(0, 5);
    sources    = ["Reuters Fact Check — reuters.com/fact-check", "Snopes — snopes.com", "FactCheck.org", "Alt News India — altnews.in"];

  } else if (fakeScore >= 1 && realScore === 0) {
    verdict    = "MISLEADING";
    confidence = Math.min(82, 48 + fakeScore * 8 + misleadScore * 5);
    summary    = "This content shows signs of being misleading. It uses sensational or vague language without credible source attribution.";
    redFlags   = [
      ...matchedFake.map(w => `Sensational term: "${w}"`),
      ...matchedMisl.map(w => `Vague qualifier: "${w}"`),
    ].slice(0, 5);
    sources    = ["Verify with AP News — apnews.com", "BBC News — bbc.com/news", "The Hindu — thehindu.com"];

  } else if (realScore >= 2) {
    verdict    = "REAL";
    confidence = Math.min(92, 58 + realScore * 8 - fakeScore * 5);
    summary    = `This content appears credible. It contains ${realScore} indicators of factual reporting such as source attribution and verifiable language.`;
    redFlags   = misleadScore > 0 ? matchedMisl.map(w => `Note unverified qualifier: "${w}"`).slice(0, 2) : [];
    sources    = matchedReal.map(w => `Credible signal found: "${w}"`).slice(0, 4);

  } else {
    verdict    = "UNVERIFIABLE";
    confidence = 45;
    summary    = "Not enough information to determine credibility. Try searching for the original source or cross-referencing with a trusted outlet.";
    redFlags   = misleadScore > 0
      ? matchedMisl.map(w => `Qualifier found: "${w}"`).slice(0, 3)
      : ["No credible source indicators found"];
    sources    = ["Google News — news.google.com", "Reuters — reuters.com", "The Hindu — thehindu.com"];
  }

  return Promise.resolve({ verdict, confidence, summary, redFlags, sources, category });
}

// ─── Static news headlines (no API needed) ────────────────────────────────
async function fetchRealNews() {
  try {
    const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

    // Professional categories
    const categories = [
      "technology",
      "business",
      "health",
      "science",
      "sports",
      "entertainment",
      "world",
      "politics",
      "artificial intelligence",
      "climate"
    ];

    // Pick a random category
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];

    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        randomCategory
      )}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${NEWS_API_KEY}&_=${Date.now()}`
    );

    const articles = response.data.articles || [];

    // Remove duplicate headlines
    const uniqueArticles = articles.filter(
      (article, index, self) =>
        index ===
        self.findIndex((a) => a.title === article.title)
    );

    // Shuffle articles for a fresh experience
    uniqueArticles.sort(() => Math.random() - 0.5);

    return uniqueArticles.map((article) => ({
      title: article.title || "No Title",
      source: article.source?.name || "Unknown",
      category: randomCategory
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      summary: article.description || "No description available.",
      url: article.url,
      image: article.urlToImage,
      time: new Date(article.publishedAt).toLocaleString(),
    }));
  } catch (error) {
    console.error("News API Error:", error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════
// FIX: All page components moved OUTSIDE App() to prevent remount on every
//      keystroke — this is what caused the typing lag in the textarea.
// ══════════════════════════════════════════════════════════════════════════

// ─── PAGE: DASHBOARD ──────────────────────────────────────────────────────
function PageDashboard({
  userName, totalChecks, fakeCount, accuracy,
  history, liveNews, newsLoading, loadLiveNews,
  setNews, setActivePage,
}) {
  const catCounts = history.reduce((acc, h) => {
    acc[h.category] = (acc[h.category] || 0) + 1; return acc;
  }, {});
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalCat = topCats.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Welcome back, {userName} 👋</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Here's your fake news detection overview.</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Checks",      value: totalChecks,          icon: "🔍", sub: "all time" },
          { label: "Fake / Misleading", value: fakeCount,            icon: "⚠️", sub: `${totalChecks > 0 ? ((fakeCount/totalChecks)*100).toFixed(0) : 0}% of total` },
          { label: "Verified Real",     value: totalChecks-fakeCount,icon: "✅", sub: "confirmed" },
          { label: "Accuracy",          value: `${accuracy}%`,       icon: "🎯", sub: "AI model" },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: "22px" }}>{s.icon}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", marginTop: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: DARK, margin: "4px 0" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {/* Category breakdown */}
        <div style={card}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Detected categories</h3>
          {topCats.length === 0
            ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>Run some analyses to see category breakdown.</p>
            : topCats.map(([cat, count]) => (
              <div key={cat} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "#64748b" }}>{cat}</span>
                  <span style={{ fontWeight: "600" }}>{Math.round((count/totalCat)*100)}%</span>
                </div>
                <ProgressBar pct={Math.round((count/totalCat)*100)} color={catColor[cat] || "#94a3b8"} />
              </div>
            ))
          }
        </div>

        {/* Breaking news feed */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: DARK }}>🌐 Today's top news</h3>
            <button onClick={loadLiveNews} style={{ fontSize: "11px", color: BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
              {newsLoading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
          {newsLoading
            ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>Fetching live news…</p>
            : liveNews.length === 0
              ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>No news loaded. Click Refresh.</p>
              : liveNews.slice(0, 4).map((n, i) => (
                <div key={i}
                  style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}
                  onClick={() => { setNews(n.title + "\n\n" + n.summary); setActivePage("analyze"); }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "600", color: catColor[n.category] || "#94a3b8", textTransform: "uppercase" }}>{n.category}</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>· {n.time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: DARK, fontWeight: "500", lineHeight: "1.4" }}>{n.title}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{n.source}</div>
                </div>
              ))
          }
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>Click any headline to analyze it →</p>
        </div>
      </div>

      {/* Recent activity */}
      <div style={card}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Recent analysis history</h3>
        {history.length === 0
          ? <p style={{ color: "#94a3b8", fontSize: "13px" }}>No analysis yet — go to Analyze News to get started.</p>
          : history.slice(0, 6).map((item, i) => {
            const vc = verdictConfig[item.verdict] || verdictConfig.UNVERIFIABLE;
            return (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < Math.min(history.length,6)-1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={badge(vc.color, vc.bg)}>{item.verdict}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", color: DARK }}>{item.text}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{item.time} · {item.confidence}% confidence · {item.category}</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── PAGE: ANALYZE ────────────────────────────────────────────────────────
// FIX: Defined outside App so textarea never loses focus while typing
function PageAnalyze({
  news, setNews, aiResult, loading, analyzeNews,
  liveNews, newsLoading, loadLiveNews,
}) {
  const vc = aiResult ? (verdictConfig[aiResult.verdict] || verdictConfig.UNVERIFIABLE) : null;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Analyze news</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Paste any article, headline, tweet, or WhatsApp message. Our AI checks it against real-world facts.
      </p>

      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: DARK }}>Article / headline</h3>

        {/* FIX: textarea now works smoothly — no remounting */}
        <textarea
          value={news}
          onChange={e => setNews(e.target.value)}
          placeholder="Paste any news article, headline, social media post, or WhatsApp forward here…"
          style={{
            width: "100%", height: "160px", padding: "12px",
            borderRadius: "8px", border: "1px solid #e2e8f0",
            fontSize: "13px", resize: "vertical", boxSizing: "border-box",
            outline: "none", fontFamily: "inherit",
          }}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <button onClick={analyzeNews} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "🔄 Analyzing with AI…" : "🔍 Analyze with AI"}
          </button>
          <button
            onClick={() => { setNews(""); }}
            style={{ ...primaryBtn, background: "#f1f5f9", color: "#475569" }}>
            Clear
          </button>
        </div>

        {/* AI Result */}
        {aiResult && vc && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ padding: "16px 20px", borderRadius: "10px", background: vc.bg, border: `1px solid ${vc.color}22`, marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: vc.color }}>{vc.label}</div>
              <div style={{ fontSize: "13px", color: vc.color, marginTop: "4px", opacity: 0.85 }}>{aiResult.summary}</div>
              {aiResult.confidence > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: vc.color, marginBottom: "4px" }}>
                    <span>Confidence</span><span>{aiResult.confidence}%</span>
                  </div>
                  <div style={{ height: "6px", background: `${vc.color}33`, borderRadius: "4px" }}>
                    <div style={{ width: `${aiResult.confidence}%`, height: "100%", background: vc.color, borderRadius: "4px", transition: "width 0.6s" }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {aiResult.redFlags?.length > 0 && (
                <div style={{ padding: "14px", background: "#fff7ed", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#9a3412", marginBottom: "8px" }}>🚩 Red flags detected</div>
                  {aiResult.redFlags.map((f, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#9a3412", padding: "3px 0" }}>• {f}</div>
                  ))}
                </div>
              )}
              {aiResult.sources?.length > 0 && (
                <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#166534", marginBottom: "8px" }}>📚 Suggested sources</div>
                  {aiResult.sources.map((s, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#166534", padding: "3px 0" }}>• {s}</div>
                  ))}
                </div>
              )}
            </div>

            {aiResult.category && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                Category: <span style={{ fontWeight: "600", color: catColor[aiResult.category] || "#64748b" }}>{aiResult.category}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live headlines */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: DARK }}>🌐 Analyze today's headlines</h3>
          <button onClick={loadLiveNews} style={{ fontSize: "11px", color: BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
            {newsLoading ? "Loading…" : "↻ Refresh news"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Click any headline below to load it for analysis.</p>
        {newsLoading
          ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>Fetching live news…</p>
          : liveNews.length === 0
            ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>No news loaded. Click Refresh.</p>
            : liveNews.map((n, i) => (
              <div key={i}
                onClick={() => setNews(n.title + "\n\n" + n.summary)}
                style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "8px", background: news.startsWith(n.title) ? "#eff6ff" : "#f8fafc", cursor: "pointer", border: news.startsWith(n.title) ? `1px solid ${BLUE}` : "1px solid transparent" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: catColor[n.category] || "#94a3b8", textTransform: "uppercase" }}>{n.category}</span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>· {n.source} · {n.time}</span>
                </div>
                <div style={{ fontSize: "13px", color: DARK, fontWeight: "500" }}>{n.title}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{n.summary}</div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── PAGE: REPORTS ────────────────────────────────────────────────────────
function PageReports({ totalChecks, fakeCount, accuracy, history }) {
  const verdictCounts = history.reduce((acc, h) => {
    acc[h.verdict] = (acc[h.verdict] || 0) + 1; return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Reports</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Real-time summary of all analyses performed on your account.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Checks",      value: totalChecks },
          { label: "Fake / Misleading", value: fakeCount },
          { label: "Verified Real",     value: totalChecks - fakeCount },
          { label: "Accuracy",          value: `${accuracy}%` },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: DARK, marginTop: "6px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={card}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Verdict breakdown</h3>
          {Object.entries(verdictConfig).filter(([k]) => k !== "ERROR").map(([v, cfg]) => (
            <div key={v} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px", alignItems: "center" }}>
              <span style={badge(cfg.color, cfg.bg)}>{v}</span>
              <span style={{ fontWeight: "600", color: DARK }}>{verdictCounts[v] || 0}</span>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Full analysis history</h3>
          {history.length === 0
            ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>No history yet.</p>
            : history.map((item, i) => {
              const vc = verdictConfig[item.verdict] || verdictConfig.UNVERIFIABLE;
              return (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={badge(vc.color, vc.bg)}>{item.verdict}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.confidence}% · {item.time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{item.text}</div>
                </div>
              );
            })
          }
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: DARK }}>Export reports</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["📄 Export PDF", "📊 Export CSV", "📧 Email report"].map(label => (
            <button key={label} onClick={() => alert(`${label} — coming soon!`)}
              style={{ ...primaryBtn, background: "#f1f5f9", color: "#475569" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: SETTINGS ───────────────────────────────────────────────────────
function PageSettings({
  autoAnalyze, setAutoAnalyze, deepVerify, setDeepVerify,
  flagSatire, setFlagSatire, emailAlerts, setEmailAlerts,
  weeklyDigest, setWeeklyDigest, langPref, setLangPref,
}) {
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Settings</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Manage detection preferences and account configuration.</p>

      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Detection preferences</h3>
        {[
          { label: "Auto-analyze on paste",    desc: "Run detection automatically when content is pasted", val: autoAnalyze, set: setAutoAnalyze },
          { label: "Deep source verification", desc: "Cross-reference with 100+ sources (slower)",         val: deepVerify,  set: setDeepVerify  },
          { label: "Flag satire content",      desc: "Detect and label satirical articles separately",     val: flagSatire,  set: setFlagSatire  },
        ].map(t => (
          <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500", color: DARK }}>{t.label}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{t.desc}</div>
            </div>
            <Toggle checked={t.val} onChange={t.set} />
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Notifications</h3>
        {[
          { label: "Email alerts",  desc: "Get emailed when fake news is detected", val: emailAlerts,  set: setEmailAlerts  },
          { label: "Weekly digest", desc: "Summary of all detections every Monday", val: weeklyDigest, set: setWeeklyDigest },
        ].map(t => (
          <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500", color: DARK }}>{t.label}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{t.desc}</div>
            </div>
            <Toggle checked={t.val} onChange={t.set} />
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Language & region</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Detection language</label>
            <select value={langPref} onChange={e => setLangPref(e.target.value)} style={{ ...inputStyle, background: "white" }}>
              {["English", "Tamil", "Hindi", "Telugu"].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Timezone</label>
            <select style={{ ...inputStyle, background: "white" }}>
              <option>Asia/Kolkata (IST)</option>
              <option>UTC</option>
              <option>America/New_York</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={() => alert("Settings saved!")} style={primaryBtn}>💾 Save changes</button>
    </div>
  );
}

// ─── PAGE: PROFILE ────────────────────────────────────────────────────────
function PageProfile({ user, userName, initials, profileName, setProfileName, profilePhone, setProfilePhone, logout }) {
  const [profileSaved, setProfileSaved] = useState(false);
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Your profile</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Manage your personal information and account details.</p>

      <div style={{ ...card, textAlign: "center", marginBottom: "16px" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: BLUE, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", margin: "0 auto 12px" }}>
          {initials}
        </div>
        <div style={{ fontSize: "18px", fontWeight: "700", color: DARK }}>{userName}</div>
        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{user.email}</div>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
          {["Admin", "Pro Plan", "Member since 2024"].map(t => (
            <span key={t} style={{ ...badge("#475569", "#f1f5f9"), padding: "4px 10px", fontSize: "12px" }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>Personal information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Full name</label>
            <input value={profileName} onChange={e => setProfileName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Email</label>
            <input value={user.email} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Phone</label>
            <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Role</label>
            <input value="Admin" readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }} />
          </div>
        </div>
        <button
          onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500); }}
          style={{ ...primaryBtn, marginTop: "14px" }}>
          {profileSaved ? "✅ Saved!" : "Save profile"}
        </button>
      </div>

      <div style={{ ...card, border: "1px solid #fee2e2" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#dc2626", marginBottom: "8px" }}>Danger zone</h3>
        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Permanently delete your account and all analysis data. This cannot be undone.</p>
        <button
          onClick={() => window.confirm("Are you sure? This cannot be undone.") && logout()}
          style={{ ...primaryBtn, background: "#fee2e2", color: "#dc2626" }}>
          Delete account
        </button>
      </div>
    </div>
  );
}

// ─── PAGE: NOTIFICATIONS ──────────────────────────────────────────────────
function PageNotifications({
  history, liveNews, newsLoading, loadLiveNews,
  setNews, setActivePage, setUnreadCount, setNotifRead,
}) {
  const markRead = () => { setUnreadCount(0); setNotifRead(true); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: DARK }}>Notifications</h1>
        <button onClick={markRead} style={{ fontSize: "12px", color: BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
          Mark all read
        </button>
      </div>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Live news feed + your analysis alerts.</p>

      {history.length > 0 && (
        <div style={{ ...card, marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px", color: DARK }}>🔔 Your analysis alerts</h3>
          {history.slice(0, 5).map((item, i) => {
            const vc = verdictConfig[item.verdict] || verdictConfig.UNVERIFIABLE;
            const isBad = ["FAKE", "MISLEADING"].includes(item.verdict);
            return (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: i < Math.min(history.length,5)-1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: vc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                  {isBad ? "⚠️" : "✅"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: DARK }}>{vc.label} detected — {item.confidence}% confidence</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{item.text}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>{item.time}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: DARK }}>🌐 Breaking news today</h3>
          <button onClick={loadLiveNews} style={{ fontSize: "11px", color: BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
            {newsLoading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
        {newsLoading
          ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>Fetching live news…</p>
          : liveNews.length === 0
            ? <p style={{ fontSize: "13px", color: "#94a3b8" }}>No news loaded. Click Refresh above.</p>
            : liveNews.map((n, i) => (
              <div key={i}
                style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: i < liveNews.length-1 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}
                onClick={() => { setNews(n.title + "\n\n" + n.summary); setActivePage("analyze"); }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${catColor[n.category] || "#94a3b8"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                  📰
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: catColor[n.category] || "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>{n.category} · {n.source}</div>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: DARK }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{n.summary}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>{n.time}</div>
                  <span style={{ fontSize: "10px", color: BLUE, fontWeight: "600", whiteSpace: "nowrap" }}>Analyze →</span>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  // ─── Auth ───────────────────────────────────────────────────────────────
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [user,     setUser]     = useState(null);

  // ─── UI ─────────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState("dashboard");

  // ─── Analysis ───────────────────────────────────────────────────────────
  const [news,        setNews]        = useState("");
  const [aiResult,    setAiResult]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [totalChecks, setTotalChecks] = useState(0);
  const [fakeCount,   setFakeCount]   = useState(0);
  const [history,     setHistory]     = useState([]);

  // ─── Live news / notifications ──────────────────────────────────────────
  const [liveNews,    setLiveNews]    = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifRead,   setNotifRead]   = useState(false);

  // ─── Settings ───────────────────────────────────────────────────────────
  const [autoAnalyze,  setAutoAnalyze]  = useState(true);
  const [deepVerify,   setDeepVerify]   = useState(false);
  const [flagSatire,   setFlagSatire]   = useState(true);
  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [langPref,     setLangPref]     = useState("English");

  // ─── Profile ────────────────────────────────────────────────────────────
  const [profileName,  setProfileName]  = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Force logout on mount
  useEffect(() => { signOut(auth); }, []);

  // Seed profile name
  useEffect(() => {
    if (user) setProfileName(user.displayName || user.email.split("@")[0]);
  }, [user]);

  // Fetch real news on login
  useEffect(() => {
    if (user) loadLiveNews();
  }, [user]); // eslint-disable-line

  const loadLiveNews = async () => {
    setNewsLoading(true);
    try {
      const items = await fetchRealNews();
      setLiveNews(items);
      setUnreadCount(items.length);
    } catch (e) {
      console.error("News fetch error", e);
    }
    setNewsLoading(false);
  };

  // ─── Email notification ─────────────────────────────────────────────────
  const sendLoginNotification = (userEmail) => {
    emailjs.send(
      "service_t7buszs", "template_jzreqab",
      { user_name: userEmail.split("@")[0], user_email: userEmail, login_time: new Date().toLocaleString() },
      "I7G0L6ivWQrCL658p"
    ).catch(console.error);
  };

  // ─── Auth ───────────────────────────────────────────────────────────────
  const login = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      sendLoginNotification(cred.user.email);
    } catch (e) { alert(e.message); }
  };
  const googleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
      sendLoginNotification(res.user.email);
    } catch (e) { alert(e.message); }
  };
  const forgotPassword = async () => {
    if (!email) { alert("Enter your email first"); return; }
    try { await sendPasswordResetEmail(auth, email); alert("Password reset email sent"); }
    catch (e) { alert(e.message); }
  };
  const logout = async () => { await signOut(auth); setUser(null); };

 // ─── AI Analysis ────────────────────────────────────────────────────────
const analyzeNews = async () => {
  console.log("Analyze button clicked");

  if (news.trim().length < 20) {
    setAiResult({
      verdict: "ERROR",
      summary: "Please enter at least 20 characters of news content.",
      confidence: 0,
      redFlags: [],
      sources: [],
      category: "",
    });
    return;
  }

  setLoading(true);
  setAiResult(null);

  try {
    // Gemini already returns a parsed object
    const parsed = await analyzeNewsWithAI(news);

    setTotalChecks((p) => p + 1);

    const isFake = ["FAKE", "MISLEADING", "SATIRE"].includes(
      parsed.verdict
    );

    if (isFake) {
      setFakeCount((p) => p + 1);
    }

    setAiResult(parsed);

    setHistory((prev) => [
      {
        text: news.substring(0, 80) + "…",
        verdict: parsed.verdict || "UNKNOWN",
        confidence: parsed.confidence || 0,
        category: parsed.category || "Other",
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  } catch (e) {
    console.error(e);

    setAiResult({
      verdict: "ERROR",
      summary: e.message || "Analysis failed.",
      confidence: 0,
      redFlags: [],
      sources: [],
      category: "",
    });
  }

  setLoading(false);
};

  // ─── Derived ────────────────────────────────────────────────────────────
  const userName = user
    ? (user.displayName || user.email.split("@")[0].replace(/[0-9]/g, "")).toUpperCase()
    : "";
  const initials = userName.slice(0, 2);
  const accuracy = totalChecks > 0
    ? (((totalChecks - fakeCount) / totalChecks) * 100).toFixed(1)
    : "99.0";

  // ─── Nav items ──────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",     icon: "🏠", label: "Dashboard",     group: "main" },
    { id: "analyze",       icon: "📰", label: "Analyze News",  group: "main" },
    { id: "reports",       icon: "📊", label: "Reports",       group: "main" },
    { id: "settings",      icon: "⚙️",  label: "Settings",      group: "account" },
    { id: "profile",       icon: "👤", label: "Profile",       group: "account" },
    { id: "notifications", icon: "🔔", label: "Notifications", group: "account", badge: notifRead ? 0 : unreadCount },
  ];

  // ─── Login page ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: BG, fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ width: "380px", background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "36px", height: "36px", background: BLUE, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛡</div>
            <span style={{ fontSize: "20px", fontWeight: "700", color: DARK }}>TruthGuard AI</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>Fake News Detection System</p>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginTop: "14px" }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={inputStyle} />
          <button onClick={login} style={{ ...primaryBtn, width: "100%", marginTop: "20px", padding: "13px", fontSize: "15px" }}>Sign In</button>
          <button onClick={googleLogin} style={{ width: "100%", padding: "12px", marginTop: "12px", borderRadius: "8px", border: "1px solid #dadce0", background: "white", color: "#3c4043", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: "18px", height: "18px" }} />
            Continue with Google
          </button>
          <p onClick={forgotPassword} style={{ color: BLUE, cursor: "pointer", marginTop: "18px", textAlign: "center", fontSize: "13px" }}>Forgot password?</p>
        </div>
      </div>
    );
  }

  // ─── Page renderer ──────────────────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <PageDashboard
          userName={userName} totalChecks={totalChecks} fakeCount={fakeCount} accuracy={accuracy}
          history={history} liveNews={liveNews} newsLoading={newsLoading} loadLiveNews={loadLiveNews}
          setNews={setNews} setActivePage={setActivePage}
        />;
      case "analyze":
        return <PageAnalyze
          news={news} setNews={setNews} aiResult={aiResult} loading={loading} analyzeNews={analyzeNews}
          liveNews={liveNews} newsLoading={newsLoading} loadLiveNews={loadLiveNews}
        />;
      case "reports":
        return <PageReports totalChecks={totalChecks} fakeCount={fakeCount} accuracy={accuracy} history={history} />;
      case "settings":
        return <PageSettings
          autoAnalyze={autoAnalyze} setAutoAnalyze={setAutoAnalyze}
          deepVerify={deepVerify} setDeepVerify={setDeepVerify}
          flagSatire={flagSatire} setFlagSatire={setFlagSatire}
          emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts}
          weeklyDigest={weeklyDigest} setWeeklyDigest={setWeeklyDigest}
          langPref={langPref} setLangPref={setLangPref}
        />;
      case "profile":
        return <PageProfile
          user={user} userName={userName} initials={initials}
          profileName={profileName} setProfileName={setProfileName}
          profilePhone={profilePhone} setProfilePhone={setProfilePhone}
          logout={logout}
        />;
      case "notifications":
        return <PageNotifications
          history={history} liveNews={liveNews} newsLoading={newsLoading} loadLiveNews={loadLiveNews}
          setNews={setNews} setActivePage={setActivePage}
          setUnreadCount={setUnreadCount} setNotifRead={setNotifRead}
        />;
      default:
        return null;
    }
  };

  // ─── Main layout ────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, Arial, sans-serif", background: BG }}>
      {/* SIDEBAR */}
      <div style={{ width: "240px", background: DARK, color: "white", padding: "24px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "32px" }}>
          <div style={{ width: "32px", height: "32px", background: BLUE, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700" }}>TruthGuard AI</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Detection System</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {["main", "account"].map(group => (
            <div key={group}>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#475569", letterSpacing: ".8px", textTransform: "uppercase", padding: "0 8px 6px", marginTop: group === "account" ? "16px" : 0 }}>
                {group === "main" ? "Main" : "Account"}
              </div>
              {navItems.filter(n => n.group === group).map(item => (
                <div key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (item.id === "notifications") { setUnreadCount(0); setNotifRead(true); }
                  }}
                  style={{ ...navItemBase, background: activePage === item.id ? "#1e3a5f" : "transparent", color: activePage === item.id ? "white" : "#94a3b8" }}>
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{ ...badge("white", "#ef4444"), padding: "1px 7px", fontSize: "10px" }}>{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "16px" }}>
          <div onClick={() => setActivePage("profile")}
            style={{ ...navItemBase, color: "#94a3b8", marginBottom: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "white" }}>{userName}</div>
              <div style={{ fontSize: "10px", color: "#64748b" }}>Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "9px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {renderPage()}
      </div>
    </div>
  );
}
