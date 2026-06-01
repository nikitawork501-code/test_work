import { test, expect } from '@playwright/test';
import { QiwPayoutApiClient } from '../utils/apiClient';
import { testConfig } from '../config/testData';
import { v4 as uuidv4 } from 'uuid';

test.describe('Create Payment Tests', () => {
  let apiClient: QiwPayoutApiClient;
  const apiToken = process.env.QIWI_API_TOKEN || 'test_token_required';
  let paymentId: string;

  test.beforeEach(async ({ request }) => {
    apiClient = new QiwPayoutApiClient(request, apiToken, testConfig.baseUrl);
    paymentId = `test-pay-${Date.now()}-${uuidv4().substring(0, 8)}`;
  });

  test('Create payment for 1 RUB - should succeed', async () => {
    const response = await apiClient.createPayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId,
      testConfig.testData.paymentAmount,
      testConfig.testData.testWalletPhone,
      testConfig.testData.testCustomerPhone
    );

    expect(response.status()).toBe(200);
    
    const paymentData = await response.json();
    
    // Проверяем что платеж создан с правильным ID
    expect(paymentData.paymentId).toBe(paymentId);
    
    // Проверяем сумму (ровно 1 рубль)
    expect(paymentData.amount.value).toBe('1.00');
    expect(paymentData.amount.currency).toBe('RUB');
    
    // Проверяем статус (должен быть READY или CREATED)
    const validStatuses = ['READY', 'CREATED'];
    expect(validStatuses).toContain(paymentData.status.value);
    
    // Проверяем получателя
    expect(paymentData.recipientDetails).toBeDefined();
    expect(paymentData.recipientDetails.providerCode).toBe('qiwi-wallet');
    expect(paymentData.recipientDetails.fields.account).toBe(testConfig.testData.testWalletPhone);
    
    // Проверяем наличие даты создания
    expect(paymentData.creationDateTime).toBeDefined();
    expect(new Date(paymentData.creationDateTime)).toBeInstanceOf(Date);
  });

  test('Create payment - should have unique paymentId', async () => {
    const response1 = await apiClient.createPayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId,
      '1.00',
      testConfig.testData.testWalletPhone,
      testConfig.testData.testCustomerPhone
    );
    
    expect(response1.status()).toBe(200);
    
    // Попытка создать платеж с тем же ID должен вернуть ошибку или тот же платеж
    const response2 = await apiClient.createPayment(
      testConfig.testData.agentId,
      testConfig.testData.pointId,
      paymentId,
      '2.00', // Другая сумма
      testConfig.testData.testWalletPhone,
      testConfig.testData.testCustomerPhone
    );
    
    // Согласно идемпотентности PUT метода
    if (response2.status() === 200) {
      const paymentData2 = await response2.json();
      // Сумма не должна измениться при повторном вызове с тем же ID
      expect(paymentData2.amount.value).toBe('1.00');
    }
  });
});