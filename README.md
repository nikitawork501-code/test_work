# QIWI Payout API Tests (Non-Production Environment)

⚠️ **ВАЖНО**: Тесты предназначены ТОЛЬКО для тестовой среды (`api-test.qiwi.com`). Не используйте в production!

## Предварительные требования

1. Node.js 18+
2. npm или yarn
3. Доступ к тестовой среде QIWI Payout API
4. Тестовые учетные данные (токен, agentId, pointId)

## Установка

```bash
# Клонирование репозитория
git clone <your-git-url>
cd qiwi-payout-tests

# Установка зависимостей Playwright
cd playwright
npm install
npx playwright install

# Настройка переменных окружения
cp .env.example .env
# Заполните .env вашими тестовыми данными