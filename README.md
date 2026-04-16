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

---

## Как поставить на домен (production)
Ниже — рабочая схема для Ubuntu + Nginx + systemd + Let's Encrypt.

### 1) Что подготовить
- VPS/сервер с Ubuntu 22.04+
- Домен, например `mybudget.ru`
- DNS записи:
  - `A` запись: `mybudget.ru -> IP_СЕРВЕРА`
  - `A` запись: `www.mybudget.ru -> IP_СЕРВЕРА`

### 2) Установка Node.js, Nginx, Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3) Клонирование и сборка проекта
```bash
# пример пути
sudo mkdir -p /var/www/expense-app
sudo chown -R $USER:$USER /var/www/expense-app
cd /var/www/expense-app

git clone <YOUR_REPO_URL> .

cd backend
npm ci
cp .env.example .env
# отредактируйте .env: PORT=4000 и OPENAI_API_KEY=...

cd ../frontend
npm ci
npm run build
```

После `npm run build` статические файлы будут в `frontend/dist`.

### 4) Запуск backend как сервис (systemd)
Создайте файл `/etc/systemd/system/expense-backend.service`:

```ini
[Unit]
Description=Expense Analytics Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/expense-app/backend
EnvironmentFile=/var/www/expense-app/backend/.env
ExecStart=/usr/bin/node /var/www/expense-app/backend/src/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Применить:
```bash
sudo chown -R www-data:www-data /var/www/expense-app
sudo systemctl daemon-reload
sudo systemctl enable expense-backend
sudo systemctl start expense-backend
sudo systemctl status expense-backend
```

### 5) Nginx: домен + API прокси
Создайте `/etc/nginx/sites-available/expense-app`:

```nginx
server {
    listen 80;
    server_name mybudget.ru www.mybudget.ru;

    root /var/www/expense-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активировать конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/expense-app /etc/nginx/sites-enabled/expense-app
sudo nginx -t
sudo systemctl reload nginx
```

### 6) HTTPS (Let's Encrypt)
```bash
sudo certbot --nginx -d mybudget.ru -d www.mybudget.ru
```

### 7) Важное изменение в frontend
Сейчас в коде зашит API URL `http://localhost:4000/api`.
Для домена нужно заменить на относительный путь `/api`, чтобы frontend и backend работали через один домен/Nginx прокси.

В файле `frontend/src/App.jsx`:
```js
const API = '/api';
```

Затем пересобрать frontend:
```bash
cd /var/www/expense-app/frontend
npm run build
sudo systemctl reload nginx
```

### 8) Обновление приложения после деплоя
```bash
cd /var/www/expense-app
git pull

cd backend
npm ci
sudo systemctl restart expense-backend

cd ../frontend
npm ci
npm run build
sudo systemctl reload nginx
```

