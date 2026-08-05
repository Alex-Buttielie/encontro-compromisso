"""Gift card application service (thin orchestration over the domain)."""
from logger import get_logger
from models import GiftCard
from domain.enums import LedgerEntryType
from domain.exceptions import DomainError
from repositories.giftcard_repository import GiftCardRepository
from repositories.wallet_repository import WalletRepository
from services.email_sender import get_email_sender


class GiftCardService:
    """Coordinates gift card creation, redemption, and fraud prevention."""

    def __init__(self, giftcard_repository=None, wallet_repository=None, email_sender=None):
        self.giftcard_repository = giftcard_repository or GiftCardRepository()
        self.wallet_repository = wallet_repository or WalletRepository()
        self.email_sender = email_sender or get_email_sender()
        self.logger = get_logger(self.__class__.__name__)

    def create_gift_card(self, data):
        """Create and send a gift card to the recipient."""
        from datetime import datetime, date as date_cls

        validity_days = data.get('validityDays')
        valid_until = data.get('validUntil')
        if not validity_days and valid_until:
            try:
                target = date_cls.fromisoformat(valid_until)
                today = date_cls.today()
                validity_days = max((target - today).days, 1)
            except (ValueError, TypeError):
                pass

        try:
            gc = GiftCard.create(
                user_id=data['userId'],
                amount=data.get('amount'),
                purchaser_id=data.get('purchaserId', data['userId']),
                recipient_email=data.get('recipientEmail'),
                validity_days=validity_days,
            )
        except DomainError as e:
            self.logger.warning('Gift card validation failed: errors=%s', e.errors)
            return {'success': False, 'errors': e.errors}

        self.giftcard_repository.add(gc)
        self._send_gift_card_email(gc)
        self.logger.info('Gift card created: id=%s code=%s amount=%s', gc.id, gc.code, gc.amount)
        return {'success': True, 'giftCard': gc.to_dict()}

    def redeem_gift_card(self, code, redeemed_by_email):
        """Redeem a gift card by its code. Credits the redeemer's wallet."""
        gc = self.giftcard_repository.find_by_code(code)
        if not gc:
            return {'success': False, 'errors': ['Código de gift card não encontrado']}

        try:
            gc.redeem(redeemed_by_email)
        except DomainError as e:
            self.logger.warning('Redeem failed: code=%s errors=%s', code, e.errors)
            return {'success': False, 'errors': e.errors}

        self.giftcard_repository.save(gc)

        # Credit the redeemed amount to the redeemer's wallet
        # Find the user by email
        from repositories.user_repository import UserRepository
        user = UserRepository().find_by_email(redeemed_by_email)
        if user:
            wallet = self.wallet_repository.get_or_create(user.id)
            wallet.credit(
                gc.amount, LedgerEntryType.GIFT_CARD_REDEMPTION,
                f'Resgate de gift card: {gc.code}',
                reference_type='gift_card', reference_id=str(gc.id),
            )
            self.wallet_repository.save(wallet)
            self.logger.info('Wallet credited from gift card: user_id=%s amount=%s', user.id, gc.amount)

        self.logger.info('Gift card redeemed: id=%s by=%s', gc.id, redeemed_by_email)
        return {'success': True, 'giftCard': gc.to_dict()}

    def block_gift_card(self, code, user_id):
        """Block a gift card (fraud prevention)."""
        gc = self.giftcard_repository.find_by_code(code)
        if not gc:
            return {'success': False, 'errors': ['Gift card não encontrado']}
        if gc.user_id != user_id:
            return {'success': False, 'errors': ['Não autorizado']}

        try:
            gc.block()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.giftcard_repository.save(gc)
        self.logger.info('Gift card blocked: id=%s', gc.id)
        return {'success': True, 'giftCard': gc.to_dict()}

    def get_gift_cards_by_user(self, user_id):
        """Get all gift cards created by a user."""
        cards = self.giftcard_repository.find_by_user_id(user_id)
        return [c.to_dict() for c in cards]

    def _send_gift_card_email(self, gc):
        self.email_sender.send(
            to=gc.recipient_email,
            subject='Você recebeu um Gift Card! - Profissional OS',
            body=f'Olá! Você recebeu um gift card no valor de R$ {gc.amount:.2f}.\n'
                 f'Use o código: {gc.code}\n'
                 f'Validade: {gc.expires_at.strftime("%d/%m/%Y") if gc.expires_at else "N/A"}',
        )
