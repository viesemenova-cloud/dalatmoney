# 🌿 Далат Мани

Общий трекер расходов для двух семей — Артём & Наташа и Настя & Рома.

## Структура проекта

```
dalatmoney/
├── src/
│   ├── App.jsx       ← основное приложение
│   └── main.jsx      ← точка входа
├── index.html        ← в корне (важно для Vite!)
├── package.json
├── vite.config.js
└── nixpacks.toml     ← конфиг для Railway
```

## Запуск локально

```bash
npm install
npm run dev
```

## Деплой

Railway автоматически деплоит при каждом push в `main`.
