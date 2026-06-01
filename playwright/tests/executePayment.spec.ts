import { test, expect } from '@playwright/test';
import { QiwPayoutApiClient } from '../utils/apiClient';
import { testConfig } from '../config/testData';
import { v4 as uuidv4 } from 'uuid';

test.describe('Execute Payment Tests', () => {
  let apiClient: QiwPayoutApiClient;
  const apiToken = process.env.QIWI_API_TOKEN || 'test_token_required';
  let paymentId: string;

  test.beforeEach(async ({ request }) => {
    apiClient = new QiwPayoutApiClient(request, apiToken, testConfig.baseUrl);
    paymentId = `test-pay-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // Сначала создаем платеж
    const createResponse = await apiClient.createPayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId,
      '1.00',
      testConfig.testData.testWalletPhone,
      testConfig.testData.testCustomerPhone
    );
    expect(createResponse.status()).toBe(200);
  });

  test('Execute created payment - should start processing', async () => {
    const response = await apiClient.executePayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId
    );

    expect(response.status()).toBe(200);
    
    const executionData = await response.json();
    
    // Проверяем что исполнение инициировано
    expect(executionData.paymentId).toBe(paymentId);
    expect(executionData.status).toHaveProperty('value');
    
    // Статус может быть IN_PROGRESS или COMPLETED
    const validStatuses = ['IN_PROGRESS', 'COMPLETED'];
    expect(validStatuses).toContain(executionData.status.value);
    
    // Если платеж завершен, должны быть billingDetails
    if (executionData.status.value === 'COMPLETED') {
      expect(executionData).toHaveProperty('billingDetails');
      if (executionData.billingDetails) {
        expect(executionData.billingDetails).toHaveProperty('transactionId');
      }
    }
    
    // Сумма должна остаться 1 рубль
    expect(executionData.amount.value).toBe('1.00');
  });

  test('Execute payment multiple times - should be idempotent', async () => {
    // Первое исполнение
    const response1 = await apiClient.executePayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId
    );
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    
    // Небольшая пауза (согласно документации, при постановке в очередь - интервал 120с)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Второе исполнение
    const response2 = await apiClient.executePayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId
    );
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    
    // Статус не должен ухудшиться (не из COMPLETED в FAILED)
    const statusPriority: Record<string, number> = {
      'COMPLETED': 4,
      'IN_PROGRESS': 3,
      'READY': 2,
      'CREATED': 1,
      'FAILED': 0,
      'EXPIRED': 0
    };
    
    const priority1 = statusPriority[data1.status.value] || 0;
    const priority2 = statusPriority[data2.status.value] || 0;
    
    expect(priority2).toBeGreaterThanOrEqual(priority1);
  });

  test('Cannot execute non-existent payment', async () => {
    const fakePaymentId = `fake-${Date.now()}-${uuidv4()}`;
    const response = await apiClient.executePayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      fakePaymentId
    );
    
    // Должна быть ошибка 404 или 400
    expect([400, 404, 500]).toContain(response.status());
  });
});