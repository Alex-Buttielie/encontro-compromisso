"""Payment gateway abstraction.

This is a sandbox/mock implementation that simulates a Brazilian payment
gateway (Pix, credit card, etc.). It never stores full card data — only
gateway tokens. The real implementation would integrate with a provider
like Mercado Pago, Pagar.me, or Stripe Brasil.
"""
import secrets
import time
from logger import get_logger


class PaymentGateway:
    """Abstract payment gateway interface."""

    def create_charge(self, payment):
        raise NotImplementedError

    def process_webhook(self, payload):
        raise NotImplementedError


class SandboxGateway(PaymentGateway):
    """Sandbox/mock gateway for development and testing.

    Simulates: Pix (instant), credit card (async), debit card, QR code.
    Returns gateway tokens and transaction IDs without storing card data.
    """

    def __init__(self):
        self.logger = get_logger('SandboxGateway')
        self._processed_keys = set()

    def create_charge(self, payment):
        """Create a charge in the sandbox gateway.

        Returns a dict with gateway_token, gateway_transaction_id, and
        the initial status to transition to.
        """
        gateway_tx_id = f'sbx_{secrets.token_hex(12)}'
        gateway_token = f'tok_{secrets.token_hex(16)}'

        payment.gateway_token = gateway_token
        payment.gateway_transaction_id = gateway_tx_id

        if payment.method == 'pix':
            # Pix is instant in sandbox
            self.logger.info('Sandbox charge (Pix): tx_id=%s amount=%s', gateway_tx_id, payment.amount)
            return {
                'gateway_transaction_id': gateway_tx_id,
                'gateway_token': gateway_token,
                'next_status': 'processing',
                'pix_qr_code': f'00020126{sandbox_brcode()}',
                'pix_copy_paste': f'pix.sandbox.{gateway_tx_id}',
            }
        elif payment.method == 'credit_card':
            self.logger.info('Sandbox charge (Credit Card): tx_id=%s amount=%s installments=%s',
                             gateway_tx_id, payment.amount, payment.installments)
            return {
                'gateway_transaction_id': gateway_tx_id,
                'gateway_token': gateway_token,
                'next_status': 'authorized',
            }
        elif payment.method == 'debit_card':
            self.logger.info('Sandbox charge (Debit Card): tx_id=%s amount=%s', gateway_tx_id, payment.amount)
            return {
                'gateway_transaction_id': gateway_tx_id,
                'gateway_token': gateway_token,
                'next_status': 'processing',
            }
        elif payment.method == 'qr_code':
            self.logger.info('Sandbox charge (QR Code): tx_id=%s amount=%s', gateway_tx_id, payment.amount)
            return {
                'gateway_transaction_id': gateway_tx_id,
                'gateway_token': gateway_token,
                'next_status': 'processing',
                'qr_code': f'qr.sandbox.{gateway_tx_id}',
            }
        else:
            self.logger.info('Sandbox charge (Wallet/GiftCard): tx_id=%s amount=%s', gateway_tx_id, payment.amount)
            return {
                'gateway_transaction_id': gateway_tx_id,
                'gateway_token': gateway_token,
                'next_status': 'processing',
            }

    def simulate_payment(self, gateway_transaction_id):
        """Simulate a successful payment notification (as if webhook arrived).

        In sandbox mode, this is called to move a payment to 'paid'.
        """
        self.logger.info('Sandbox simulate payment: tx_id=%s', gateway_transaction_id)
        return {
            'gateway_transaction_id': gateway_transaction_id,
            'status': 'paid',
        }

    def simulate_failure(self, gateway_transaction_id):
        """Simulate a payment failure."""
        self.logger.info('Sandbox simulate failure: tx_id=%s', gateway_transaction_id)
        return {
            'gateway_transaction_id': gateway_transaction_id,
            'status': 'failed',
        }

    def process_webhook(self, payload):
        """Process a webhook payload from the gateway.

        Returns a normalized event dict.
        """
        self.logger.info('Webhook received: %s', payload.get('event', 'unknown'))
        return {
            'event': payload.get('event'),
            'gateway_transaction_id': payload.get('transaction_id'),
            'status': payload.get('status'),
            'idempotency_key': payload.get('idempotency_key'),
            'amount': payload.get('amount'),
        }

    def refund(self, gateway_transaction_id, amount=None):
        """Process a refund through the gateway."""
        full = amount is None
        self.logger.info('Sandbox refund: tx_id=%s amount=%s full=%s', gateway_transaction_id, amount, full)
        return {
            'gateway_transaction_id': gateway_transaction_id,
            'refund_amount': amount,
            'full': full,
        }


def sandbox_brcode():
    """Generate a fake BR code for Pix sandbox."""
    return secrets.token_hex(16)


_gateway = None


def get_gateway():
    """Get the singleton gateway instance."""
    global _gateway
    if _gateway is None:
        _gateway = SandboxGateway()
    return _gateway
