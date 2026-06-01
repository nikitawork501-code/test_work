import { test, expect } from '@playwright/test';
import { QiwPayoutApiClient } from '../utils/apiClient';
import { testConfig } from '../config/testData';

test.describe('Service Availability Tests', () => {
  let apiClient: QiwPayoutApiClient;
  const apiToken = process.env.QIWI_API_TOKEN || 'test_token_required';

  test.beforeEach(async ({ request }) => {
    apiClient = new QiwPayoutApiClient(request, apiToken, testConfig.baseUrl);
  });

  test('Get all payments - should return array with correct format', async () => {
    const response = await apiClient.getAllPayments(
      testConfig.testData.agentId,
      testConfig.testData.pointId
    );

    // Проверяем что сервис отвечает (200 или 401 если нет токена)
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const payments = await response.json();
      
      // Проверяем что ответ - массив
      expect(Array.isArray(payments)).toBeTruthy();
      
      if (payments.length > 0) {
        const firstPayment = payments[0];
        
        // Проверяем наличие обязательных полей согласно документации
        expect(firstPayment).toHaveProperty('paymentId');
        expect(firstPayment).toHaveProperty('status');
        expect(firstPayment.status).toHaveProperty('value');
        expect(firstPayment).toHaveProperty('amount');
        expect(firstPayment.amount).toHaveProperty('value');
        expect(firstPayment.amount).toHaveProperty('currency');
        
        // Проверяем что статус соответствует одному из допустимых
        const validStatuses = ['CREATED', 'READY', 'FAILED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'];
        expect(validStatuses).toContain(firstPayment.status.value);
      }
    } else if (response.status() === 401) {
      // Сервис требует авторизацию - это нормально
      const errorBody = await response.json();
      expect(errorBody).toHaveProperty('errorCode');
    }
  });

  test('Service response time should be acceptable', async () => {
    const startTime = Date.now();
    const response = await apiClient.getAllPayments(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      1
    );
    const responseTime = Date.now() - startTime;
    
    // Сервис должен отвечать за разумное время (менее 5 секунд)
    expect(responseTime).toBeLessThan(5000);
  });
});