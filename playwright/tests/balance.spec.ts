import { test, expect } from '@playwright/test';
import { QiwPayoutApiClient } from '../utils/apiClient';
import { testConfig } from '../config/testData';

test.describe('Balance Tests', () => {
  let apiClient: QiwPayoutApiClient;
  const apiToken = process.env.QIWI_API_TOKEN || 'test_token_required';

  test.beforeEach(async ({ request }) => {
    apiClient = new QiwPayoutApiClient(request, apiToken, testConfig.baseUrl);
  });

  test('Balance should be greater than 0', async () => {
    const response = await apiClient.getBalance(
      testConfig.testData.agentId,
      testConfig.testData.pointId
    );

    expect(response.status()).toBe(200);
    
    const balanceData = await response.json();
    
    // Проверяем структуру ответа согласно документации
    expect(balanceData).toHaveProperty('balance');
    expect(balanceData).toHaveProperty('available');
    expect(balanceData.balance).toHaveProperty('value');
    expect(balanceData.balance).toHaveProperty('currency');
    
    // КЛЮЧЕВОЕ УСЛОВИЕ: баланс всегда больше 0
    const balanceValue = parseFloat(balanceData.balance.value);
    expect(balanceValue).toBeGreaterThan(0);
    
    // Дополнительные проверки
    expect(balanceData.balance.currency).toBe('RUB');
    
    // Проверяем что available >= balance (логично для доступных средств)
    if (balanceData.available) {
      const availableValue = parseFloat(balanceData.available.value);
      expect(availableValue).toBeGreaterThanOrEqual(balanceValue);
    }
  });

  test('Balance should be a valid number', async () => {
    const response = await apiClient.getBalance(
      testConfig.testData.agentId,
      testConfig.testData.pointId
    );
    
    const balanceData = await response.json();
    const balanceValue = parseFloat(balanceData.balance.value);
    
    expect(isNaN(balanceValue)).toBeFalsy();
    expect(balanceValue).toBeFinite();
  });
});