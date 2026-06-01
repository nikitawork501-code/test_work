export const testConfig = {
  baseUrl: 'https://api-test.qiwi.com',
  endpoints: {
    balance: '/partner/payout/v1/agents/${agentId}/points/${pointId}/balance',
    payments: '/partner/payout/v1/agents/${agentId}/points/${pointId}/payments',
    executePayment: '/partner/payout/v1/agents/${agentId}/points/${pointId}/payments/${paymentId}/execute'
  },
  testData: {
    agentId: 'acme',
    pointId: '00001',
    testWalletPhone: '79123456789',
    testCustomerPhone: '9123456789',
    paymentAmount: '1.00',
    currency: 'RUB'
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};