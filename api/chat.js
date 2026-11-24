// Thin, locked-down proxy to the Anthropic Messages API. The key stays on the server.
const MODEL = process.env.FOC_MODEL || "claude-haiku-5-5";
const hits = new Map(); // best-effort per-instance rate limit

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "not configured" });

  // Same-site requests only.
  const origin = req.headers.origin || "";
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "forbidden" });

  // 20 requests per 10 minutes per address.
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 600000);
  if (list.length >= 20) return res.status(429).json({ error: "slow down" });
  list.push(now); hits.set(ip, list);

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { system, messages, tools } = body;
  if (typeof system !== "string" || system.length > 6000) return res.status(400).json({ error: "bad system" });
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 30) return res.status(400).json({ error: "bad messages" });
  if (!Array.isArray(tools) || tools.length > 10) return res.status(400).json({ error: "bad tools" });
  if (JSON.stringify(body).length > 2500000) return res.status(413).json({ error: "too large" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, system, messages, tools }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: "upstream", detail: j && j.error && j.error.type });
    return res.status(200).json({ content: j.content, stop_reason: j.stop_reason });
  } catch (e) {
    return res.status(502).json({ error: "upstream" });
  }
};
