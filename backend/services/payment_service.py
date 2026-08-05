"""Payment application service (thin orchestration over the domain)."""
from logger import get_logger
from models import Payment
from domain.enums import PaymentMethod, PaymentStatus, LedgerEntryType
from domain.exceptions import DomainError, IdempotencyError, PaymentError
from repositories.payment_repository import PaymentRepository
from repositories.wallet_repository import WalletRepository
from services.payment_gateway import get_gateway


class PaymentService:
    """Coordinates payments through the gateway with idempotency."""

    def __init__(self, payment_repository=None, wallet_repository=None, gateway=None):
        self.payment_repository = payment_repository or PaymentRepository()
        self.wallet_repository = wallet_repository or WalletRepository()
        self.gateway = gateway or get_gateway()
        self.logger = get_logger(self.__class__.__name__)

    def create_payment(self, data):
        """Create a payment with idempotency check.

        If the idempotency_key already exists, return the existing payment
        (idempotent replay). If the payload differs, raise IdempotencyError.
        """
        idempotency_key = data.get('idempotencyKey')

        # Idempotency check
        if idempotency_key:
            existing = self.payment_repository.find_by_idempotency_key(idempotency_key)
            if existing:
                if (existing.amount != data.get('amount') or
                        existing.method != data.get('method')):
                    raise IdempotencyError('Conflito de idempotência: dados diferentes para mesma chave')
                self.logger.info('Idempotent replay: key=%s payment_id=%s', idempotency_key, existing.id)
                return {'success': True, 'payment': existing.to_dict(), 'replay': True}

        try:
            payment = Payment.create(
                user_id=data['userId'],
                amount=data.get('amount'),
                method=data.get('method'),
                description=data.get('description'),
                idempotency_key=idempotency_key,
                coupon_code=data.get('couponCode'),
                metadata=data.get('metadata'),
            )
        except DomainError as e:
            self.logger.warning('Payment validation failed: errors=%s', e.errors)
            return {'success': False, 'errors': e.errors}

        # Set split if provided
        if data.get('platformFee') is not None and data.get('providerAmount') is not None:
            try:
                payment.set_split(data['platformFee'], data['providerAmount'])
            except DomainError as e:
                return {'success': False, 'errors': e.errors}

        # Set installments if provided
        if data.get('installments') and data.get('installments') > 1:
            try:
                payment.set_installments(data['installments'])
            except DomainError as e:
                return {'success': False, 'errors': e.errors}

        # Charge through gateway
        gateway_result = self.gateway.create_charge(payment)

        # Transition to the gateway's initial status
        next_status = gateway_result.get('next_status', 'processing')
        if next_status == 'authorized':
            payment.authorize()
        elif next_status == 'processing':
            payment.start_processing()

        self.payment_repository.add(payment)
        self.logger.info('Payment created: id=%s amount=%s method=%s status=%s',
                         payment.id, payment.amount, payment.method, payment.status)

        result = {'success': True, 'payment': payment.to_dict()}
        result.update({k: v for k, v in gateway_result.items()
                       if k not in ('next_status',)})
        return result

    def process_webhook(self, payload):
        """Process a webhook from the payment gateway (idempotent).

        Normalizes the event, finds the payment by gateway transaction ID,
        and transitions the payment state machine accordingly.
        """
        event = self.gateway.process_webhook(payload)
        gateway_tx_id = event.get('gateway_transaction_id')
        status = event.get('status')

        if not gateway_tx_id:
            self.logger.warning('Webhook missing gateway_transaction_id')
            return {'success': False, 'errors': ['gateway_transaction_id ausente']}

        payment = self.payment_repository.find_by_gateway_transaction_id(gateway_tx_id)
        if not payment:
            self.logger.warning('Webhook: payment not found for tx_id=%s', gateway_tx_id)
            return {'success': False, 'errors': ['Pagamento não encontrado']}

        # Idempotency: if payment is already in the target state, skip
        if payment.status == status:
            self.logger.info('Webhook idempotent skip: payment_id=%s already %s', payment.id, status)
            return {'success': True, 'payment': payment.to_dict(), 'replay': True}

        try:
            if status == 'paid':
                if payment.current_status == PaymentStatus.AUTHORIZED:
                    payment.start_processing()
                payment.mark_paid()
            elif status == 'failed':
                payment.fail()
            elif status == 'cancelled':
                payment.cancel()
            elif status == 'disputed':
                payment.dispute()
            elif status == 'fully_refunded':
                payment.full_refund()
            elif status == 'partially_refunded':
                payment.partial_refund(event.get('refund_amount', 0))
            else:
                self.logger.warning('Webhook: unknown status=%s', status)
                return {'success': False, 'errors': [f'Status desconhecido: {status}']}
        except DomainError as e:
            self.logger.warning('Webhook state transition failed: payment_id=%s errors=%s', payment.id, e.errors)
            return {'success': False, 'errors': e.errors}

        # If payment is settled, credit the provider's wallet
        if payment.current_status.is_settled and payment.provider_amount > 0:
            wallet = self.wallet_repository.get_or_create(payment.user_id)
            wallet.credit(
                payment.provider_amount,
                LedgerEntryType.CREDIT,
                f'Pagamento recebido: {payment.description}',
                reference_type='payment',
                reference_id=str(payment.id),
            )
            self.wallet_repository.save(wallet)
            self.logger.info('Wallet credited: user_id=%s amount=%s', payment.user_id, payment.provider_amount)

        self.payment_repository.save(payment)
        self.logger.info('Webhook processed: payment_id=%s status=%s', payment.id, payment.status)
        return {'success': True, 'payment': payment.to_dict()}

    def refund_payment(self, payment_id, amount=None):
        """Refund a payment (full or partial)."""
        payment = self.payment_repository.get_by_id(payment_id)
        if not payment:
            return {'success': False, 'errors': ['Pagamento não encontrado']}

        try:
            if amount is None:
                payment.full_refund()
            else:
                payment.partial_refund(amount)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.gateway.refund(payment.gateway_transaction_id, amount)
        self.payment_repository.save(payment)
        self.logger.info('Payment refunded: id=%s amount=%s', payment_id, amount or 'full')
        return {'success': True, 'payment': payment.to_dict()}

    def get_payment(self, payment_id):
        """Get payment by ID."""
        payment = self.payment_repository.get_by_id(payment_id)
        if not payment:
            return None
        return payment.to_dict()

    def get_payments_by_user(self, user_id):
        """Get all payments for a user."""
        payments = self.payment_repository.find_by_user_id(user_id)
        return [p.to_dict() for p in payments]
