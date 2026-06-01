import { APIRequestContext, expect } from '@playwright/test';

export class QiwPayoutApiClient {
  constructor(
    private request: APIRequestContext,
    private apiToken: string,
    private baseUrl: string
  ) {}

  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    };
  }

  private replaceParams(url: string, params: Record<string, string>): string {
    let resultUrl = url;
    for (const [key, value] of Object.entries(params)) {
      resultUrl = resultUrl.replace(`\${${key}}`, value);
    }
    return resultUrl;
  }

  async getAllPayments(agentId: string, pointId: string, limit: number = 5) {
    const url = `${this.baseUrl}/partner/payout/v1/agents/${agentId}/points/${pointId}/payments?limit=${limit}`;
    const response = await this.request.get(url, { headers: this.getHeaders() });
    return response;
  }

  async getBalance(agentId: string, pointId: string) {
    const url = `${this.baseUrl}/partner/payout/v1/agents/${agentId}/points/${pointId}/balance`;
    const response = await this.request.get(url, { headers: this.getHeaders() });
    return response;
  }

  async createPayment(agentId: string, pointId: string, paymentId: string, amount: string, recipientAccount: string, customerPhone: string) {
    const url = `${this.baseUrl}/partner/payout/v1/agents/${agentId}/points/${pointId}/payments/${paymentId}`;
    const currentDateTime = new Date().toISOString();
    
    const body = {
      recipientDetails: {
        providerCode: "qiwi-wallet",
        fields: {
          account: recipientAccount
        }
      },
      amount: {
        value: amount,
        currency: "RUB"
      },
      customer: {
        account: `test-customer-${Date.now()}`,
        email: "test@example.com",
        phone: customerPhone
      },
      source: {
        paymentType: "NO_EXTRA_CHARGE",
        paymentToolType: "BANK_ACCOUNT",
        paymentTerminalType: "INTERNET_BANKING",
        paymentDate: currentDateTime
      }
    };

    const response = await this.request.put(url, {
      headers: this.getHeaders(),
      data: body
    });
    return response;
  }

  async executePayment(agentId: string, pointId: string, paymentId: string) {
    const url = `${this.baseUrl}/partner/payout/v1/agents/${agentId}/points/${pointId}/payments/${paymentId}/execute`;
    const response = await this.request.post(url, { headers: this.getHeaders() });
    return response;
  }
}