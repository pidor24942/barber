# Barbershop Telegram Bot

## Швидкий старт

### 1. Отримайте токени
- **Telegram токен** — у @BotFather напишіть /newbot
- **Anthropic API ключ** — на https://console.anthropic.com

### 2. Налаштуйте барбершоп
Відкрийте `index.js` і відредагуйте об'єкт `BARBERSHOP`:
```js
const BARBERSHOP = {
  name: "Назва вашого барбершопа",
  weekdays: "10:00 – 20:00",
  weekend: "10:00 – 18:00",
  haircut: "250 грн",
  ...
};
```

### 3. Деплой на Railway.app (безкоштовно)

1. Зареєструйтесь на https://railway.app
2. Натисніть "New Project" → "Deploy from GitHub repo"
   (або "Empty project" і завантажте файли вручну)
3. Додайте змінні середовища:
   - `TELEGRAM_TOKEN` = ваш токен від BotFather
   - `ANTHROPIC_API_KEY` = ваш ключ від Anthropic
4. Після деплою скопіюйте URL вашого сервісу (наприклад `https://your-app.railway.app`)

### 4. Підключіть вебхук
Відкрийте в браузері (замініть значення):
```
https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=https://your-app.railway.app/webhook
```
Має повернути: `{"ok":true}`

### 5. Готово!
Напишіть /start вашому боту в Telegram.
