const express = require("express");
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const BARBERSHOP = {
  name: "Barbershop Pro",
  weekdays: "10:00 – 20:00",
  weekend: "10:00 – 18:00",
  haircut: "250 грн",
  beard: "150 грн",
  combo: "350 грн",
  kids: "180 грн",
  address: "вул. Незалежності, 12",
};

const SYSTEM_PROMPT = `Ти — ввічливий асистент барбершопа "${BARBERSHOP.name}". Відповідай коротко і по суті, лише українською.
Години роботи: Пн–Пт ${BARBERSHOP.weekdays}, Сб–Нд ${BARBERSHOP.weekend}
Стрижка: ${BARBERSHOP.haircut}, Борода: ${BARBERSHOP.beard}, Стрижка+борода: ${BARBERSHOP.combo}, Дитяча: ${BARBERSHOP.kids}
Адреса: ${BARBERSHOP.address}
Якщо питання не про барбершоп — скажи що можеш відповідати лише на питання про салон.`;

const userHistories = {};

async function askGemini(userId, userMessage) {
  if (!userHistories[userId]) userHistories[userId] = [];
  userHistories[userId].push({ role: "user", parts: [{ text: userMessage }] });
  if (userHistories[userId].length > 20) {
    userHistories[userId] = userHistories[userId].slice(-20);
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: userHistories[userId],
      }),
    }
  );
  const data = await response.json();
  console.log("Gemini:", JSON.stringify(data).slice(0, 300));
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Вибачте, не зміг відповісти.";
  userHistories[userId].push({ role: "model", parts: [{ text: reply }] });
  return reply;
}

async function sendTelegramMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message?.text) return;
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  if (text === "/start") {
    await sendTelegramMessage(chatId, `Привіт! Я бот барбершопа 💈\nПитайте про ціни, години роботи, адресу.`);
    return;
  }
  try {
    const reply = await askGemini(userId, text);
    await sendTelegramMessage(chatId, reply);
  } catch (err) {
    console.error("Error:", err);
    await sendTelegramMessage(chatId, "Вибачте, сталася помилка.");
  }
});

app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
