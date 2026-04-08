const express = require("express");
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Налаштуйте свій барбершоп тут
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

Інформація про барбершоп:
- Години роботи: Пн–Пт ${BARBERSHOP.weekdays}, Сб–Нд ${BARBERSHOP.weekend}
- Стрижка: ${BARBERSHOP.haircut}
- Борода: ${BARBERSHOP.beard}
- Стрижка + борода: ${BARBERSHOP.combo}
- Дитяча стрижка: ${BARBERSHOP.kids}
- Адреса: ${BARBERSHOP.address}

Якщо питання не стосується барбершопа — ввічливо скажи, що можеш допомогти лише з питаннями про салон.`;

// Зберігаємо історію розмов для кожного користувача
const userHistories = {};

async function askClaude(userId, userMessage) {
  if (!userHistories[userId]) userHistories[userId] = [];

  userHistories[userId].push({ role: "user", content: userMessage });

  // Тримаємо тільки останні 20 повідомлень щоб не перевантажувати
  if (userHistories[userId].length > 20) {
    userHistories[userId] = userHistories[userId].slice(-20);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: userHistories[userId],
    }),
  });

  const data = await response.json();
  const reply = data.content.map((b) => b.text || "").join("");

  userHistories[userId].push({ role: "assistant", content: reply });

  return reply;
}

async function sendTelegramMessage(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}

// Вебхук від Telegram
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // відповідаємо одразу щоб Telegram не повторював

  const message = req.body?.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;

  // Команда /start
  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      `Привіт! Я бот барбершопа "${BARBERSHOP.name}" 💈\n\nЗапитайте мене про:\n• Ціни на послуги\n• Години роботи\n• Адресу`
    );
    return;
  }

  try {
    const reply = await askClaude(userId, text);
    await sendTelegramMessage(chatId, reply);
  } catch (err) {
    console.error(err);
    await sendTelegramMessage(chatId, "Вибачте, сталася помилка. Спробуйте ще раз.");
  }
});

app.get("/", (req, res) => res.send("Barbershop bot is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
