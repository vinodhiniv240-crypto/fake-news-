const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

console.log("GROQ API KEY:", API_KEY);

export async function analyzeNewsWithAI(newsText) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are an expert AI fact-checker. Always return ONLY valid JSON. Never return markdown."
            },
            {
              role: "user",
              content: `
Analyze the following news article professionally.

News:
${newsText}

Perform these tasks:

1. Decide whether the news is:
- REAL
- FAKE
- MISLEADING
- SATIRE
- UNVERIFIABLE

2. Estimate confidence (0-100).

3. Estimate evidenceScore (0-100).

4. Estimate sourceReliability (0-100).

5. Assign risk:
- LOW
- MEDIUM
- HIGH

6. Detect category:
- Politics
- Business
- Sports
- Health
- Technology
- Entertainment
- Science
- Other

7. Give a short professional summary.

8. Explain WHY you reached this verdict.

9. Suggest 3 trusted sources that could verify this claim.

10. List any red flags.

Return ONLY JSON in exactly this format:

{
  "verdict":"REAL",
  "confidence":93,
  "evidenceScore":91,
  "sourceReliability":95,
  "risk":"LOW",
  "category":"Politics",
  "summary":"Short summary",
  "explanation":"Reason for the verdict.",
  "verifiedSources":[
      "Reuters",
      "BBC",
      "AP News"
  ],
  "redFlags":[
      "No major red flags"
  ],
  "sources":[
      "https://www.reuters.com",
      "https://www.bbc.com",
      "https://apnews.com"
  ]
}
`
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();

    let text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("No response returned from Groq");
    }

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("Groq Output:", text);

    const result = JSON.parse(text);

    // Safety defaults
    result.confidence = result.confidence ?? 70;
    result.evidenceScore = result.evidenceScore ?? 70;
    result.sourceReliability = result.sourceReliability ?? 70;
    result.risk = result.risk ?? "MEDIUM";
    result.category = result.category ?? "Other";
    result.summary = result.summary ?? "";
    result.explanation = result.explanation ?? "";
    result.verifiedSources = result.verifiedSources ?? [];
    result.redFlags = result.redFlags ?? [];
    result.sources = result.sources ?? [];

    return result;

  } catch (err) {
    console.error("Groq Error:", err);
    throw err;
  }
}