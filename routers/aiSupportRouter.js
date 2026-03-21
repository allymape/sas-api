require("dotenv").config();
const express = require("express");
const { isAuth, permission } = require("../utils");
const { chat } = require("../src/Utils/ollamaClient");
const { buildSupportContext, redactText } = require("../src/Utils/aiSupportContext");

const aiSupportRouter = express.Router();

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const safeTrim = (value) => toText(value, "").trim();

const coerceMessages = (messages) => {
  const rows = Array.isArray(messages) ? messages : [];
  const normalized = [];

  for (const row of rows) {
    const role = safeTrim(row?.role).toLowerCase();
    const content = safeTrim(row?.content);
    if (!content) continue;
    if (!["user", "assistant", "system"].includes(role)) continue;
    normalized.push({
      role,
      content: redactText(content).slice(0, 8000),
    });
  }

  // Keep the most recent context only
  return normalized.slice(-20);
};

const buildSystemPrompt = (context) => {
  const ctxJson = JSON.stringify(context || {}, null, 2);
  return `
Wewe ni msaidizi mahiri wa mfumo wa School Accreditation System (SAS).

Malengo:
- Jibu maswali ya watumiaji wa SAS (sas-admin) kwa Kiswahili, kwa ufupi na kwa vitendo.
- Tumia taarifa za "SYSTEM_CONTEXT" (chini) kuongoza majibu; usibuni data ambazo hazipo.
- Ukiulizwa "nifanye nini", toa hatua 3-7 za kufuata, na eleza sababu fupi.
- Ukiwa hujui, uliza swali la kufafanua (1-2 maswali tu), au eleza data gani inahitajika.

Mwongozo wa usalama:
- Usionyeshe taarifa nyeti (token, password, secure_token, n.k.). Kama ipo kwenye context, iwe imesha-redact.

Output format (markdown):
1) Jibu
2) Hatua za kuchukua
3) Ikiwa inahitajika: Kitu cha kuangalia kwenye mfumo (menu/URL/permission)

SYSTEM_CONTEXT:
\`\`\`json
${ctxJson}
\`\`\`
  `.trim();
};

aiSupportRouter.post("/ai-support/chat", isAuth, permission("view-dashboard"), async (req, res) => {
  try {
    const messages = coerceMessages(req.body?.messages);
    if (!messages.length) {
      return res.send({
        error: true,
        statusCode: 422,
        message: "Tuma angalau ujumbe mmoja (messages).",
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const context = await buildSupportContext({ req, userMessage: lastUserMessage });

    const systemPrompt = buildSystemPrompt(context);
    const ollamaMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const { content } = await chat({
      messages: ollamaMessages,
      model: safeTrim(req.body?.model),
      temperature: req.body?.temperature,
      num_predict: req.body?.num_predict,
    });

    return res.send({
      error: false,
      statusCode: 300,
      data: {
        reply: content,
        context_used: context,
      },
      message: "AI response",
    });
  } catch (error) {
    const message = safeTrim(error?.message) || "Imeshindikana kuwasiliana na AI (Ollama).";
    return res.send({
      error: true,
      statusCode: 306,
      message: message.includes("fetch failed")
        ? "Ollama haipatikani. Hakikisha Ollama ina-run kwenye kompyuta/server, kisha jaribu tena."
        : message,
    });
  }
});

module.exports = aiSupportRouter;

