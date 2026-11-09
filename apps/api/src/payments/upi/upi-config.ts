import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keyBytes, UpiProvider } from './upi-rules';
@Injectable()
export class UpiConfig {
  constructor(private readonly config: ConfigService) {}
  get(key: string) {
    return this.config.get<string>(key);
  }
  list(key: string) {
    return (this.get(key) ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  }
  get key() {
    return keyBytes(this.get('UPI_RECONCILIATION_KEY'));
  }
  get synthetic() {
    return (
      this.get('NODE_ENV') !== 'production' &&
      this.get('UPI_SYNTHETIC_MODE') === 'true'
    );
  }
  status() {
    return {
      productionCollection: false,
      syntheticOnly: true,
      manualUpiEnabled:
        this.synthetic && this.get('MANUAL_UPI_ENABLED') === 'true',
      famappSandboxEnabled:
        this.synthetic &&
        this.get('FAMAPP_SANDBOX_ENABLED') === 'true' &&
        this.get('FAMAPP_PERSONAL_TEST_AUTHORIZED') === 'true',
      gmailEnabled: this.get('GMAIL_RECONCILIATION_ENABLED') === 'true',
      workerEnabled: this.get('UPI_RECONCILIATION_WORKER_ENABLED') === 'true',
      famappTemplateEnabled:
        this.get('GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED') === 'true',
      beneficiaryMappingVerified:
        this.get('GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED') === 'true',
      parser:
        this.get('GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED') === 'true'
          ? 'synthetic-v1 and famapp-credit-v1; authenticated sender and beneficiary binding required'
          : 'synthetic-v1; FamApp template fixtures validated, runtime adapter disabled',
    };
  }
  ensure(provider: string, email?: string) {
    const enabled =
      provider === 'MANUAL_UPI'
        ? this.status().manualUpiEnabled
        : provider === 'FAMAPP_SANDBOX' && this.status().famappSandboxEnabled;
    if (!enabled)
      throw new ServiceUnavailableException(
        'Custom UPI is disabled. Production collection is not available.',
      );
    if (
      email &&
      !this.list('UPI_TEST_PARTICIPANT_EMAILS').includes(email.toLowerCase())
    )
      throw new ForbiddenException(
        'Custom UPI is restricted to explicitly authorized test accounts.',
      );
    void this.key;
    return this.beneficiary(provider as UpiProvider);
  }
  beneficiary(provider: UpiProvider) {
    const value = this.get(
      provider === 'FAMAPP_SANDBOX'
        ? 'FAMAPP_TEST_UPI_ID'
        : 'MANUAL_UPI_TEST_ID',
    )?.toLowerCase();
    if (
      !value ||
      !/^[\w.-]{2,100}@[a-z0-9.-]{2,80}$/.test(value) ||
      (provider === 'FAMAPP_SANDBOX' && !value.endsWith('@fam')) ||
      (provider === 'MANUAL_UPI' && value.endsWith('@fam'))
    )
      throw new ServiceUnavailableException(
        'An authorized test beneficiary is not configured.',
      );
    return value;
  }
}
