# Expense Analytics + AI Accountant

Полноценный fullstack-шаблон:
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **База данных:** SQLite
- **AI поддержка:** OpenAI API (персональные советы как личный бухгалтер)

## Запуск

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env
# укажите OPENAI_API_KEY в .env
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

Backend API: http://localhost:4000/api

## Основные API
- `POST /api/expenses` — добавить расход
- `GET /api/expenses` — список расходов
- `GET /api/analytics` — аналитика и рекомендации AI
