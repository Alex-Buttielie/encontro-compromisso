"""Rich domain models using Firestore.

These are NOT anemic: each entity owns its invariants and behavior.
Creation goes through `create(...)` factories that validate, and state
changes go through intention-revealing methods (e.g. `Appointment.confirm()`)
that protect the entity's invariants. The service layer only orchestrates.
"""
import json
import re
import secrets
from datetime import date, datetime, timedelta

from database import FirestoreModel
from domain.enums import (
    AccountStatus, AgentActionStatus, AgentStatus, AgentType, ApiKeyStatus,
    AppointmentStatus, AuditActionType, BillingStatus, BranchType,
    CampaignChannel, CampaignStatus, ChatType, CheckStatus, CheckType,
    ClientSegment, CommissionStatus, CommissionType, ContractStatus,
    CouponType, DataRequestStatus, DataRequestType, EmployeeRole,
    EmployeeStatus, FinancialEntryType, GiftCardStatus, LedgerEntryType,
    LoyaltyTransactionType, MessageStatus, MessageType, ModerationStatus,
    NotificationChannel, NotificationPriority, NotificationType,
    PackageStatus, PaymentMethod, PaymentStatus, PeriodStatus, PostAction,
    PostStatus, PostType, QuoteStatus, ReferralStatus, ReportReason,
    ReportStatus, RouteStatus, SatisfactionStatus, SignatureStatus,
    StoryStatus, StockMovementType, SubscriptionStatus, TransferStatus,
    TransactionStatus, TransactionType, UserRole, WebhookStatus,
    WorkOrderStatus, WorkflowActionType, WorkflowConditionType,
    WorkflowExecutionStatus, WorkflowStatus, WorkflowTriggerType,
    CONTRACT_TRANSITIONS, DATA_REQUEST_TRANSITIONS, MESSAGE_STATUS_TRANSITIONS,
    QUOTE_TRANSITIONS, REFERRAL_TRANSITIONS, SUBSCRIPTION_TRANSITIONS,
    TRANSFER_TRANSITIONS,
)
from domain.exceptions import (
    AIAgentError, AdminError, AnalyticsError, ApiError, BranchError, ChatError,
    CommissionError, CRMError, DocumentError, EmployeeError, ERPError,
    GiftCardError, HomeCareError, IdempotencyError, InventoryError,
    InvalidStateTransition, InvalidTokenError, LgpdError, LoyaltyError,
    MarketingError, NotificationError, PackageError, PaymentError, QuoteError,
    ReferralError, SocialError, SubscriptionError, TransferError,
    ValidationError, WalletError, WorkflowError,
)
from domain.terms import CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION
from domain.value_objects import Duration, Email, Money

_LINK_RE = re.compile(r'^[a-z0-9-]+$')


class User(FirestoreModel):
    collection = 'users'
    """Platform user. Can be a provider (prestador) or client (cliente).

    Owns profile invariants and public identity.
    """
    _EMAIL_CONFIRMATION_TTL = timedelta(hours=24)
    _PASSWORD_RESET_TTL = timedelta(hours=1)
    @classmethod
    def create(cls, name, email, password_hash, role='provider',
               profession='', phone='', address='', bio='', link='',
               cep='', rua='', numero='', complemento='', bairro='', cidade='', estado='',
               terms_accepted=False, privacy_accepted=False):
        """Factory enforcing the invariants of a valid user.

        A new user must explicitly accept the Terms of Use and the Privacy
        Policy (LGPD). The e-mail starts unconfirmed and a confirmation
        token is issued immediately.
        """
        errors = []
        if not name or not name.strip():
            errors.append('Nome é obrigatório')
        email_vo = Email(email)
        if email_vo.is_empty():
            errors.append('E-mail é obrigatório')
        if not terms_accepted:
            errors.append('É necessário aceitar os Termos de Uso')
        if not privacy_accepted:
            errors.append('É necessário aceitar a Política de Privacidade')
        if errors:
            raise ValidationError('Dados de usuário inválidos', errors)

        role_enum = UserRole.from_value(role)
        # Providers must have a profession
        if role_enum == UserRole.PROVIDER and (not profession or not profession.strip()):
            errors.append('Profissão é obrigatória para prestadores')
        if errors:
            raise ValidationError('Dados de usuário inválidos', errors)

        user = cls(
            name=name.strip(),
            email=str(email_vo),
            password_hash=password_hash,
            role=role_enum.value,
            profession=(profession or '').strip(),
            phone=phone or '',
            address=address or '',
            cep=cep or '',
            rua=rua or '',
            numero=numero or '',
            complemento=complemento or '',
            bairro=bairro or '',
            cidade=cidade or '',
            estado=estado or '',
            bio=bio or '',
            link=cls._normalize_link(link),
            deleted_at=None,
            password_reset_token=None,
            password_reset_expires_at=None,
        )
        user.email_confirmed = False
        now = datetime.utcnow()
        user.created_at = now
        user.terms_accepted_version = CURRENT_TERMS_VERSION
        user.terms_accepted_at = now
        user.privacy_accepted_version = CURRENT_PRIVACY_VERSION
        user.privacy_accepted_at = now
        user.generate_email_confirmation_token()
        return user

    def update_profile(self, name=None, profession=None, phone=None,
                       address=None, bio=None, link=None,
                       cep=None, rua=None, numero=None, complemento=None,
                       bairro=None, cidade=None, estado=None):
        """Update mutable profile fields, keeping invariants."""
        if name is not None:
            if not name.strip():
                raise ValidationError('Nome é obrigatório')
            self.name = name.strip()
        if profession is not None:
            if not profession.strip():
                raise ValidationError('Profissão é obrigatória')
            self.profession = profession.strip()
        if phone is not None:
            self.phone = phone
        if address is not None:
            self.address = address
        if cep is not None:
            self.cep = cep
        if rua is not None:
            self.rua = rua
        if numero is not None:
            self.numero = numero
        if complemento is not None:
            self.complemento = complemento
        if bairro is not None:
            self.bairro = bairro
        if cidade is not None:
            self.cidade = cidade
        if estado is not None:
            self.estado = estado
        if bio is not None:
            self.bio = bio
        if link is not None:
            self.link = self._normalize_link(link)

    # --- Email confirmation ---
    def generate_email_confirmation_token(self):
        """Issue a new e-mail confirmation token, valid for 24h."""
        self.email_confirmation_token = secrets.token_urlsafe(32)
        self.email_confirmation_expires_at = datetime.utcnow() + self._EMAIL_CONFIRMATION_TTL
        return self.email_confirmation_token

    def confirm_email(self, token):
        """Confirm the user's e-mail using a previously issued token."""
        if not self.email_confirmation_token or token != self.email_confirmation_token:
            raise InvalidTokenError('Token de confirmação inválido')
        if self.email_confirmation_expires_at and datetime.utcnow() > self.email_confirmation_expires_at:
            raise InvalidTokenError('Token de confirmação expirado')
        self.email_confirmed = True
        self.email_confirmation_token = None
        self.email_confirmation_expires_at = None

    # --- Password recovery ---
    def generate_password_reset_token(self):
        """Issue a new password reset token, valid for 1h."""
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires_at = datetime.utcnow() + self._PASSWORD_RESET_TTL
        return self.password_reset_token

    def reset_password(self, token, new_password_hash):
        """Reset the password using a previously issued token."""
        if not self.password_reset_token or token != self.password_reset_token:
            raise InvalidTokenError('Token de redefinição inválido')
        if self.password_reset_expires_at and datetime.utcnow() > self.password_reset_expires_at:
            raise InvalidTokenError('Token de redefinição expirado')
        self.password_hash = new_password_hash
        self.password_reset_token = None
        self.password_reset_expires_at = None

    def change_password(self, new_password_hash):
        """Change the password directly (user already authenticated)."""
        self.password_hash = new_password_hash

    # --- Account deletion (soft delete, preserves records for audit) ---
    def mark_deleted(self):
        if self.deleted_at is not None:
            raise InvalidStateTransition('Conta já foi excluída')
        self.deleted_at = datetime.utcnow()

    @property
    def is_deleted(self):
        return getattr(self, 'deleted_at', None) is not None

    @staticmethod
    def _normalize_link(link):
        link = (link or '').strip().lower().replace(' ', '-')
        if link and not _LINK_RE.match(link):
            raise ValidationError('Link público deve conter apenas letras minúsculas, números e hífens')
        return link

    @property
    def is_provider(self):
        return UserRole.from_value(self.role) == UserRole.PROVIDER

    @property
    def is_client(self):
        return UserRole.from_value(self.role) == UserRole.CLIENT

    @property
    def role_label(self):
        return UserRole.from_value(self.role).label

    @property
    def public_url(self):
        return f'profissional-os.com/{self.link}' if self.link else ''

    def to_dict(self):
        return {
            'id': getattr(self, 'id', None),
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'roleLabel': self.role_label,
            'isProvider': self.is_provider,
            'isClient': self.is_client,
            'profession': getattr(self, 'profession', ''),
            'phone': getattr(self, 'phone', ''),
            'address': getattr(self, 'address', ''),
            'cep': getattr(self, 'cep', ''),
            'rua': getattr(self, 'rua', ''),
            'numero': getattr(self, 'numero', ''),
            'complemento': getattr(self, 'complemento', ''),
            'bairro': getattr(self, 'bairro', ''),
            'cidade': getattr(self, 'cidade', ''),
            'estado': getattr(self, 'estado', ''),
            'bio': getattr(self, 'bio', ''),
            'link': getattr(self, 'link', ''),
            'publicUrl': self.public_url,
            'emailConfirmed': getattr(self, 'email_confirmed', False),
            'createdAt': self.created_at.isoformat() if getattr(self, 'created_at', None) else None
        }


class Client(FirestoreModel):
    collection = 'clients'
    """Client. Owns its contact-data invariants."""
    @classmethod
    def create(cls, user_id, name, email='', phone='', address='', notes='',
               cep='', rua='', numero='', complemento='', bairro='', cidade='', estado=''):
        """Factory enforcing a valid client."""
        if not name or not name.strip():
            raise ValidationError('Nome é obrigatório')
        email_vo = Email(email)  # validates format if provided
        return cls(
            user_id=user_id,
            name=name.strip(),
            email=str(email_vo),
            phone=phone or '',
            address=address or '',
            cep=cep or '',
            rua=rua or '',
            numero=numero or '',
            complemento=complemento or '',
            bairro=bairro or '',
            cidade=cidade or '',
            estado=estado or '',
            notes=notes or '',
        )

    def update_contact(self, name=None, email=None, phone=None, address=None, notes=None,
                        cep=None, rua=None, numero=None, complemento=None,
                        bairro=None, cidade=None, estado=None):
        """Update contact info while protecting invariants."""
        if name is not None:
            if not name.strip():
                raise ValidationError('Nome é obrigatório')
            self.name = name.strip()
        if email is not None:
            self.email = str(Email(email))
        if phone is not None:
            self.phone = phone
        if address is not None:
            self.address = address
        if cep is not None:
            self.cep = cep
        if rua is not None:
            self.rua = rua
        if numero is not None:
            self.numero = numero
        if complemento is not None:
            self.complemento = complemento
        if bairro is not None:
            self.bairro = bairro
        if cidade is not None:
            self.cidade = cidade
        if estado is not None:
            self.estado = estado
        if notes is not None:
            self.notes = notes

    @property
    def has_contact_channel(self):
        return bool(self.email or self.phone)

    def to_dict(self):
        return {
            'id': getattr(self, 'id', None),
            'userId': getattr(self, 'user_id', None),
            'name': self.name,
            'email': getattr(self, 'email', ''),
            'phone': getattr(self, 'phone', ''),
            'address': getattr(self, 'address', ''),
            'cep': getattr(self, 'cep', ''),
            'rua': getattr(self, 'rua', ''),
            'numero': getattr(self, 'numero', ''),
            'complemento': getattr(self, 'complemento', ''),
            'bairro': getattr(self, 'bairro', ''),
            'cidade': getattr(self, 'cidade', ''),
            'estado': getattr(self, 'estado', ''),
            'notes': getattr(self, 'notes', ''),
            'hasContactChannel': self.has_contact_channel,
            'createdAt': self.created_at.isoformat() if getattr(self, 'created_at', None) else None
        }


class Service(FirestoreModel):
    collection = 'services'
    """Service offered by the professional. Owns pricing/duration invariants."""
    @classmethod
    def create(cls, user_id, name, price, duration,
               description='', home_attendance=False):
        """Factory enforcing a sellable service (valid price and duration)."""
        if not name or not name.strip():
            raise ValidationError('Nome do serviço é obrigatório')
        money = Money(price)          # validates numeric & non-negative
        dur = Duration(duration)      # validates positive integer
        return cls(
            user_id=user_id,
            name=name.strip(),
            description=description or '',
            price=money.to_float(),
            duration=dur.to_int(),
            home_attendance=bool(home_attendance),
        )

    def rename(self, name):
        if not name or not name.strip():
            raise ValidationError('Nome do serviço é obrigatório')
        self.name = name.strip()

    def change_price(self, price):
        self.price = Money(price).to_float()

    def change_duration(self, duration):
        self.duration = Duration(duration).to_int()

    def describe(self, description):
        self.description = description or ''

    def set_home_attendance(self, enabled):
        self.home_attendance = bool(enabled)

    @property
    def price_money(self):
        return Money(self.price)

    @property
    def duration_vo(self):
        return Duration(self.duration)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'priceFormatted': self.price_money.formatted(),
            'duration': self.duration,
            'durationFormatted': self.duration_vo.formatted(),
            'homeAttendance': self.home_attendance,
            'createdAt': self.created_at.isoformat()
        }


class Appointment(FirestoreModel):
    collection = 'appointments'
    """Appointment aggregate. Owns its scheduling invariants and lifecycle.

    The lifecycle (scheduled -> confirmed -> completed / cancelled) is enforced
    by intention-revealing methods instead of letting callers set `status`.
    """
    _DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    _TIME_RE = re.compile(r'^\d{2}:\d{2}$')

    @classmethod
    def create(cls, user_id, client_id, service_id, date, time,
               home_attendance=False, notes='', status=None):
        """Factory enforcing a valid, schedulable appointment."""
        errors = []
        if not client_id:
            errors.append('Cliente é obrigatório')
        if not service_id:
            errors.append('Serviço é obrigatório')
        if not date:
            errors.append('Data é obrigatória')
        elif not cls._DATE_RE.match(str(date)):
            errors.append('Data deve estar no formato AAAA-MM-DD')
        if not time:
            errors.append('Hora é obrigatória')
        elif not cls._TIME_RE.match(str(time)):
            errors.append('Hora deve estar no formato HH:MM')
        if errors:
            raise ValidationError('Dados de agendamento inválidos', errors)

        initial = AppointmentStatus.from_value(status) if status else AppointmentStatus.SCHEDULED
        return cls(
            user_id=user_id,
            client_id=client_id,
            service_id=service_id,
            date=date,
            time=time,
            home_attendance=bool(home_attendance),
            status=initial.value,
            notes=notes or '',
        )

    # --- Lifecycle (state machine) ---
    @property
    def current_status(self):
        return AppointmentStatus.from_value(self.status)

    def _transition_to(self, target):
        current = self.current_status
        if not current.can_transition_to(target):
            raise InvalidStateTransition(
                f'Não é possível mudar de "{current.label}" para "{target.label}"'
            )
        self.status = target.value

    def confirm(self):
        self._transition_to(AppointmentStatus.CONFIRMED)

    def complete(self):
        self._transition_to(AppointmentStatus.COMPLETED)

    def cancel(self):
        self._transition_to(AppointmentStatus.CANCELLED)

    def reschedule(self, date=None, time=None):
        """Move the appointment. Not allowed once it is in a terminal state."""
        if self.current_status.is_terminal:
            raise InvalidStateTransition('Agendamento finalizado não pode ser remarcado')
        if date is not None:
            if not self._DATE_RE.match(str(date)):
                raise ValidationError('Data deve estar no formato AAAA-MM-DD')
            self.date = date
        if time is not None:
            if not self._TIME_RE.match(str(time)):
                raise ValidationError('Hora deve estar no formato HH:MM')
            self.time = time

    def change_participants(self, client_id=None, service_id=None):
        if self.current_status.is_terminal:
            raise InvalidStateTransition('Agendamento finalizado não pode ser alterado')
        if client_id is not None:
            self.client_id = client_id
        if service_id is not None:
            self.service_id = service_id

    def set_home_attendance(self, enabled):
        self.home_attendance = bool(enabled)

    def annotate(self, notes):
        self.notes = notes or ''

    @property
    def is_today(self):
        return str(self.date) == date.today().isoformat()

    @property
    def is_upcoming(self):
        return str(self.date) >= date.today().isoformat() and not self.current_status.is_terminal

    def available_actions(self):
        """Which lifecycle actions are valid right now (drives the UI)."""
        status = self.current_status
        return {
            'canConfirm': status.can_transition_to(AppointmentStatus.CONFIRMED),
            'canComplete': status.can_transition_to(AppointmentStatus.COMPLETED),
            'canCancel': status.can_transition_to(AppointmentStatus.CANCELLED),
            'canReschedule': not status.is_terminal,
        }

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'serviceId': self.service_id,
            'date': str(self.date),
            'time': self.time,
            'homeAttendance': self.home_attendance,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'isToday': self.is_today,
            'isUpcoming': self.is_upcoming,
            'actions': self.available_actions(),
            'notes': self.notes,
            'createdAt': self.created_at.isoformat()
        }


class Transaction(FirestoreModel):
    collection = 'transactions'
    """Financial transaction. Owns money/type/payment invariants."""
    @classmethod
    def create(cls, user_id, type, description, amount, date,
               category='', status=None):
        """Factory enforcing a valid transaction (positive amount, valid type)."""
        if not description or not description.strip():
            raise ValidationError('Descrição é obrigatória')
        tx_type = TransactionType.from_value(type)
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor deve ser maior que zero')
        if not date:
            raise ValidationError('Data é obrigatória')
        tx_status = TransactionStatus.from_value(status) if status else TransactionStatus.PENDING
        return cls(
            user_id=user_id,
            type=tx_type.value,
            description=description.strip(),
            amount=money.to_float(),
            date=date,
            category=category or '',
            status=tx_status.value,
        )

    @classmethod
    def income_from_service(cls, user_id, service, client_name, on_date, paid=False):
        """Create an income transaction derived from a rendered service.

        Encapsulates the rule: an appointment's completion generates revenue.
        """
        return cls.create(
            user_id=user_id,
            type=TransactionType.INCOME.value,
            description=f'{service.name} - {client_name}',
            amount=service.price,
            date=on_date,
            category='service',
            status=TransactionStatus.PAID.value if paid else TransactionStatus.PENDING.value,
        )

    def mark_as_paid(self):
        if self.current_status == TransactionStatus.PAID:
            raise InvalidStateTransition('Transação já está paga')
        self.status = TransactionStatus.PAID.value

    def mark_as_pending(self):
        self.status = TransactionStatus.PENDING.value

    def change_amount(self, amount):
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor deve ser maior que zero')
        self.amount = money.to_float()

    def redescribe(self, description):
        if not description or not description.strip():
            raise ValidationError('Descrição é obrigatória')
        self.description = description.strip()

    def recategorize(self, category):
        self.category = category or ''

    def change_type(self, type):
        self.type = TransactionType.from_value(type).value

    def change_date(self, date):
        if not date:
            raise ValidationError('Data é obrigatória')
        self.date = date

    @property
    def current_status(self):
        return TransactionStatus.from_value(self.status)

    @property
    def transaction_type(self):
        return TransactionType.from_value(self.type)

    @property
    def is_income(self):
        return self.transaction_type == TransactionType.INCOME

    @property
    def is_paid(self):
        return self.current_status == TransactionStatus.PAID

    @property
    def amount_money(self):
        return Money(self.amount)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'type': self.type,
            'typeLabel': self.transaction_type.label,
            'description': self.description,
            'amount': self.amount,
            'amountFormatted': self.amount_money.formatted(),
            'date': self.date,
            'category': self.category,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'isIncome': self.is_income,
            'isPaid': self.is_paid,
            'createdAt': self.created_at.isoformat()
        }



class Work(FirestoreModel):
    collection = 'works'
    """A work (trabalho) offered by a provider for sale.

    The provider defines custom fields that clients must fill when ordering.
    Owns pricing and field-definition invariants.
    """
    @classmethod
    def create(cls, provider_id, title, price, description='', category='', custom_fields=None):
        """Factory enforcing a valid, sellable work."""
        errors = []
        if not title or not title.strip():
            errors.append('Título é obrigatório')
        money = Money(price)
        if money.is_zero():
            errors.append('Preço deve ser maior que zero')
        if errors:
            raise ValidationError('Dados do trabalho inválidos', errors)

        fields = cls._validate_custom_fields(custom_fields or [])

        return cls(
            provider_id=provider_id,
            title=title.strip(),
            description=description or '',
            price=money.to_float(),
            category=category or '',
            custom_fields_json=json.dumps(fields),
            active=True,
        )

    @staticmethod
    def _validate_custom_fields(fields):
        """Validate and normalize custom field definitions."""
        if not isinstance(fields, list):
            raise ValidationError('Campos personalizados devem ser uma lista')
        valid_types = {'text', 'textarea', 'number', 'date', 'select'}
        seen_names = set()
        normalized = []
        for f in fields:
            if not isinstance(f, dict):
                continue
            name = (f.get('name') or '').strip()
            label = (f.get('label') or '').strip()
            ftype = (f.get('type') or 'text').strip()
            if not name or not label:
                continue
            if ftype not in valid_types:
                ftype = 'text'
            if name in seen_names:
                continue
            seen_names.add(name)
            normalized.append({
                'name': name,
                'label': label,
                'type': ftype,
                'required': bool(f.get('required', False)),
                'options': f.get('options', []) if ftype == 'select' else [],
            })
        return normalized

    def update(self, title=None, description=None, price=None, category=None, custom_fields=None, active=None):
        """Update mutable fields while protecting invariants."""
        if title is not None:
            if not title.strip():
                raise ValidationError('Título é obrigatório')
            self.title = title.strip()
        if description is not None:
            self.description = description or ''
        if price is not None:
            money = Money(price)
            if money.is_zero():
                raise ValidationError('Preço deve ser maior que zero')
            self.price = money.to_float()
        if category is not None:
            self.category = category or ''
        if custom_fields is not None:
            self.custom_fields_json = json.dumps(self._validate_custom_fields(custom_fields))
        if active is not None:
            self.active = bool(active)

    @property
    def custom_fields(self):
        return json.loads(self.custom_fields_json or '[]')

    @property
    def price_money(self):
        return Money(self.price)

    def to_dict(self, include_provider=False):
        d = {
            'id': self.id,
            'providerId': self.provider_id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'priceFormatted': self.price_money.formatted(),
            'category': self.category,
            'customFields': self.custom_fields,
            'active': self.active,
            'createdAt': self.created_at.isoformat(),
        }
        if include_provider and getattr(self, 'provider', None):
            d['provider'] = {
                'id': self.provider.id,
                'name': self.provider.name,
                'profession': self.provider.profession,
            }
        return d


class WorkOrder(FirestoreModel):
    collection = 'work_orders'
    """An order placed by a client user for a provider's work.

    Stores the filled custom fields and has its own lifecycle
    (pending -> accepted -> completed / rejected / cancelled).
    """
    @classmethod
    def create(cls, work, client_user_id, field_data, notes=''):
        """Factory enforcing a valid order with required fields filled."""
        errors = []
        custom_fields = work.custom_fields
        for f in custom_fields:
            if f['required']:
                val = (field_data or {}).get(f['name'], '')
                if not str(val).strip():
                    errors.append(f'Campo "{f["label"]}" é obrigatório')
        if errors:
            raise ValidationError('Dados do pedido inválidos', errors)

        return cls(
            work_id=work.id,
            client_user_id=client_user_id,
            provider_id=work.provider_id,
            field_data_json=json.dumps(field_data or {}),
            status=WorkOrderStatus.PENDING.value,
            notes=notes or '',
        )

    @property
    def current_status(self):
        return WorkOrderStatus.from_value(self.status)

    @property
    def field_data(self):
        return json.loads(self.field_data_json or '{}')

    def _transition_to(self, target):
        current = self.current_status
        if not current.can_transition_to(target):
            raise InvalidStateTransition(
                f'Não é possível mudar de "{current.label}" para "{target.label}"'
            )
        self.status = target.value

    def accept(self):
        self._transition_to(WorkOrderStatus.ACCEPTED)

    def reject(self):
        self._transition_to(WorkOrderStatus.REJECTED)

    def complete(self):
        self._transition_to(WorkOrderStatus.COMPLETED)

    def cancel(self):
        self._transition_to(WorkOrderStatus.CANCELLED)

    def available_actions(self):
        status = self.current_status
        return {
            'canAccept': status.can_transition_to(WorkOrderStatus.ACCEPTED),
            'canReject': status.can_transition_to(WorkOrderStatus.REJECTED),
            'canComplete': status.can_transition_to(WorkOrderStatus.COMPLETED),
            'canCancel': status.can_transition_to(WorkOrderStatus.CANCELLED),
        }

    def to_dict(self, include_work=False, include_client=False):
        d = {
            'id': self.id,
            'workId': self.work_id,
            'clientUserId': self.client_user_id,
            'providerId': self.provider_id,
            'fieldData': self.field_data,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'actions': self.available_actions(),
            'notes': self.notes,
            'createdAt': self.created_at.isoformat(),
        }
        if include_work and getattr(self, 'work', None):
            d['work'] = self.work.to_dict(include_provider=True)
        if include_client and getattr(self, 'client_user', None):
            d['client'] = {
                'id': self.client_user.id,
                'name': self.client_user.name,
                'email': self.client_user.email,
                'phone': self.client_user.phone,
            }
        return d


# ===========================================================================
# Phase 2 — Payments, Wallet, Packages, Gift Cards, Loyalty
# ===========================================================================

class Payment(FirestoreModel):
    collection = 'payments'
    """Payment through a gateway. Owns its lifecycle state machine.

    Never stores full card data — only gateway tokens and metadata.
    Supports split (platform fee + provider), installments, refunds, disputes.
    """


    # Split
    # Installments
    # Refunds
    # Coupon
    @classmethod
    def create(cls, user_id, amount, method, description,
               idempotency_key=None, coupon_code=None, metadata=None):
        """Factory enforcing a valid payment."""
        errors = []
        if not description or not description.strip():
            errors.append('Descrição é obrigatória')
        money = Money(amount)
        if money.is_zero():
            errors.append('Valor deve ser maior que zero')
        if errors:
            raise ValidationError('Dados de pagamento inválidos', errors)

        method_enum = PaymentMethod.from_value(method)

        return cls(
            user_id=user_id,
            amount=money.to_float(),
            method=method_enum.value,
            description=description.strip(),
            status=PaymentStatus.PENDING.value,
            idempotency_key=idempotency_key or secrets.token_urlsafe(16),
            coupon_code=coupon_code,
            metadata_json=json.dumps(metadata or {}),
            installments=1,
            installment_amount=0.0,
            refunded_amount=0.0,
            platform_fee=0.0,
            provider_amount=0.0,
            discount_amount=0.0,
        )

    @property
    def current_status(self):
        return PaymentStatus.from_value(self.status)

    def _transition_to(self, target):
        current = self.current_status
        if not current.can_transition_to(target):
            raise InvalidStateTransition(
                f'Não é possível mudar de "{current.label}" para "{target.label}"'
            )
        self.status = target.value
        self.updated_at = datetime.utcnow()

    def authorize(self):
        self._transition_to(PaymentStatus.AUTHORIZED)

    def start_processing(self):
        self._transition_to(PaymentStatus.PROCESSING)

    def mark_paid(self):
        self._transition_to(PaymentStatus.PAID)

    def fail(self):
        self._transition_to(PaymentStatus.FAILED)

    def cancel(self):
        self._transition_to(PaymentStatus.CANCELLED)

    def partial_refund(self, amount):
        if self.current_status != PaymentStatus.PAID:
            raise InvalidStateTransition('Apenas pagamentos pagos podem ser estornados')
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor do estorno deve ser maior que zero')
        if self.refunded_amount + money.to_float() > self.amount:
            raise PaymentError('Valor do estorno excede o valor do pagamento')
        self.refunded_amount += money.to_float()
        self._transition_to(PaymentStatus.PARTIALLY_REFUNDED)

    def full_refund(self):
        if self.current_status != PaymentStatus.PAID:
            raise InvalidStateTransition('Apenas pagamentos pagos podem ser estornados')
        self.refunded_amount = self.amount
        self._transition_to(PaymentStatus.FULLY_REFUNDED)

    def dispute(self):
        self._transition_to(PaymentStatus.DISPUTED)

    def set_split(self, platform_fee, provider_amount):
        money_fee = Money(platform_fee)
        money_provider = Money(provider_amount)
        if money_fee.to_float() + money_provider.to_float() != self.amount:
            raise PaymentError('Soma de split deve igualar o valor do pagamento')
        self.platform_fee = money_fee.to_float()
        self.provider_amount = money_provider.to_float()

    def set_installments(self, count):
        if self.method != PaymentMethod.CREDIT_CARD.value:
            raise PaymentError('Parcelamento disponível apenas para cartão de crédito')
        if count < 1:
            raise ValidationError('Número de parcelas deve ser maior que zero')
        self.installments = count
        self.installment_amount = round(self.amount / count, 2)

    @property
    def extra_metadata(self):
        return json.loads(self.metadata_json or '{}')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'amount': self.amount,
            'method': self.method,
            'methodLabel': PaymentMethod.from_value(self.method).label,
            'description': self.description,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'idempotencyKey': self.idempotency_key,
            'gatewayToken': self.gateway_token,
            'gatewayTransactionId': self.gateway_transaction_id,
            'platformFee': self.platform_fee,
            'providerAmount': self.provider_amount,
            'installments': self.installments,
            'installmentAmount': self.installment_amount,
            'refundedAmount': self.refunded_amount,
            'couponCode': self.coupon_code,
            'discountAmount': self.discount_amount,
            'metadataJson': self.metadata_json,
            'metadata': self.extra_metadata,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class Wallet(FirestoreModel):
    collection = 'wallets'
    """Digital wallet. Owns balance invariant and immutable ledger.

    Every credit/debit generates a LedgerEntry that is never modified or
    deleted — the ledger is append-only.
    """
    @classmethod
    def create(cls, user_id):
        return cls(user_id=user_id, balance=0.0, ledger_entries=[])

    @property
    def balance_money(self):
        return Money(self.balance)

    def credit(self, amount, entry_type, description, reference_type=None,
               reference_id=None, metadata=None):
        """Credit the wallet and record an immutable ledger entry."""
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor deve ser maior que zero')
        type_enum = LedgerEntryType.from_value(entry_type) if isinstance(entry_type, str) else entry_type
        self.balance = round(self.balance + money.to_float(), 2)
        entry = LedgerEntry(
            wallet_id=self.id,
            type=type_enum.value,
            amount=money.to_float(),
            description=description,
            balance_after=self.balance,
            reference_type=reference_type,
            reference_id=reference_id,
            metadata_json=json.dumps(metadata or {}),
        )
        self.ledger_entries.append(entry)
        return entry

    def debit(self, amount, entry_type, description, reference_type=None,
              reference_id=None, metadata=None):
        """Debit the wallet and record an immutable ledger entry."""
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor deve ser maior que zero')
        if money.to_float() > self.balance:
            raise WalletError('Saldo insuficiente')
        type_enum = LedgerEntryType.from_value(entry_type) if isinstance(entry_type, str) else entry_type
        self.balance = round(self.balance - money.to_float(), 2)
        entry = LedgerEntry(
            wallet_id=self.id,
            type=type_enum.value,
            amount=money.to_float(),
            description=description,
            balance_after=self.balance,
            reference_type=reference_type,
            reference_id=reference_id,
            metadata_json=json.dumps(metadata or {}),
        )
        self.ledger_entries.append(entry)
        return entry

    def withdraw(self, amount):
        """Withdraw funds to an external bank account."""
        return self.debit(amount, LedgerEntryType.WITHDRAWAL, 'Saque')

    def transfer_to(self, receiver_wallet, amount):
        """Internal transfer between two wallets."""
        if self.user_id == receiver_wallet.user_id:
            raise WalletError('Não é possível transferir para a mesma carteira')
        debit_entry = self.debit(
            amount, LedgerEntryType.TRANSFER_OUT,
            f'Transferência para usuário {receiver_wallet.user_id}',
            reference_type='wallet', reference_id=str(receiver_wallet.id),
        )
        receiver_wallet.credit(
            amount, LedgerEntryType.TRANSFER_IN,
            f'Transferência do usuário {self.user_id}',
            reference_type='wallet', reference_id=str(self.id),
        )
        return debit_entry

    def get_statement(self):
        """Return the full ledger as a list of dicts."""
        return [e.to_dict() for e in self.ledger_entries]

    def to_dict(self, include_statement=False):
        d = {
            'id': self.id,
            'userId': self.user_id,
            'balance': self.balance,
            'balanceFormatted': self.balance_money.formatted(),
            'ledgerEntries': [e.to_dict() for e in self.ledger_entries],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
        if include_statement:
            d['statement'] = self.get_statement()
        return d

    @classmethod
    def from_dict(cls, data):
        """Override to deserialize ledger_entries dicts to LedgerEntry objects."""
        skip_names = set()
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name, None)
            if isinstance(attr, property) and not attr.fset:
                skip_names.add(attr_name)
            elif callable(attr) and not isinstance(attr, type):
                skip_names.add(attr_name)

        converted = {}
        for key, value in (data or {}).items():
            snake_key = cls._camel_to_snake(key)
            if snake_key in skip_names:
                continue
            if snake_key == 'ledger_entries' and isinstance(value, list):
                converted[snake_key] = [
                    LedgerEntry.from_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
                continue
            if isinstance(value, str) and (snake_key.endswith('_at') or snake_key == 'created_at'):
                try:
                    converted[snake_key] = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            else:
                converted[snake_key] = value
        return cls(**converted)


class LedgerEntry(FirestoreModel):
    collection = 'ledger_entrys'
    """Immutable ledger entry. Append-only — never updated or deleted.

    Records: type, amount, balance_after, description, reference, metadata.
    """
    @property
    def entry_type(self):
        return LedgerEntryType.from_value(self.type)

    @property
    def is_credit(self):
        return self.entry_type.is_credit

    @property
    def extra_metadata(self):
        return json.loads(self.metadata_json or '{}')

    def to_dict(self):
        return {
            'id': self.id,
            'walletId': self.wallet_id,
            'type': self.type,
            'typeLabel': self.entry_type.label,
            'amount': self.amount,
            'description': self.description,
            'balanceAfter': self.balance_after,
            'isCredit': self.is_credit,
            'referenceType': self.reference_type,
            'referenceId': self.reference_id,
            'metadataJson': self.metadata_json,
            'metadata': self.extra_metadata,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Package(FirestoreModel):
    collection = 'packages'
    """Session package. Owns session-count and validity invariants.

    Created with N sessions, a price (with optional discount), and a validity
    period. Each use decrements remaining_sessions. When exhausted or expired,
    no further usage is allowed.
    """
    @classmethod
    def create(cls, user_id, client_id, name, total_sessions, price,
               validity_days, session_price=None):
        errors = []
        if not name or not name.strip():
            errors.append('Nome do pacote é obrigatório')
        if total_sessions is None or total_sessions <= 0:
            errors.append('Número de sessões deve ser maior que zero')
        money = Money(price)
        if money.is_zero():
            errors.append('Preço deve ser maior que zero')
        if validity_days is None or validity_days <= 0:
            errors.append('Validade deve ser maior que zero dias')
        if errors:
            raise ValidationError('Dados do pacote inválidos', errors)

        return cls(
            user_id=user_id,
            client_id=client_id,
            name=name.strip(),
            total_sessions=total_sessions,
            remaining_sessions=total_sessions,
            price=money.to_float(),
            session_price=Money(session_price).to_float() if session_price else None,
            validity_days=validity_days,
            expires_at=datetime.utcnow() + timedelta(days=validity_days),
            status=PackageStatus.ACTIVE.value,
        )

    @property
    def current_status(self):
        return PackageStatus.from_value(self.status)

    def _ensure_active(self):
        self.check_expiry()
        if self.current_status != PackageStatus.ACTIVE:
            raise PackageError(f'Pacote não está ativo (status: {self.current_status.label})')

    def use_session(self):
        self._ensure_active()
        self.remaining_sessions -= 1
        if self.remaining_sessions == 0:
            self.status = PackageStatus.EXHAUSTED.value

    def check_expiry(self):
        if self.current_status == PackageStatus.ACTIVE and datetime.utcnow() > self.expires_at:
            self.status = PackageStatus.EXPIRED.value

    def cancel(self):
        if self.current_status.is_terminal:
            raise PackageError('Pacote finalizado não pode ser cancelado')
        self.status = PackageStatus.CANCELLED.value

    @property
    def discount_percentage(self):
        if self.session_price and self.session_price > 0:
            full_price = self.total_sessions * self.session_price
            if full_price > 0:
                return round((1 - self.price / full_price) * 100, 2)
        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'name': self.name,
            'totalSessions': self.total_sessions,
            'remainingSessions': self.remaining_sessions,
            'price': self.price,
            'sessionPrice': self.session_price,
            'validityDays': self.validity_days,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'discountPercentage': self.discount_percentage,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class GiftCard(FirestoreModel):
    collection = 'gift_cards'
    """Gift card with secure code, validity, and fraud prevention.

    Created with a value and recipient. Redeemed once by a different user.
    Can be blocked to prevent fraud. Checks expiry automatically.
    """
    _DEFAULT_VALIDITY_DAYS = 365

    @classmethod
    def create(cls, user_id, amount, purchaser_id, recipient_email,
               validity_days=None):
        errors = []
        money = Money(amount)
        if money.is_zero():
            errors.append('Valor deve ser maior que zero')
        if not recipient_email or not recipient_email.strip():
            errors.append('E-mail do destinatário é obrigatório')
        if errors:
            raise ValidationError('Dados do gift card inválidos', errors)

        days = validity_days or cls._DEFAULT_VALIDITY_DAYS
        return cls(
            user_id=user_id,
            purchaser_id=purchaser_id,
            recipient_email=recipient_email.strip(),
            code=secrets.token_urlsafe(12).upper().replace('-', ''),
            amount=money.to_float(),
            balance=money.to_float(),
            status=GiftCardStatus.ACTIVE.value,
            expires_at=datetime.utcnow() + timedelta(days=days),
            redeemed_by=None,
            redeemed_at=None,
        )

    @property
    def current_status(self):
        return GiftCardStatus.from_value(self.status)

    def _ensure_redeemable(self):
        self.check_expiry()
        if self.current_status != GiftCardStatus.ACTIVE:
            raise GiftCardError(f'Gift card não pode ser resgatado (status: {self.current_status.label})')

    def redeem(self, redeemed_by_email):
        self._ensure_redeemable()
        self.status = GiftCardStatus.REDEEMED.value
        self.redeemed_by = redeemed_by_email
        self.redeemed_at = datetime.utcnow()
        self.balance = 0.0

    def block(self):
        if self.current_status == GiftCardStatus.REDEEMED:
            raise GiftCardError('Gift card já resgatado não pode ser bloqueado')
        if self.current_status.is_terminal:
            raise GiftCardError('Gift card finalizado não pode ser bloqueado')
        self.status = GiftCardStatus.BLOCKED.value

    def check_expiry(self):
        if self.current_status == GiftCardStatus.ACTIVE and datetime.utcnow() > self.expires_at:
            self.status = GiftCardStatus.EXPIRED.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'purchaserId': self.purchaser_id,
            'recipientEmail': self.recipient_email,
            'code': self.code,
            'amount': self.amount,
            'balance': self.balance,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'redeemedBy': self.redeemed_by,
            'redeemedAt': self.redeemed_at.isoformat() if self.redeemed_at else None,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class LoyaltyAccount(FirestoreModel):
    collection = 'loyalty_accounts'
    """Loyalty account tracking points, XP, levels, medals, and missions.

    Points are spendable currency. XP accumulates and triggers level-ups.
    Medals are awarded once. Missions are tracked separately.
    """
    _LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

    @classmethod
    def create(cls, user_id, provider_id):
        return cls(user_id=user_id, provider_id=provider_id, points=0, xp=0, level=1,
                   earned_medals=[], transactions=[])

    def _check_level_up(self):
        for i in range(len(self._LEVEL_THRESHOLDS) - 1, -1, -1):
            if self.xp >= self._LEVEL_THRESHOLDS[i]:
                if self.level < i + 1:
                    old_level = self.level
                    self.level = i + 1
                    self._record_transaction(
                        LoyaltyTransactionType.LEVEL_UP,
                        self.level - old_level,
                        f'Subiu para o nível {self.level}',
                    )
                break

    def _record_transaction(self, tx_type, amount, description, reference_type=None, reference_id=None):
        tx = LoyaltyTransaction(
            account_id=self.id,
            type=tx_type.value if isinstance(tx_type, LoyaltyTransactionType) else tx_type,
            amount=amount,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        self.transactions.append(tx)
        return tx

    def earn_points(self, amount, reason, reference_type=None, reference_id=None):
        if amount <= 0:
            raise ValidationError('Pontos devem ser maiores que zero')
        self.points += amount
        return self._record_transaction(
            LoyaltyTransactionType.POINTS_EARNED, amount,
            f'Pontos ganhos: {reason}', reference_type, reference_id)

    def spend_points(self, amount, reason, reference_type=None, reference_id=None):
        if amount <= 0:
            raise ValidationError('Pontos devem ser maiores que zero')
        if amount > self.points:
            raise LoyaltyError('Pontos insuficientes')
        self.points -= amount
        return self._record_transaction(
            LoyaltyTransactionType.POINTS_SPENT, amount,
            f'Pontos gastos: {reason}', reference_type, reference_id)

    def earn_xp(self, amount, reason, reference_type=None, reference_id=None):
        if amount <= 0:
            raise ValidationError('XP deve ser maior que zero')
        self.xp += amount
        tx = self._record_transaction(
            LoyaltyTransactionType.XP_EARNED, amount,
            f'XP ganho: {reason}', reference_type, reference_id)
        self._check_level_up()
        return tx

    def xp_for_next_level(self):
        if self.level >= len(self._LEVEL_THRESHOLDS):
            return self._LEVEL_THRESHOLDS[-1]
        return self._LEVEL_THRESHOLDS[self.level]

    def calculate_cashback(self, amount, rate=0.05, cap=None):
        cashback = round(amount * rate, 2)
        if cap is not None:
            cashback = min(cashback, cap)
        return cashback

    def award_medal(self, medal):
        if medal not in self.earned_medals:
            self.earned_medals.append(medal)
            self._record_transaction(
                LoyaltyTransactionType.MEDAL_EARNED, 1,
                f'Medalha conquistada: {medal.title}',
                reference_type='medal', reference_id=str(medal.id))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'providerId': self.provider_id,
            'points': self.points,
            'xp': self.xp,
            'level': self.level,
            'xpForNextLevel': self.xp_for_next_level(),
            'earnedMedals': [m.to_dict() for m in self.earned_medals],
            'medals': [m.to_dict() for m in self.earned_medals],
            'transactions': [t.to_dict() for t in self.transactions],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data):
        """Override to deserialize earned_medals and transactions lists."""
        skip_names = set()
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name, None)
            if isinstance(attr, property) and not attr.fset:
                skip_names.add(attr_name)
            elif callable(attr) and not isinstance(attr, type):
                skip_names.add(attr_name)

        converted = {}
        for key, value in (data or {}).items():
            snake_key = cls._camel_to_snake(key)
            if snake_key in skip_names:
                continue
            if snake_key == 'earned_medals' and isinstance(value, list):
                converted[snake_key] = [
                    Medal.from_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
                continue
            if snake_key == 'transactions' and isinstance(value, list):
                converted[snake_key] = [
                    LoyaltyTransaction.from_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
                continue
            if isinstance(value, str) and (snake_key.endswith('_at') or snake_key == 'created_at'):
                try:
                    converted[snake_key] = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            else:
                converted[snake_key] = value
        return cls(**converted)


class LoyaltyTransaction(FirestoreModel):
    collection = 'loyalty_transactions'
    """Immutable loyalty transaction (points, XP, medals, levels)."""
    @property
    def tx_type(self):
        return LoyaltyTransactionType.from_value(self.type)

    def to_dict(self):
        return {
            'id': self.id,
            'accountId': self.account_id,
            'type': self.type,
            'typeLabel': self.tx_type.label,
            'amount': self.amount,
            'description': self.description,
            'referenceType': self.reference_type,
            'referenceId': self.reference_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Mission(FirestoreModel):
    collection = 'missions'
    """Loyalty mission with configurable rewards, defined by the provider."""
    @classmethod
    def create(cls, provider_id, title, description, xp_reward, points_reward, target_count):
        errors = []
        if not title or not title.strip():
            errors.append('Título da missão é obrigatório')
        if target_count is None or target_count <= 0:
            errors.append('Meta deve ser maior que zero')
        if errors:
            raise ValidationError('Dados da missão inválidos', errors)
        return cls(
            provider_id=provider_id,
            title=title.strip(),
            description=description or '',
            xp_reward=xp_reward or 0,
            points_reward=points_reward or 0,
            target_count=target_count,
            active=True,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'providerId': self.provider_id,
            'title': self.title,
            'description': self.description,
            'xpReward': self.xp_reward,
            'pointsReward': self.points_reward,
            'targetCount': self.target_count,
            'active': self.active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Medal(FirestoreModel):
    collection = 'medals'
    """Loyalty medal, awarded once per account."""
    @classmethod
    def create(cls, provider_id, title, description, icon='🏅'):
        if not title or not title.strip():
            raise ValidationError('Título da medalha é obrigatório')
        return cls(
            provider_id=provider_id,
            title=title.strip(),
            description=description or '',
            icon=icon or '🏅',
        )

    def to_dict(self):
        return {
            'id': self.id,
            'providerId': self.provider_id,
            'title': self.title,
            'description': self.description,
            'icon': self.icon,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ===========================================================================
# Phase 3 — CRM, ERP, Inventory, Marketing, Analytics
# ===========================================================================

# --- CRM ---

class ClientProfile(FirestoreModel):
    collection = 'client_profiles'
    """CRM client profile with history, segmentation, and lifecycle tracking."""
    # Stats
    _VIP_THRESHOLD = 10
    _INACTIVE_DAYS = 90
    _LOST_DAYS = 180

    @classmethod
    def create(cls, user_id, client_id, preferences='', birthday=None, notes=''):
        return cls(
            user_id=user_id,
            client_id=client_id,
            segment=ClientSegment.NEW.value,
            preferences=preferences or '',
            birthday=birthday,
            notes=notes or '',
            total_visits=0,
            total_spent=0.0,
            average_ticket=0.0,
            first_visit_at=None,
            last_visit_at=None,
            updated_at=None,
        )

    def record_visit(self, amount):
        """Record a visit and update stats."""
        money = Money(amount)
        if money.is_zero():
            raise ValidationError('Valor da visita deve ser maior que zero')
        now = datetime.utcnow()
        if self.first_visit_at is None:
            self.first_visit_at = now
        self.last_visit_at = now
        self.total_visits += 1
        self.total_spent = round(self.total_spent + money.to_float(), 2)
        self.average_ticket = round(self.total_spent / self.total_visits, 2)

    def update_segment(self):
        """Auto-segment based on visit history and recency."""
        if self.total_visits >= self._VIP_THRESHOLD:
            self.segment = ClientSegment.VIP.value
        elif self.last_visit_at is None:
            self.segment = ClientSegment.NEW.value
        else:
            days_since = (datetime.utcnow() - self.last_visit_at).days
            if days_since >= self._LOST_DAYS:
                self.segment = ClientSegment.LOST.value
            elif days_since >= self._INACTIVE_DAYS:
                self.segment = ClientSegment.INACTIVE.value
            else:
                self.segment = ClientSegment.ACTIVE.value
        self.updated_at = datetime.utcnow()

    @property
    def visit_frequency(self):
        return self.total_visits

    def is_birthday_today(self):
        if not self.birthday:
            return False
        today = datetime.utcnow().date()
        return (self.birthday.month == today.month and
                self.birthday.day == today.day)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'segment': self.segment,
            'segmentLabel': ClientSegment.from_value(self.segment).label,
            'preferences': self.preferences,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'notes': self.notes,
            'totalVisits': self.total_visits,
            'totalSpent': self.total_spent,
            'averageTicket': self.average_ticket,
            'lastVisitAt': self.last_visit_at.isoformat() if self.last_visit_at else None,
            'firstVisitAt': self.first_visit_at.isoformat() if self.first_visit_at else None,
            'isBirthdayToday': self.is_birthday_today(),
        }


class SatisfactionSurvey(FirestoreModel):
    collection = 'satisfaction_surveys'
    """Post-sale satisfaction survey linked to an appointment."""
    @classmethod
    def create(cls, user_id, client_id, appointment_id):
        return cls(
            user_id=user_id,
            client_id=client_id,
            appointment_id=appointment_id,
            status=SatisfactionStatus.PENDING.value,
            rating=None,
            comment='',
            responded_at=None,
        )

    def respond(self, rating, comment=''):
        if self.status == SatisfactionStatus.RESPONDED.value:
            raise CRMError('Pesquisa já respondida')
        if rating is None or rating < 1 or rating > 5:
            raise ValidationError('Avaliação deve ser entre 1 e 5')
        self.rating = rating
        self.comment = comment
        self.status = SatisfactionStatus.RESPONDED.value
        self.responded_at = datetime.utcnow()

    def skip(self):
        if self.status == SatisfactionStatus.RESPONDED.value:
            raise CRMError('Pesquisa já respondida')
        self.status = SatisfactionStatus.SKIPPED.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'appointmentId': self.appointment_id,
            'status': self.status,
            'statusLabel': SatisfactionStatus.from_value(self.status).label,
            'rating': self.rating,
            'comment': self.comment,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'respondedAt': self.responded_at.isoformat() if self.responded_at else None,
        }


# --- ERP Financial ---

class CostCenter(FirestoreModel):
    collection = 'cost_centers'
    """Cost center for categorizing financial entries."""
    @classmethod
    def create(cls, user_id, name, code=None):
        if not name or not name.strip():
            raise ValidationError('Nome do centro de custo é obrigatório')
        return cls(user_id=user_id, name=name.strip(), code=code, active=True)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'code': self.code,
            'active': self.active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class CashFlowEntry(FirestoreModel):
    collection = 'cash_flow_entrys'
    """Cash flow entry (revenue or expense) for a provider."""
    @classmethod
    def create(cls, user_id, type, description, amount, date, category='', cost_center_id=None):
        errors = []
        if not description or not description.strip():
            errors.append('Descrição é obrigatória')
        money = Money(amount)
        if money.is_zero():
            errors.append('Valor deve ser maior que zero')
        type_enum = FinancialEntryType.from_value(type)
        if errors:
            raise ValidationError('Entrada financeira inválida', errors)
        return cls(
            user_id=user_id,
            type=type_enum.value,
            description=description.strip(),
            amount=money.to_float(),
            date=date,
            category=category or '',
            cost_center_id=cost_center_id,
            recurring=False,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'type': self.type,
            'typeLabel': FinancialEntryType.from_value(self.type).label,
            'description': self.description,
            'amount': self.amount,
            'date': self.date.isoformat() if self.date else None,
            'category': self.category,
            'costCenterId': self.cost_center_id,
            'recurring': self.recurring,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class AccountPayable(FirestoreModel):
    collection = 'account_payables'
    """Account payable (bill to pay)."""
    @classmethod
    def create(cls, user_id, description, amount, due_date, category='', supplier_id=None):
        errors = []
        if not description or not description.strip():
            errors.append('Descrição é obrigatória')
        money = Money(amount)
        if money.is_zero():
            errors.append('Valor deve ser maior que zero')
        if errors:
            raise ValidationError('Conta a pagar inválida', errors)
        return cls(
            user_id=user_id,
            description=description.strip(),
            amount=money.to_float(),
            due_date=due_date,
            category=category or '',
            supplier_id=supplier_id,
            status=AccountStatus.PENDING.value,
            paid_date=None,
        )

    def mark_paid(self):
        if self.status == AccountStatus.PAID.value:
            raise ERPError('Conta já paga')
        self.status = AccountStatus.PAID.value
        self.paid_date = date.today()

    def cancel(self):
        if self.status == AccountStatus.PAID.value:
            raise ERPError('Conta paga não pode ser cancelada')
        self.status = AccountStatus.CANCELLED.value

    def check_overdue(self):
        if self.status == AccountStatus.PENDING.value and date.today() > self.due_date:
            self.status = AccountStatus.OVERDUE.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'description': self.description,
            'amount': self.amount,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'paidDate': self.paid_date.isoformat() if self.paid_date else None,
            'category': self.category,
            'supplierId': self.supplier_id,
            'status': self.status,
            'statusLabel': AccountStatus.from_value(self.status).label,
        }


class AccountReceivable(FirestoreModel):
    collection = 'account_receivables'
    """Account receivable (payment to receive from client)."""
    @classmethod
    def create(cls, user_id, description, amount, due_date, client_id=None, category=''):
        errors = []
        if not description or not description.strip():
            errors.append('Descrição é obrigatória')
        money = Money(amount)
        if money.is_zero():
            errors.append('Valor deve ser maior que zero')
        if errors:
            raise ValidationError('Conta a receber inválida', errors)
        return cls(
            user_id=user_id,
            client_id=client_id,
            description=description.strip(),
            amount=money.to_float(),
            due_date=due_date,
            category=category or '',
            status=AccountStatus.PENDING.value,
        )

    def mark_received(self):
        if self.status == AccountStatus.PAID.value:
            raise ERPError('Conta já recebida')
        self.status = AccountStatus.PAID.value
        self.received_date = date.today()

    def cancel(self):
        if self.status == AccountStatus.PAID.value:
            raise ERPError('Conta recebida não pode ser cancelada')
        self.status = AccountStatus.CANCELLED.value

    def check_overdue(self):
        if self.status == AccountStatus.PENDING.value and date.today() > self.due_date:
            self.status = AccountStatus.OVERDUE.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'description': self.description,
            'amount': self.amount,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'receivedDate': self.received_date.isoformat() if self.received_date else None,
            'category': self.category,
            'status': self.status,
            'statusLabel': AccountStatus.from_value(self.status).label,
        }


class FinancialPeriod(FirestoreModel):
    collection = 'financial_periods'
    """Financial closing period."""
    @classmethod
    def create(cls, user_id, name, start_date, end_date):
        if not name or not name.strip():
            raise ValidationError('Nome do período é obrigatório')
        if start_date >= end_date:
            raise ValidationError('Data de início deve ser anterior à data de fim')
        return cls(
            user_id=user_id,
            name=name.strip(),
            start_date=start_date,
            end_date=end_date,
            status=PeriodStatus.OPEN.value,
            closed_at=None,
        )

    def close(self):
        if self.status == PeriodStatus.CLOSED.value:
            raise ERPError('Período já fechado')
        self.status = PeriodStatus.CLOSED.value
        self.closed_at = datetime.utcnow()

    def contains_date(self, d):
        return self.start_date <= d <= self.end_date

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'statusLabel': PeriodStatus.from_value(self.status).label,
            'closedAt': self.closed_at.isoformat() if self.closed_at else None,
        }


# --- Inventory ---

class Supplier(FirestoreModel):
    collection = 'suppliers'
    """Product supplier."""
    @classmethod
    def create(cls, user_id, name, cnpj=None, email=None, phone=None):
        if not name or not name.strip():
            raise ValidationError('Nome do fornecedor é obrigatório')
        return cls(
            user_id=user_id,
            name=name.strip(),
            cnpj=cnpj,
            email=email,
            phone=phone,
            active=True,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'cnpj': self.cnpj,
            'email': self.email,
            'phone': self.phone,
            'active': self.active,
        }


class Product(FirestoreModel):
    collection = 'products'
    """Inventory product with stock tracking."""
    @classmethod
    def create(cls, user_id, name, sku=None, category='', unit='unidade',
               min_stock=0, unit_price=0.0, supplier_id=None):
        if not name or not name.strip():
            raise ValidationError('Nome do produto é obrigatório')
        return cls(
            user_id=user_id,
            name=name.strip(),
            sku=sku,
            category=category or '',
            unit=unit or 'unidade',
            min_stock=min_stock or 0,
            current_stock=0,
            unit_price=unit_price or 0.0,
            supplier_id=supplier_id,
            active=True,
            movements=[],
        )

    def is_below_minimum(self):
        return self.current_stock < self.min_stock

    @property
    def stock_value(self):
        return round(self.current_stock * self.unit_price, 2)

    def add_stock(self, quantity, reason='Entrada de estoque'):
        if quantity <= 0:
            raise ValidationError('Quantidade deve ser maior que zero')
        self.current_stock += quantity
        movement = StockMovement(
            user_id=self.user_id,
            product_id=self.id,
            type=StockMovementType.ENTRY.value,
            quantity=quantity,
            reason=reason,
            appointment_id=None,
        )
        self.movements.append(movement)
        return movement

    def consume_stock(self, quantity, reason='Consumo por serviço'):
        if quantity <= 0:
            raise ValidationError('Quantidade deve ser maior que zero')
        if quantity > self.current_stock:
            raise InventoryError('Estoque insuficiente')
        self.current_stock -= quantity
        movement = StockMovement(
            user_id=self.user_id,
            product_id=self.id,
            type=StockMovementType.CONSUMPTION.value,
            quantity=quantity,
            reason=reason,
            appointment_id=None,
        )
        self.movements.append(movement)
        return movement

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'sku': self.sku,
            'category': self.category,
            'unit': self.unit,
            'minStock': self.min_stock,
            'currentStock': self.current_stock,
            'unitPrice': self.unit_price,
            'stockValue': self.stock_value,
            'supplierId': self.supplier_id,
            'active': self.active,
            'movements': [m.to_dict() for m in self.movements],
            'belowMinimum': self.is_below_minimum(),
        }

    @classmethod
    def from_dict(cls, data):
        """Override to deserialize movements dicts to StockMovement objects."""
        skip_names = set()
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name, None)
            if isinstance(attr, property) and not attr.fset:
                skip_names.add(attr_name)
            elif callable(attr) and not isinstance(attr, type):
                skip_names.add(attr_name)

        converted = {}
        for key, value in (data or {}).items():
            snake_key = cls._camel_to_snake(key)
            if snake_key in skip_names:
                continue
            if snake_key == 'movements' and isinstance(value, list):
                converted[snake_key] = [
                    StockMovement.from_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
                continue
            if isinstance(value, str) and (snake_key.endswith('_at') or snake_key == 'created_at'):
                try:
                    converted[snake_key] = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            else:
                converted[snake_key] = value
        return cls(**converted)


class StockMovement(FirestoreModel):
    collection = 'stock_movements'
    """Immutable stock movement record."""
    @classmethod
    def create(cls, user_id, product_id, type, quantity, reason='', appointment_id=None):
        if quantity is None or quantity <= 0:
            raise ValidationError('Quantidade deve ser maior que zero')
        type_enum = StockMovementType.from_value(type)
        return cls(
            user_id=user_id,
            product_id=product_id,
            type=type_enum.value,
            quantity=quantity,
            reason=reason or '',
            appointment_id=appointment_id,
        )

    @property
    def movement_type(self):
        return StockMovementType.from_value(self.type)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'productId': self.product_id,
            'type': self.type,
            'typeLabel': self.movement_type.label,
            'quantity': self.quantity,
            'reason': self.reason,
            'appointmentId': self.appointment_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# --- Marketing ---

class Campaign(FirestoreModel):
    collection = 'campaigns'
    """Marketing campaign with lifecycle and conversion tracking."""
    @classmethod
    def create(cls, user_id, name, channel, subject='', body='', segment='all'):
        errors = []
        if not name or not name.strip():
            errors.append('Nome da campanha é obrigatório')
        if errors:
            raise ValidationError('Campanha inválida', errors)
        channel_enum = CampaignChannel.from_value(channel)
        return cls(
            user_id=user_id,
            name=name.strip(),
            channel=channel_enum.value,
            subject=subject or '',
            body=body or '',
            segment=segment or 'all',
            status=CampaignStatus.DRAFT.value,
            total_sent=0,
            total_conversions=0,
            scheduled_at=None,
            started_at=None,
            completed_at=None,
        )

    def schedule(self, scheduled_date):
        if self.status != CampaignStatus.DRAFT.value:
            raise MarketingError('Apenas rascunhos podem ser agendados')
        self.scheduled_at = datetime.combine(scheduled_date, datetime.min.time())
        self.status = CampaignStatus.SCHEDULED.value

    def start(self):
        if self.status != CampaignStatus.SCHEDULED.value:
            raise MarketingError('Apenas campanhas agendadas podem ser iniciadas')
        self.status = CampaignStatus.RUNNING.value
        self.started_at = datetime.utcnow()

    def pause(self):
        if self.status != CampaignStatus.RUNNING.value:
            raise MarketingError('Apenas campanhas em execução podem ser pausadas')
        self.status = CampaignStatus.PAUSED.value

    def resume(self):
        if self.status != CampaignStatus.PAUSED.value:
            raise MarketingError('Apenas campanhas pausadas podem ser retomadas')
        self.status = CampaignStatus.RUNNING.value

    def complete(self):
        if self.status not in (CampaignStatus.RUNNING.value, CampaignStatus.PAUSED.value):
            raise MarketingError('Campanha não pode ser concluída no estado atual')
        self.status = CampaignStatus.COMPLETED.value
        self.completed_at = datetime.utcnow()

    def cancel(self):
        if self.current_status.is_terminal:
            raise MarketingError('Campanha finalizada não pode ser cancelada')
        self.status = CampaignStatus.CANCELLED.value

    @property
    def current_status(self):
        return CampaignStatus.from_value(self.status)

    def record_send(self, count):
        self.total_sent += count

    def record_conversion(self, count):
        self.total_conversions += count

    @property
    def conversion_rate(self):
        if self.total_sent == 0:
            return 0.0
        return round((self.total_conversions / self.total_sent) * 100, 2)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'channel': self.channel,
            'channelLabel': CampaignChannel.from_value(self.channel).label,
            'subject': self.subject,
            'body': self.body,
            'segment': self.segment,
            'status': self.status,
            'statusLabel': self.current_status.label,
            'scheduledAt': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'startedAt': self.started_at.isoformat() if self.started_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'totalSent': self.total_sent,
            'totalConversions': self.total_conversions,
            'conversionRate': self.conversion_rate,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Coupon(FirestoreModel):
    collection = 'coupons'
    """Discount coupon with usage tracking and validation."""
    @classmethod
    def create(cls, user_id, code, coupon_type, value, valid_until, max_uses=1):
        errors = []
        if not code or not code.strip():
            errors.append('Código do cupom é obrigatório')
        if max_uses is not None and max_uses <= 0:
            errors.append('Número máximo de usos deve ser maior que zero')
        type_enum = CouponType.from_value(coupon_type)
        if errors:
            raise ValidationError('Cupom inválido', errors)
        return cls(
            user_id=user_id,
            code=code.strip().upper(),
            coupon_type=type_enum.value,
            value=value,
            valid_until=valid_until,
            max_uses=max_uses,
            uses_count=0,
            active=True,
        )

    def is_valid(self):
        if not self.active:
            return False
        if date.today() > self.valid_until:
            return False
        if self.uses_count >= self.max_uses:
            return False
        return True

    def use(self):
        self.uses_count += 1

    def calculate_discount(self, amount):
        if self.coupon_type == CouponType.PERCENTAGE.value:
            return round(amount * (self.value / 100), 2)
        elif self.coupon_type == CouponType.FIXED.value:
            return min(self.value, amount)
        elif self.coupon_type == CouponType.FREE_SESSION.value:
            return amount
        return 0.0

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'code': self.code,
            'couponType': self.coupon_type,
            'couponTypeLabel': CouponType.from_value(self.coupon_type).label,
            'value': self.value,
            'validUntil': self.valid_until.isoformat() if self.valid_until else None,
            'maxUses': self.max_uses,
            'usesCount': self.uses_count,
            'active': self.active,
            'isValid': self.is_valid(),
        }


# --- Analytics ---

class DashboardReport(FirestoreModel):
    collection = 'dashboard_reports'
    """Executive dashboard report with metrics and filters."""
    # Metrics
    @classmethod
    def create(cls, user_id, start_date, end_date, filters=None):
        if start_date is None:
            start_date = date.today().isoformat()
        if end_date is None:
            end_date = date.today().isoformat()
        if start_date > end_date:
            raise ValidationError('Data de início deve ser anterior à data de fim')
        return cls(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            filters_json=json.dumps(filters or {}),
            total_revenue=0.0,
            total_expenses=0.0,
        )

    @property
    def profit(self):
        return round(self.total_revenue - self.total_expenses, 2)

    @property
    def profit_margin(self):
        if self.total_revenue == 0:
            return 0.0
        return round((self.profit / self.total_revenue) * 100, 2)

    @property
    def average_ticket(self):
        if self.total_appointments == 0:
            return 0.0
        return round(self.total_revenue / self.total_appointments, 2)

    @property
    def cancellation_rate(self):
        if self.total_appointments == 0:
            return 0.0
        return round((self.cancelled_appointments / self.total_appointments) * 100, 2)

    @property
    def filters(self):
        return json.loads(self.filters_json or '{}')

    def set_metrics(self, total_revenue, total_expenses, total_appointments,
                    total_clients, new_clients, cancelled_appointments):
        self.total_revenue = total_revenue
        self.total_expenses = total_expenses
        self.total_appointments = total_appointments
        self.total_clients = total_clients
        self.new_clients = new_clients
        self.cancelled_appointments = cancelled_appointments

    def to_dict(self):
        def _fmt_date(d):
            if not d:
                return None
            if isinstance(d, str):
                return d
            return d.isoformat()
        return {
            'id': self.id,
            'userId': self.user_id,
            'startDate': _fmt_date(self.start_date),
            'endDate': _fmt_date(self.end_date),
            'filters': self.filters,
            'totalRevenue': self.total_revenue,
            'totalExpenses': self.total_expenses,
            'profit': self.profit,
            'profitMargin': self.profit_margin,
            'totalAppointments': self.total_appointments,
            'totalClients': self.total_clients,
            'newClients': self.new_clients,
            'cancelledAppointments': self.cancelled_appointments,
            'averageTicket': self.average_ticket,
            'cancellationRate': self.cancellation_rate,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ===========================================================================
# Phase 4 — Teams, Commissions, Multi-unit
# ===========================================================================

# --- Multi-unit / Branches ---

class Branch(FirestoreModel):
    collection = 'branchs'
    """Branch/unit for multi-unit providers."""
    @classmethod
    def create(cls, user_id, name, branch_type=BranchType.HEADQUARTERS.value,
               address='', phone=''):
        if not name or not name.strip():
            raise ValidationError('Nome da unidade é obrigatório')
        type_enum = BranchType.from_value(branch_type)
        return cls(
            user_id=user_id,
            name=name.strip(),
            branch_type=type_enum.value,
            address=address or '',
            phone=phone or '',
            active=True,
        )

    def deactivate(self):
        self.active = False

    def reactivate(self):
        self.active = True

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'branchType': self.branch_type,
            'branchTypeLabel': BranchType.from_value(self.branch_type).label,
            'address': self.address,
            'phone': self.phone,
            'active': self.active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# --- Employees / Teams ---

class Employee(FirestoreModel):
    collection = 'employees'
    """Employee/collaborator within a provider's team."""
    @classmethod
    def create(cls, user_id, name, email, role, branch_id=None, permissions=None):
        errors = []
        if not name or not name.strip():
            errors.append('Nome do colaborador é obrigatório')
        if not email or not email.strip():
            errors.append('E-mail do colaborador é obrigatório')
        if errors:
            raise ValidationError('Colaborador inválido', errors)
        role_enum = EmployeeRole.from_value(role)
        token = secrets.token_urlsafe(32)
        return cls(
            user_id=user_id,
            name=name.strip(),
            email=email.strip(),
            role=role_enum.value,
            branch_id=branch_id,
            status=EmployeeStatus.INVITED.value,
            invite_token=token,
            permissions_json=json.dumps(permissions or []),
            accepted_at=None,
            suspended_at=None,
            terminated_at=None,
            history=[],
        )

    @property
    def permissions(self):
        return json.loads(self.permissions_json or '[]')

    def has_permission(self, permission):
        return permission in self.permissions

    def can_access_system(self):
        return self.status == EmployeeStatus.ACTIVE.value

    def accept_invite(self):
        if self.status != EmployeeStatus.INVITED.value:
            raise EmployeeError('Apenas colaboradores convidados podem aceitar')
        self.status = EmployeeStatus.ACTIVE.value
        self.accepted_at = datetime.utcnow()

    def suspend(self):
        if self.status == EmployeeStatus.TERMINATED.value:
            raise EmployeeError('Colaborador demitido não pode ser suspenso')
        if self.status == EmployeeStatus.SUSPENDED.value:
            raise EmployeeError('Colaborador já suspenso')
        self.status = EmployeeStatus.SUSPENDED.value
        self.suspended_at = datetime.utcnow()

    def terminate(self):
        if self.status == EmployeeStatus.TERMINATED.value:
            raise EmployeeError('Colaborador já demitido')
        self.status = EmployeeStatus.TERMINATED.value
        self.terminated_at = datetime.utcnow()

    def reactivate(self):
        if self.status == EmployeeStatus.TERMINATED.value:
            raise EmployeeError('Colaborador demitido não pode ser reativado')
        self.status = EmployeeStatus.ACTIVE.value
        self.suspended_at = None

    def add_history(self, action, description, changed_by=None):
        entry = EmployeeHistory(
            employee_id=self.id,
            action=action,
            description=description,
            changed_by=changed_by,
        )
        self.history.append(entry)
        return entry

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'roleLabel': EmployeeRole.from_value(self.role).label,
            'branchId': self.branch_id,
            'status': self.status,
            'statusLabel': EmployeeStatus.from_value(self.status).label,
            'inviteToken': self.invite_token,
            'permissions': self.permissions,
            'acceptedAt': self.accepted_at.isoformat() if self.accepted_at else None,
            'suspendedAt': self.suspended_at.isoformat() if self.suspended_at else None,
            'terminatedAt': self.terminated_at.isoformat() if self.terminated_at else None,
            'canAccessSystem': self.can_access_system(),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data):
        """Override to deserialize history dicts to EmployeeHistory objects."""
        skip_names = set()
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name, None)
            if isinstance(attr, property) and not attr.fset:
                skip_names.add(attr_name)
            elif callable(attr) and not isinstance(attr, type):
                skip_names.add(attr_name)

        converted = {}
        for key, value in (data or {}).items():
            snake_key = cls._camel_to_snake(key)
            if snake_key in skip_names:
                continue
            if snake_key == 'history' and isinstance(value, list):
                converted[snake_key] = [
                    EmployeeHistory.from_dict(v) if isinstance(v, dict) else v
                    for v in value
                ]
                continue
            if isinstance(value, str) and (snake_key.endswith('_at') or snake_key == 'created_at'):
                try:
                    converted[snake_key] = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            else:
                converted[snake_key] = value
        return cls(**converted)


class EmployeeHistory(FirestoreModel):
    collection = 'employee_historys'
    """Audit trail of employee changes."""
    @classmethod
    def create(cls, employee_id, action, description='', changed_by=None):
        if not action or not action.strip():
            raise ValidationError('Ação do histórico é obrigatória')
        return cls(
            employee_id=employee_id,
            action=action.strip(),
            description=description or '',
            changed_by=changed_by,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'employeeId': self.employee_id,
            'action': self.action,
            'description': self.description,
            'changedBy': self.changed_by,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# --- Commissions ---

class CommissionRule(FirestoreModel):
    collection = 'commission_rules'
    """Commission rule per employee, optionally per service and/or branch."""
    @classmethod
    def create(cls, user_id, employee_id, commission_type, value,
               service_id=None, branch_id=None):
        type_enum = CommissionType.from_value(commission_type)
        if value is None or value < 0:
            raise ValidationError('Valor da comissão deve ser maior ou igual a zero')
        return cls(
            user_id=user_id,
            employee_id=employee_id,
            commission_type=type_enum.value,
            value=value,
            service_id=service_id,
            branch_id=branch_id,
            active=True,
        )

    def calculate(self, base_amount):
        """Calculate commission amount from a base service amount."""
        if self.commission_type == CommissionType.PERCENTAGE.value:
            return round(base_amount * (self.value / 100), 2)
        elif self.commission_type == CommissionType.FIXED.value:
            return round(self.value, 2)
        return 0.0

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'employeeId': self.employee_id,
            'commissionType': self.commission_type,
            'commissionTypeLabel': CommissionType.from_value(self.commission_type).label,
            'value': self.value,
            'serviceId': self.service_id,
            'branchId': self.branch_id,
            'active': self.active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class CommissionPayment(FirestoreModel):
    collection = 'commission_payments'
    """Commission payment record linked to an appointment."""
    @classmethod
    def create(cls, user_id, employee_id, amount, base_amount,
               appointment_id=None, service_id=None):
        if amount is None or amount <= 0:
            raise ValidationError('Valor da comissão deve ser maior que zero')
        return cls(
            user_id=user_id,
            employee_id=employee_id,
            appointment_id=appointment_id,
            service_id=service_id,
            amount=round(amount, 2),
            base_amount=round(base_amount, 2),
            status=CommissionStatus.PENDING.value,
            paid_at=None,
        )

    def mark_paid(self):
        if self.status == CommissionStatus.PAID.value:
            raise CommissionError('Comissão já paga')
        if self.status == CommissionStatus.CANCELLED.value:
            raise CommissionError('Comissão cancelada não pode ser paga')
        self.status = CommissionStatus.PAID.value
        self.paid_at = datetime.utcnow()

    def cancel(self):
        if self.status == CommissionStatus.PAID.value:
            raise CommissionError('Comissão paga não pode ser cancelada')
        self.status = CommissionStatus.CANCELLED.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'employeeId': self.employee_id,
            'appointmentId': self.appointment_id,
            'serviceId': self.service_id,
            'amount': self.amount,
            'baseAmount': self.base_amount,
            'status': self.status,
            'statusLabel': CommissionStatus.from_value(self.status).label,
            'paidAt': self.paid_at.isoformat() if self.paid_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# --- Stock Transfers ---

class StockTransfer(FirestoreModel):
    collection = 'stock_transfers'
    """Stock transfer between branches with audit trail."""
    def _transition(self, new_status):
        current = TransferStatus.from_value(self.status)
        target = TransferStatus.from_value(new_status)
        allowed = TRANSFER_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise TransferError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, user_id, product_id, from_branch_id, to_branch_id,
               quantity, reason=''):
        if from_branch_id == to_branch_id:
            raise TransferError('Unidade de origem e destino devem ser diferentes')
        if quantity is None or quantity <= 0:
            raise ValidationError('Quantidade deve ser maior que zero')
        return cls(
            user_id=user_id,
            product_id=product_id,
            from_branch_id=from_branch_id,
            to_branch_id=to_branch_id,
            quantity=quantity,
            reason=reason or '',
            status=TransferStatus.REQUESTED.value,
            approved_at=None,
            shipped_at=None,
            completed_at=None,
        )

    def approve(self):
        self._transition(TransferStatus.APPROVED.value)
        self.approved_at = datetime.utcnow()

    def reject(self):
        self._transition(TransferStatus.REJECTED.value)

    def ship(self):
        self._transition(TransferStatus.IN_TRANSIT.value)
        self.shipped_at = datetime.utcnow()

    def complete(self):
        self._transition(TransferStatus.COMPLETED.value)
        self.completed_at = datetime.utcnow()

    def cancel(self):
        self._transition(TransferStatus.CANCELLED.value)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'productId': self.product_id,
            'fromBranchId': self.from_branch_id,
            'toBranchId': self.to_branch_id,
            'quantity': self.quantity,
            'status': self.status,
            'statusLabel': TransferStatus.from_value(self.status).label,
            'reason': self.reason,
            'approvedAt': self.approved_at.isoformat() if self.approved_at else None,
            'shippedAt': self.shipped_at.isoformat() if self.shipped_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ===========================================================================
# Phase 5 — Social Network, Chat, Notifications
# ===========================================================================

# --- Social Network ---

_BLOCKED_EXTENSIONS = {'.exe', '.bat', '.cmd', '.scr', '.com', '.vbs', '.js'}
_MAX_CAPTION_LENGTH = 2000
_MAX_COMMENT_LENGTH = 500
_STORY_DURATION_HOURS = 24


class Post(FirestoreModel):
    collection = 'posts'
    """Social feed post (photo, video, reel, text, sponsored)."""
    @classmethod
    def create(cls, user_id, post_type, caption='', media_url=None,
               action=PostAction.NONE.value, is_sponsored=False):
        type_enum = PostType.from_value(post_type)
        action_enum = PostAction.from_value(action)
        if caption and len(caption) > _MAX_CAPTION_LENGTH:
            raise ValidationError('Legenda muito longa')
        # Text posts don't require media; all others do
        if type_enum != PostType.TEXT and not media_url:
            raise ValidationError('Mídia é obrigatória para este tipo de publicação')
        # Antivirus mock: reject suspicious extensions
        if media_url:
            lower_url = media_url.lower()
            for ext in _BLOCKED_EXTENSIONS:
                if lower_url.endswith(ext):
                    raise ValidationError('Arquivo bloqueado pelo antivírus')
        # Sponsored posts require moderation
        status = PostStatus.UNDER_REVIEW.value if is_sponsored else PostStatus.PUBLISHED.value
        return cls(
            user_id=user_id,
            post_type=type_enum.value,
            caption=caption or '',
            media_url=media_url,
            action=action_enum.value,
            is_sponsored=is_sponsored,
            status=status,
            likes_count=0,
            comments_count=0,
            shares_count=0,
            saves_count=0,
        )

    def like(self):
        self.likes_count += 1

    def unlike(self):
        if self.likes_count > 0:
            self.likes_count -= 1

    def add_comment(self):
        self.comments_count += 1

    def share(self):
        self.shares_count += 1

    def save(self):
        self.saves_count += 1

    def archive(self):
        self.status = PostStatus.ARCHIVED.value

    def remove(self):
        self.status = PostStatus.REMOVED.value

    def is_visible(self):
        return self.status == PostStatus.PUBLISHED.value

    def moderate(self, moderation_status):
        mod_enum = ModerationStatus.from_value(moderation_status)
        if mod_enum == ModerationStatus.APPROVED:
            self.status = PostStatus.PUBLISHED.value
        elif mod_enum in (ModerationStatus.REJECTED, ModerationStatus.REMOVED):
            self.status = PostStatus.REMOVED.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'postType': self.post_type,
            'postTypeLabel': PostType.from_value(self.post_type).label,
            'caption': self.caption,
            'mediaUrl': self.media_url,
            'action': self.action,
            'actionLabel': PostAction.from_value(self.action).label,
            'isSponsored': self.is_sponsored,
            'status': self.status,
            'statusLabel': PostStatus.from_value(self.status).label,
            'likesCount': self.likes_count,
            'commentsCount': self.comments_count,
            'sharesCount': self.shares_count,
            'savesCount': self.saves_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Comment(FirestoreModel):
    collection = 'comments'
    """Comment on a post."""
    @classmethod
    def create(cls, post_id, user_id, content):
        if not content or not content.strip():
            raise ValidationError('Comentário não pode estar vazio')
        if len(content) > _MAX_COMMENT_LENGTH:
            raise ValidationError('Comentário muito longo')
        return cls(
            post_id=post_id,
            user_id=user_id,
            content=content.strip(),
        )

    def to_dict(self):
        return {
            'id': self.id,
            'postId': self.post_id,
            'userId': self.user_id,
            'content': self.content,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Story(FirestoreModel):
    collection = 'storys'
    """Ephemeral story that expires after 24 hours."""
    @classmethod
    def create(cls, user_id, media_url):
        if not media_url or not media_url.strip():
            raise ValidationError('Mídia é obrigatória para story')
        return cls(
            user_id=user_id,
            media_url=media_url,
            status=StoryStatus.ACTIVE.value,
            expires_at=datetime.utcnow() + timedelta(hours=_STORY_DURATION_HOURS),
        )

    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def remove(self):
        self.status = StoryStatus.REMOVED.value

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'mediaUrl': self.media_url,
            'status': self.status,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Follow(FirestoreModel):
    collection = 'follows'
    """Follow relationship between users."""
    @classmethod
    def create(cls, follower_id, following_id):
        if follower_id == following_id:
            raise ValidationError('Não é possível seguir a si mesmo')
        return cls(
            follower_id=follower_id,
            following_id=following_id,
            active=True,
        )

    def unfollow(self):
        self.active = False

    def to_dict(self):
        return {
            'id': self.id,
            'followerId': self.follower_id,
            'followingId': self.following_id,
            'active': self.active,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Report(FirestoreModel):
    collection = 'reports'
    """Content report for moderation."""
    @classmethod
    def create(cls, post_id, reported_by, reason, description=''):
        reason_enum = ReportReason.from_value(reason)
        return cls(
            post_id=post_id,
            reported_by=reported_by,
            reason=reason_enum.value,
            description=description or '',
            status=ReportStatus.OPEN.value,
            reviewed_by=None,
            reviewed_at=None,
        )

    def start_review(self):
        if self.status != ReportStatus.OPEN.value:
            raise SocialError('Apenas denúncias abertas podem ser revisadas')
        self.status = ReportStatus.REVIEWING.value

    def resolve(self):
        if self.status != ReportStatus.REVIEWING.value:
            raise SocialError('Apenas denúncias em análise podem ser resolvidas')
        self.status = ReportStatus.RESOLVED.value
        self.reviewed_at = datetime.utcnow()

    def dismiss(self):
        if self.status != ReportStatus.REVIEWING.value:
            raise SocialError('Apenas denúncias em análise podem ser arquivadas')
        self.status = ReportStatus.DISMISSED.value
        self.reviewed_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'postId': self.post_id,
            'reportedBy': self.reported_by,
            'reason': self.reason,
            'reasonLabel': ReportReason.from_value(self.reason).label,
            'description': self.description,
            'status': self.status,
            'statusLabel': ReportStatus.from_value(self.status).label,
            'reviewedBy': self.reviewed_by,
            'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class ModerationLog(FirestoreModel):
    collection = 'moderation_logs'
    """Audit trail of moderation actions."""
    @classmethod
    def create(cls, post_id, moderator_id, action, notes=''):
        if not action or not action.strip():
            raise ValidationError('Ação de moderação é obrigatória')
        action_enum = ModerationStatus.from_value(action)
        return cls(
            post_id=post_id,
            moderator_id=moderator_id,
            action=action_enum.value,
            notes=notes or '',
        )

    def to_dict(self):
        return {
            'id': self.id,
            'postId': self.post_id,
            'moderatorId': self.moderator_id,
            'action': self.action,
            'actionLabel': ModerationStatus.from_value(self.action).label,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# --- Chat ---

class Chat(FirestoreModel):
    collection = 'chats'
    """Chat conversation between users."""
    @classmethod
    def create(cls, user_id, chat_type, participant_a_id, participant_b_id):
        if participant_a_id is None or participant_b_id is None:
            raise ValidationError('Ambos os participantes são obrigatórios')
        type_enum = ChatType.from_value(chat_type)
        return cls(
            user_id=user_id,
            chat_type=type_enum.value,
            participant_a_id=participant_a_id,
            participant_b_id=participant_b_id,
            active=True,
            blocked_by=None,
            updated_at=None,
        )

    def block(self, blocked_by):
        self.active = False
        self.blocked_by = blocked_by

    def unblock(self):
        self.active = True
        self.blocked_by = None

    def archive(self):
        self.active = False

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'chatType': self.chat_type,
            'chatTypeLabel': ChatType.from_value(self.chat_type).label,
            'participantAId': self.participant_a_id,
            'participantBId': self.participant_b_id,
            'active': self.active,
            'blockedBy': self.blocked_by,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class Message(FirestoreModel):
    collection = 'messages'
    """Chat message with optional media."""
    def _transition(self, new_status):
        current = MessageStatus.from_value(self.status)
        target = MessageStatus.from_value(new_status)
        allowed = MESSAGE_STATUS_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ChatError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, chat_id, sender_id, message_type, content='', media_url=None):
        type_enum = MessageType.from_value(message_type)
        # Text and auto messages require content
        if type_enum in (MessageType.TEXT, MessageType.AUTO, MessageType.LOCATION):
            if not content or not content.strip():
                raise ValidationError('Conteúdo da mensagem é obrigatório')
        # Media types require media_url
        if type_enum in (MessageType.PHOTO, MessageType.VIDEO,
                         MessageType.AUDIO, MessageType.DOCUMENT):
            if not media_url:
                raise ValidationError('URL da mídia é obrigatória')
        return cls(
            chat_id=chat_id,
            sender_id=sender_id,
            message_type=type_enum.value,
            content=content or '',
            media_url=media_url,
            status=MessageStatus.SENT.value,
            deleted=False,
            delivered_at=None,
            read_at=None,
        )

    def mark_delivered(self):
        self._transition(MessageStatus.DELIVERED.value)
        self.delivered_at = datetime.utcnow()

    def mark_read(self):
        self._transition(MessageStatus.READ.value)
        self.read_at = datetime.utcnow()

    def mark_failed(self):
        self._transition(MessageStatus.FAILED.value)

    def delete(self):
        self.deleted = True
        self.deleted_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'chatId': self.chat_id,
            'senderId': self.sender_id,
            'messageType': self.message_type,
            'messageTypeLabel': MessageType.from_value(self.message_type).label,
            'content': self.content,
            'mediaUrl': self.media_url,
            'status': self.status,
            'statusLabel': MessageStatus.from_value(self.status).label,
            'deleted': self.deleted,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'deliveredAt': self.delivered_at.isoformat() if self.delivered_at else None,
            'readAt': self.read_at.isoformat() if self.read_at else None,
        }


# --- Notifications ---

class NotificationPreference(FirestoreModel):
    collection = 'notification_preferences'
    """User notification preferences per tenant/unit."""
    @classmethod
    def create(cls, user_id, branch_id=None, quiet_start=None, quiet_end=None):
        return cls(
            user_id=user_id,
            branch_id=branch_id,
            push_enabled=True,
            sms_enabled=False,
            email_enabled=True,
            whatsapp_enabled=False,
            in_app_enabled=True,
            quiet_start=quiet_start,
            quiet_end=quiet_end,
            disabled_types_json='[]',
        )

    @property
    def disabled_types(self):
        return json.loads(self.disabled_types_json or '[]')

    def is_type_enabled(self, notification_type):
        return notification_type not in self.disabled_types

    def disable_type(self, notification_type):
        types = self.disabled_types
        if notification_type not in types:
            types.append(notification_type)
            self.disabled_types_json = json.dumps(types)

    def enable_type(self, notification_type):
        types = self.disabled_types
        if notification_type in types:
            types.remove(notification_type)
            self.disabled_types_json = json.dumps(types)

    def is_quiet_time(self, check_time):
        if not self.quiet_start or not self.quiet_end:
            return False
        # Handle overnight range (e.g., 22:00 → 08:00)
        if self.quiet_start <= self.quiet_end:
            return self.quiet_start <= check_time < self.quiet_end
        else:
            return check_time >= self.quiet_start or check_time < self.quiet_end

    def should_send(self, notification_type, priority, check_time=None):
        """Determine if a notification should be sent based on preferences."""
        from datetime import time as dt_time
        if check_time is None:
            check_time = datetime.utcnow().time()
        if not self.is_type_enabled(notification_type):
            return False
        # Urgent notifications bypass quiet hours
        if priority == NotificationPriority.URGENT.value:
            return True
        if self.is_quiet_time(check_time):
            return False
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'branchId': self.branch_id,
            'pushEnabled': self.push_enabled,
            'smsEnabled': self.sms_enabled,
            'emailEnabled': self.email_enabled,
            'whatsappEnabled': self.whatsapp_enabled,
            'inAppEnabled': self.in_app_enabled,
            'quietStart': self.quiet_start.isoformat() if self.quiet_start else None,
            'quietEnd': self.quiet_end.isoformat() if self.quiet_end else None,
            'disabledTypes': self.disabled_types,
        }


class Notification(FirestoreModel):
    collection = 'notifications'
    """Notification record for delivery tracking."""
    @classmethod
    def create(cls, user_id, notification_type, title, body,
               channel=NotificationChannel.PUSH.value,
               priority=NotificationPriority.NORMAL.value, data=None):
        if not title or not title.strip():
            raise ValidationError('Título da notificação é obrigatório')
        type_enum = NotificationType.from_value(notification_type)
        channel_enum = NotificationChannel.from_value(channel)
        priority_enum = NotificationPriority.from_value(priority)
        return cls(
            user_id=user_id,
            notification_type=type_enum.value,
            title=title.strip(),
            body=body or '',
            channel=channel_enum.value,
            priority=priority_enum.value,
            status='pending',
            data_json=json.dumps(data or {}),
        )

    def mark_sent(self):
        self.status = 'sent'
        self.sent_at = datetime.utcnow()

    def mark_failed(self):
        self.status = 'failed'

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'notificationType': self.notification_type,
            'notificationTypeLabel': NotificationType.from_value(
                self.notification_type).label,
            'title': self.title,
            'body': self.body,
            'channel': self.channel,
            'channelLabel': NotificationChannel.from_value(self.channel).label,
            'priority': self.priority,
            'priorityLabel': NotificationPriority.from_value(self.priority).label,
            'status': self.status,
            'data': json.loads(self.data_json or '{}'),
            'sentAt': self.sent_at.isoformat() if self.sent_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ===========================================================================
# Phase 6 — Home Care, Logistics, Documents, Workflow Builder
# ===========================================================================

import math as _math

_EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two coordinates in km (Haversine formula)."""
    r_lat1 = _math.radians(lat1)
    r_lat2 = _math.radians(lat2)
    d_lat = _math.radians(lat2 - lat1)
    d_lng = _math.radians(lng2 - lng1)
    a = (_math.sin(d_lat / 2) ** 2 +
         _math.cos(r_lat1) * _math.cos(r_lat2) * _math.sin(d_lng / 2) ** 2)
    c = 2 * _math.atan2(_math.sqrt(a), _math.sqrt(1 - a))
    return _EARTH_RADIUS_KM * c


def estimate_travel_time(distance_km, speed_kmh=30):
    """Estimate travel time in minutes given distance and average speed."""
    if distance_km <= 0:
        return 0
    return int(round((distance_km / speed_kmh) * 60))


class ServiceArea(FirestoreModel):
    collection = 'service_areas'
    """Provider's home care service area with radius and travel fees."""
    @classmethod
    def create(cls, user_id, radius_km, base_lat, base_lng,
               travel_fee=0.0, fee_per_km=0.0):
        if not radius_km or radius_km <= 0:
            raise ValidationError('Raio de atendimento deve ser maior que zero')
        return cls(
            user_id=user_id,
            radius_km=radius_km,
            base_lat=base_lat,
            base_lng=base_lng,
            travel_fee=travel_fee,
            fee_per_km=fee_per_km,
            active=True,
        )

    def is_within_coverage(self, lat, lng):
        dist = haversine_distance(self.base_lat, self.base_lng, lat, lng)
        return dist <= self.radius_km

    def calculate_travel_fee(self, lat, lng):
        dist = haversine_distance(self.base_lat, self.base_lng, lat, lng)
        return self.travel_fee + (self.fee_per_km * dist)

    def estimate_travel(self, lat, lng):
        dist = haversine_distance(self.base_lat, self.base_lng, lat, lng)
        return {
            'distance_km': round(dist, 2),
            'travel_time_min': estimate_travel_time(dist),
            'fee': self.calculate_travel_fee(lat, lng),
        }

    def deactivate(self):
        self.active = False

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'radiusKm': self.radius_km,
            'baseLat': self.base_lat,
            'baseLng': self.base_lng,
            'travelFee': self.travel_fee,
            'feePerKm': self.fee_per_km,
            'active': self.active,
        }


class Quote(FirestoreModel):
    collection = 'quotes'
    """Quote (orcamento) with items, discount, validity and lifecycle."""
    def _transition(self, new_status):
        current = QuoteStatus.from_value(self.status)
        target = QuoteStatus.from_value(new_status)
        allowed = QUOTE_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise QuoteError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, user_id, client_id, items, discount=0.0, valid_until=None):
        if not items:
            raise ValidationError('Orçamento deve ter pelo menos um item')
        total = sum(i['price'] * i.get('quantity', 1) for i in items)
        total -= discount
        if isinstance(valid_until, str):
            valid_until = date.fromisoformat(valid_until)
        return cls(
            user_id=user_id,
            client_id=client_id,
            items_json=json.dumps(items),
            discount=discount,
            total=total,
            status=QuoteStatus.DRAFT.value,
            valid_until=valid_until,
            comments_json='[]',
            converted_to=None,
        )

    @property
    def items(self):
        return json.loads(self.items_json or '[]')

    def send(self):
        self._transition(QuoteStatus.SENT.value)

    def approve(self):
        self._transition(QuoteStatus.APPROVED.value)

    def reject(self, comment=''):
        self._transition(QuoteStatus.REJECTED.value)
        if comment:
            self.add_comment(comment)

    def expire(self):
        self._transition(QuoteStatus.EXPIRED.value)

    def convert(self, target='appointment'):
        self._transition(QuoteStatus.CONVERTED.value)
        self.converted_to = target

    def cancel(self):
        self._transition(QuoteStatus.CANCELLED.value)

    def add_comment(self, comment):
        comments = json.loads(self.comments_json or '[]')
        comments.append({
            'comment': comment,
            'at': datetime.utcnow().isoformat(),
        })
        self.comments_json = json.dumps(comments)

    def get_comments(self):
        return json.loads(self.comments_json or '[]')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'items': self.items,
            'discount': self.discount,
            'total': self.total,
            'status': self.status,
            'statusLabel': QuoteStatus.from_value(self.status).label,
            'validUntil': self.valid_until.isoformat() if self.valid_until else None,
            'comments': self.get_comments(),
            'convertedTo': self.converted_to,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Contract(FirestoreModel):
    collection = 'contracts'
    """Contract with electronic signature and versioning."""
    def _transition(self, new_status):
        current = ContractStatus.from_value(self.status)
        target = ContractStatus.from_value(new_status)
        allowed = CONTRACT_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise DocumentError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, user_id, client_id, title, body, template_id=None,
               variables=None):
        if not title or not title.strip():
            raise ValidationError('Título do contrato é obrigatório')
        return cls(
            user_id=user_id,
            client_id=client_id,
            template_id=template_id,
            title=title.strip(),
            body=body or '',
            variables_json=json.dumps(variables or {}),
            version=1,
            status=ContractStatus.DRAFT.value,
            signature_status=SignatureStatus.PENDING.value,
            signed_ip=None,
            signed_at=None,
            parent_id=None,
        )

    def send(self):
        self._transition(ContractStatus.SENT.value)

    def sign(self, ip, user_agent):
        self._transition(ContractStatus.SIGNED.value)
        self.signed_ip = ip
        self.signed_user_agent = user_agent
        self.signed_at = datetime.utcnow()
        self.signature_status = SignatureStatus.SIGNED.value

    def activate(self):
        self._transition(ContractStatus.ACTIVE.value)

    def terminate(self):
        self._transition(ContractStatus.TERMINATED.value)

    def cancel(self):
        self._transition(ContractStatus.CANCELLED.value)

    def new_version(self, body=None, variables=None):
        """Create a new version of this contract."""
        return Contract(
            user_id=self.user_id,
            client_id=self.client_id,
            template_id=self.template_id,
            title=self.title,
            body=body or self.body,
            variables_json=json.dumps(variables or json.loads(self.variables_json or '{}')),
            version=self.version + 1,
            status=ContractStatus.DRAFT.value,
            signature_status=SignatureStatus.PENDING.value,
            signed_ip=None,
            signed_at=None,
            parent_id=self.id,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'clientId': self.client_id,
            'templateId': self.template_id,
            'title': self.title,
            'body': self.body,
            'variables': json.loads(self.variables_json or '{}'),
            'version': self.version,
            'status': self.status,
            'statusLabel': ContractStatus.from_value(self.status).label,
            'signedIp': self.signed_ip,
            'signedAt': self.signed_at.isoformat() if self.signed_at else None,
            'signatureStatus': self.signature_status,
            'parentId': self.parent_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class CheckInOut(FirestoreModel):
    collection = 'check_in_outs'
    """Check-in/check-out record for appointments."""
    @classmethod
    def create(cls, appointment_id, user_id, check_type,
               lat=None, lng=None, consent_given=False):
        type_enum = CheckType.from_value(check_type)
        if lat is not None and lng is not None and not consent_given:
            raise ValidationError('Consentimento de localização é obrigatório')
        return cls(
            appointment_id=appointment_id,
            user_id=user_id,
            check_type=type_enum.value,
            lat=lat,
            lng=lng,
            consent_given=consent_given,
            attachments_json='[]',
            status=None,
            checked_in_at=None,
            checked_out_at=None,
            observations=None,
        )

    def check_in(self):
        self.status = CheckStatus.CHECKED_IN.value
        self.checked_in_at = datetime.utcnow()

    def check_out(self):
        if self.status != CheckStatus.CHECKED_IN.value:
            raise HomeCareError('Check-out requer check-in prévio')
        self.status = CheckStatus.CHECKED_OUT.value
        self.checked_out_at = datetime.utcnow()

    def mark_no_show(self):
        self.status = CheckStatus.NO_SHOW.value

    def add_attachment(self, url):
        attachments = json.loads(self.attachments_json or '[]')
        attachments.append({'url': url, 'at': datetime.utcnow().isoformat()})
        self.attachments_json = json.dumps(attachments)

    def get_attachments(self):
        return json.loads(self.attachments_json or '[]')

    def add_observation(self, text):
        self.observations = text

    def to_dict(self):
        return {
            'id': self.id,
            'appointmentId': self.appointment_id,
            'userId': self.user_id,
            'checkType': self.check_type,
            'checkTypeLabel': CheckType.from_value(self.check_type).label,
            'status': self.status,
            'statusLabel': CheckStatus.from_value(self.status).label,
            'lat': self.lat,
            'lng': self.lng,
            'consentGiven': self.consent_given,
            'observations': self.observations,
            'attachments': self.get_attachments(),
            'checkedInAt': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'checkedOutAt': self.checked_out_at.isoformat() if self.checked_out_at else None,
        }


class Workflow(FirestoreModel):
    collection = 'workflows'
    """Workflow definition with triggers, conditions and actions."""
    @classmethod
    def create(cls, user_id, name, trigger, description=''):
        if not name or not name.strip():
            raise ValidationError('Nome do workflow é obrigatório')
        trigger_enum = WorkflowTriggerType.from_value(trigger)
        return cls(
            user_id=user_id,
            name=name.strip(),
            description=description or '',
            trigger=trigger_enum.value,
            actions_json='[]',
            conditions_json='[]',
            status=WorkflowStatus.DRAFT.value,
            execution_count=0,
            max_executions_per_hour=100,
        )

    def add_action(self, action_type, params=None):
        action_enum = WorkflowActionType.from_value(action_type)
        actions = json.loads(self.actions_json or '[]')
        actions.append({
            'type': action_enum.value,
            'params': params or {},
        })
        self.actions_json = json.dumps(actions)

    def add_condition(self, condition_type, params=None):
        cond_enum = WorkflowConditionType.from_value(condition_type)
        conditions = json.loads(self.conditions_json or '[]')
        conditions.append({
            'type': cond_enum.value,
            'params': params or {},
        })
        self.conditions_json = json.dumps(conditions)

    def get_actions(self):
        return json.loads(self.actions_json or '[]')

    def get_conditions(self):
        return json.loads(self.conditions_json or '[]')

    def activate(self):
        self.status = WorkflowStatus.ACTIVE.value

    def pause(self):
        self.status = WorkflowStatus.PAUSED.value

    def archive(self):
        self.status = WorkflowStatus.ARCHIVED.value

    def validate(self):
        if not self.get_actions():
            raise WorkflowError('Workflow deve ter pelo menos uma ação')

    def record_execution(self):
        self.execution_count += 1

    def can_execute(self, max_per_hour=None):
        limit = max_per_hour or self.max_executions_per_hour
        return self.execution_count < limit

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'description': self.description,
            'trigger': self.trigger,
            'triggerLabel': WorkflowTriggerType.from_value(self.trigger).label,
            'actions': self.get_actions(),
            'conditions': self.get_conditions(),
            'status': self.status,
            'statusLabel': WorkflowStatus.from_value(self.status).label,
            'executionCount': self.execution_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class WorkflowExecution(FirestoreModel):
    collection = 'workflow_executions'
    """Record of a single workflow execution (audit trail)."""
    @classmethod
    def create(cls, workflow_id, trigger_data, idempotency_key=None):
        return cls(
            workflow_id=workflow_id,
            trigger_data_json=json.dumps(trigger_data or {}),
            status=WorkflowExecutionStatus.PENDING.value,
            idempotency_key=idempotency_key,
            error='',
            result_json=None,
            started_at=None,
            completed_at=None,
        )

    def start(self):
        self.status = WorkflowExecutionStatus.RUNNING.value
        self.started_at = datetime.utcnow()

    def complete(self, result=None):
        self.status = WorkflowExecutionStatus.COMPLETED.value
        self.result_json = json.dumps(result or {})
        self.completed_at = datetime.utcnow()

    def fail(self, error=''):
        self.status = WorkflowExecutionStatus.FAILED.value
        self.error = error
        self.completed_at = datetime.utcnow()

    def skip(self, reason=''):
        self.status = WorkflowExecutionStatus.SKIPPED.value
        self.error = reason
        self.completed_at = datetime.utcnow()

    @property
    def trigger_data(self):
        return json.loads(self.trigger_data_json or '{}')

    @property
    def result(self):
        return json.loads(self.result_json or '{}') if self.result_json else None

    def to_dict(self):
        return {
            'id': self.id,
            'workflowId': self.workflow_id,
            'triggerData': self.trigger_data,
            'status': self.status,
            'statusLabel': WorkflowExecutionStatus.from_value(self.status).label,
            'result': self.result,
            'error': self.error,
            'idempotencyKey': self.idempotency_key,
            'startedAt': self.started_at.isoformat() if self.started_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ===========================================================================
# Phase 7 — Subscriptions, Referrals, AI Multi-Agent
# ===========================================================================

class Subscription(FirestoreModel):
    collection = 'subscriptions'
    """Recurring subscription with auto-renew, suspend, cancel and retry."""
    def _transition(self, new_status):
        current = SubscriptionStatus.from_value(self.status)
        target = SubscriptionStatus.from_value(new_status)
        allowed = SUBSCRIPTION_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise SubscriptionError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, user_id, plan_name, amount, interval='monthly',
               trial_days=None, auto_renew=True):
        if not plan_name or not plan_name.strip():
            raise ValidationError('Nome do plano é obrigatório')
        if not amount or amount <= 0:
            raise ValidationError('Valor da assinatura deve ser maior que zero')
        status = SubscriptionStatus.TRIALING.value if trial_days else SubscriptionStatus.ACTIVE.value
        now = datetime.utcnow()
        trial_ends = now + timedelta(days=trial_days) if trial_days else None
        period_end = now + timedelta(days=30 if interval == 'monthly' else 365)
        return cls(
            user_id=user_id,
            plan_name=plan_name.strip(),
            amount=amount,
            interval=interval,
            auto_renew=auto_renew,
            status=status,
            trial_ends_at=trial_ends,
            current_period_start=now,
            current_period_end=period_end,
            next_billing_at=period_end,
            cancelled_at=None,
        )

    def suspend(self):
        self._transition(SubscriptionStatus.SUSPENDED.value)

    def cancel(self):
        self._transition(SubscriptionStatus.CANCELLED.value)
        self.cancelled_at = datetime.utcnow()
        self.auto_renew = False

    def reactivate(self):
        if self.status == SubscriptionStatus.CANCELLED.value:
            raise SubscriptionError('Assinatura cancelada não pode ser reativada')
        self._transition(SubscriptionStatus.ACTIVE.value)

    def mark_past_due(self):
        self._transition(SubscriptionStatus.PAST_DUE.value)

    def expire(self):
        self._transition(SubscriptionStatus.EXPIRED.value)

    def renew(self):
        now = datetime.utcnow()
        days = 30 if self.interval == 'monthly' else 365
        self.current_period_start = self.current_period_end or now
        self.current_period_end = now + timedelta(days=days)
        self.next_billing_at = self.current_period_end
        if self.status == SubscriptionStatus.PAST_DUE.value:
            self._transition(SubscriptionStatus.ACTIVE.value)

    def is_active(self):
        return self.status in (SubscriptionStatus.ACTIVE.value, SubscriptionStatus.TRIALING.value)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'planName': self.plan_name,
            'amount': self.amount,
            'interval': self.interval,
            'autoRenew': self.auto_renew,
            'status': self.status,
            'statusLabel': SubscriptionStatus.from_value(self.status).label,
            'trialEndsAt': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'currentPeriodStart': self.current_period_start.isoformat() if self.current_period_start else None,
            'currentPeriodEnd': self.current_period_end.isoformat() if self.current_period_end else None,
            'nextBillingAt': self.next_billing_at.isoformat() if self.next_billing_at else None,
            'cancelledAt': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Billing(FirestoreModel):
    collection = 'billings'
    """Billing record for a subscription cycle."""
    @classmethod
    def create(cls, subscription_id, amount, max_retries=3):
        return cls(
            subscription_id=subscription_id,
            amount=amount,
            status=BillingStatus.PENDING.value,
            retry_count=0,
            max_retries=max_retries,
            paid_at=None,
        )

    def mark_paid(self):
        self.status = BillingStatus.PAID.value
        self.paid_at = datetime.utcnow()

    def mark_failed(self):
        self.status = BillingStatus.FAILED.value

    def retry(self):
        if self.retry_count >= self.max_retries:
            raise SubscriptionError('Número máximo de retentativas atingido')
        self.retry_count += 1
        self.status = BillingStatus.RETRYING.value

    def refund(self):
        self.status = BillingStatus.REFUNDED.value

    def to_dict(self):
        return {
            'id': self.id,
            'subscriptionId': self.subscription_id,
            'amount': self.amount,
            'status': self.status,
            'statusLabel': BillingStatus.from_value(self.status).label,
            'retryCount': self.retry_count,
            'maxRetries': self.max_retries,
            'paidAt': self.paid_at.isoformat() if self.paid_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Referral(FirestoreModel):
    collection = 'referrals'
    """Referral with code, link, conversion tracking and rewards."""
    def _transition(self, new_status):
        current = ReferralStatus.from_value(self.status)
        target = ReferralStatus.from_value(new_status)
        allowed = REFERRAL_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ReferralError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, referrer_id, referred_email, reward_amount=0.0,
               referrer_email=None):
        if not referred_email or not referred_email.strip():
            raise ValidationError('E-mail do indicado é obrigatório')
        if referrer_email and referrer_email == referred_email:
            raise ValidationError('Não é possível indicar a si mesmo')
        code = secrets.token_urlsafe(8)
        return cls(
            referrer_id=referrer_id,
            referred_email=referred_email.strip(),
            code=code,
            status=ReferralStatus.PENDING.value,
            reward_amount=reward_amount,
            referred_user_id=None,
            rewarded_at=None,
            converted_at=None,
        )

    def register(self, referred_user_id):
        self._transition(ReferralStatus.REGISTERED.value)
        self.referred_user_id = referred_user_id

    def convert(self):
        self._transition(ReferralStatus.CONVERTED.value)
        self.converted_at = datetime.utcnow()

    def reward(self):
        self._transition(ReferralStatus.REWARDED.value)
        self.rewarded_at = datetime.utcnow()

    def expire(self):
        self._transition(ReferralStatus.EXPIRED.value)

    def get_link(self, base_url='https://profissional-os.com'):
        return f'{base_url}/ref/{self.code}'

    def to_dict(self):
        return {
            'id': self.id,
            'referrerId': self.referrer_id,
            'referredEmail': self.referred_email,
            'referredUserId': self.referred_user_id,
            'code': self.code,
            'link': self.get_link(),
            'status': self.status,
            'statusLabel': ReferralStatus.from_value(self.status).label,
            'rewardAmount': self.reward_amount,
            'rewardedAt': self.rewarded_at.isoformat() if self.rewarded_at else None,
            'convertedAt': self.converted_at.isoformat() if self.converted_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class AgentConfig(FirestoreModel):
    collection = 'agent_configs'
    """Per-user configuration for an AI agent."""
    @classmethod
    def create(cls, user_id, agent_type, monthly_cost_limit=100.0,
               monthly_usage_limit=10000, auto_approve=False, consent_given=False):
        type_enum = AgentType.from_value(agent_type)
        return cls(
            user_id=user_id,
            agent_type=type_enum.value,
            status=AgentStatus.DISABLED.value,
            monthly_cost_limit=monthly_cost_limit,
            monthly_usage_limit=monthly_usage_limit,
            current_month_cost=0.0,
            current_month_usage=0,
            auto_approve=auto_approve,
            consent_given=consent_given,
        )

    def enable(self):
        self.status = AgentStatus.ENABLED.value

    def disable(self):
        self.status = AgentStatus.DISABLED.value

    def pause(self):
        self.status = AgentStatus.PAUSED.value

    def can_spend(self, cost):
        return (self.current_month_cost or 0) + cost <= self.monthly_cost_limit

    def can_use(self, tokens):
        return (self.current_month_usage or 0) + tokens <= self.monthly_usage_limit

    def record_usage(self, cost=0.0, tokens=0):
        self.current_month_cost = (self.current_month_cost or 0) + cost
        self.current_month_usage = (self.current_month_usage or 0) + tokens

    def requires_human_approval(self):
        type_enum = AgentType.from_value(self.agent_type)
        return type_enum.requires_human_approval and not self.auto_approve

    def to_dict(self):
        type_enum = AgentType.from_value(self.agent_type)
        return {
            'id': self.id,
            'userId': self.user_id,
            'agentType': self.agent_type,
            'agentTypeLabel': type_enum.label,
            'status': self.status,
            'statusLabel': AgentStatus.from_value(self.status).label,
            'monthlyCostLimit': self.monthly_cost_limit,
            'monthlyUsageLimit': self.monthly_usage_limit,
            'currentMonthCost': self.current_month_cost,
            'currentMonthUsage': self.current_month_usage,
            'autoApprove': self.auto_approve,
            'consentGiven': self.consent_given,
            'requiresHumanApproval': self.requires_human_approval(),
        }


class AgentExecution(FirestoreModel):
    collection = 'agent_executions'
    """Audit record of a single AI agent execution — prompts, responses, actions."""
    @classmethod
    def create(cls, user_id, agent_type, prompt):
        type_enum = AgentType.from_value(agent_type)
        return cls(
            user_id=user_id,
            agent_type=type_enum.value,
            prompt=prompt,
            status='pending',
            response=None,
            tokens_used=0,
            cost=0.0,
            error=None,
            completed_at=None,
            action_json=None,
        )

    def set_response(self, response, tokens_used=0, cost=0.0):
        self.response = response
        self.tokens_used = tokens_used
        self.cost = cost
        self.status = 'completed'
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error=''):
        self.status = 'failed'
        self.error = error
        self.completed_at = datetime.utcnow()

    def set_action(self, action_type, payload=None, requires_approval=True):
        if not requires_approval:
            status = AgentActionStatus.EXECUTED.value
        else:
            status = AgentActionStatus.PENDING.value
        action = {
            'type': action_type,
            'payload': payload or {},
            'status': status,
            'requiresApproval': requires_approval,
            'setAt': datetime.utcnow().isoformat(),
        }
        self.action_json = json.dumps(action)
        return action

    def get_action(self):
        if not self.action_json:
            return None
        return json.loads(self.action_json)

    def has_pending_action(self):
        action = self.get_action()
        return action is not None and action.get('status') == AgentActionStatus.PENDING.value

    def approve_action(self):
        action = self.get_action()
        if not action or action.get('status') != AgentActionStatus.PENDING.value:
            raise AIAgentError('Nenhuma ação pendente para aprovar')
        action['status'] = AgentActionStatus.APPROVED.value
        action['approvedAt'] = datetime.utcnow().isoformat()
        self.action_json = json.dumps(action)

    def reject_action(self):
        action = self.get_action()
        if not action or action.get('status') != AgentActionStatus.PENDING.value:
            raise AIAgentError('Nenhuma ação pendente para rejeitar')
        action['status'] = AgentActionStatus.REJECTED.value
        action['rejectedAt'] = datetime.utcnow().isoformat()
        self.action_json = json.dumps(action)

    @property
    def is_ai_generated(self):
        return True

    def to_dict(self):
        type_enum = AgentType.from_value(self.agent_type)
        return {
            'id': self.id,
            'userId': self.user_id,
            'agentType': self.agent_type,
            'agentTypeLabel': type_enum.label,
            'prompt': self.prompt,
            'response': self.response,
            'status': self.status,
            'tokensUsed': self.tokens_used,
            'cost': self.cost,
            'error': self.error,
            'action': self.get_action(),
            'aiGenerated': self.is_ai_generated,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
        }


# ===========================================================================
# Phase 8 — Administration, Public API, Observability, LGPD
# ===========================================================================

class AuditLog(FirestoreModel):
    collection = 'audit_logs'
    """Audit trail for all administrative and critical actions."""
    @classmethod
    def create(cls, admin_id, action, target_user_id=None, target_type=None,
               target_id=None, details='', ip_address=None, user_agent=None):
        if not action or not action.strip():
            raise ValidationError('Ação de auditoria é obrigatória')
        return cls(
            admin_id=admin_id,
            action=action.strip(),
            target_user_id=target_user_id,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def to_dict(self):
        return {
            'id': self.id,
            'adminId': self.admin_id,
            'action': self.action,
            'actionLabel': AuditActionType.from_value(self.action).label
                if self.action in [e.value for e in AuditActionType] else self.action,
            'targetUserId': self.target_user_id,
            'targetType': self.target_type,
            'targetId': self.target_id,
            'details': self.details,
            'ipAddress': self.ip_address,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class ApiKey(FirestoreModel):
    collection = 'api_keys'
    """API key for public API access with scoped permissions."""
    @classmethod
    def create(cls, user_id, name, scopes=None, expires_at=None):
        if not name or not name.strip():
            raise ValidationError('Nome da chave de API é obrigatório')
        raw_key = f'pos_{secrets.token_urlsafe(32)}'
        return cls(
            user_id=user_id,
            name=name.strip(),
            key=raw_key,
            key_hash=secrets.token_urlsafe(16),
            scopes_json=json.dumps(scopes or []),
            status=ApiKeyStatus.ACTIVE.value,
            expires_at=expires_at,
            revoked_at=None,
            last_used_at=None,
        )

    @property
    def scopes(self):
        return json.loads(self.scopes_json or '[]')

    def has_scope(self, scope):
        return '*' in self.scopes or scope in self.scopes

    def revoke(self):
        self.status = ApiKeyStatus.REVOKED.value
        self.revoked_at = datetime.utcnow()

    def is_valid(self):
        if self.status != ApiKeyStatus.ACTIVE.value:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def record_usage(self):
        self.last_used_at = datetime.utcnow()

    def to_dict(self, include_key=False):
        d = {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'scopes': self.scopes,
            'status': self.status,
            'statusLabel': ApiKeyStatus.from_value(self.status).label,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'revokedAt': self.revoked_at.isoformat() if self.revoked_at else None,
            'lastUsedAt': self.last_used_at.isoformat() if self.last_used_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
        if include_key:
            d['key'] = self.key
        return d


class Webhook(FirestoreModel):
    collection = 'webhooks'
    """Webhook endpoint for external integrations."""
    @classmethod
    def create(cls, user_id, url, events=None, secret=None):
        if not url or not url.strip():
            raise ValidationError('URL do webhook é obrigatória')
        if not url.startswith(('http://', 'https://')):
            raise ValidationError('URL do webhook deve começar com http:// ou https://')
        return cls(
            user_id=user_id,
            url=url.strip(),
            events_json=json.dumps(events or []),
            secret=secret or secrets.token_urlsafe(16),
            status=WebhookStatus.ACTIVE.value,
            delivery_count=0,
            success_count=0,
            failure_count=0,
            last_delivery_at=None,
            last_status_code=None,
        )

    @property
    def events(self):
        return json.loads(self.events_json or '[]')

    def matches_event(self, event):
        return event in self.events or '*' in self.events

    def disable(self):
        self.status = WebhookStatus.DISABLED.value

    def mark_failing(self):
        self.status = WebhookStatus.FAILING.value

    def record_delivery(self, status_code, success=True):
        self.delivery_count = (self.delivery_count or 0) + 1
        if success:
            self.success_count = (self.success_count or 0) + 1
        else:
            self.failure_count = (self.failure_count or 0) + 1
        self.last_delivery_at = datetime.utcnow()
        self.last_status_code = status_code
        if not success and self.failure_count > 5:
            self.mark_failing()

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'url': self.url,
            'events': self.events,
            'status': self.status,
            'statusLabel': WebhookStatus.from_value(self.status).label,
            'deliveryCount': self.delivery_count,
            'successCount': self.success_count,
            'failureCount': self.failure_count,
            'lastDeliveryAt': self.last_delivery_at.isoformat() if self.last_delivery_at else None,
            'lastStatusCode': self.last_status_code,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class DataRequest(FirestoreModel):
    collection = 'data_requests'
    """LGPD data request — export, correction, deletion, portability."""
    def _transition(self, new_status):
        current = DataRequestStatus.from_value(self.status)
        target = DataRequestStatus.from_value(new_status)
        allowed = DATA_REQUEST_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise LgpdError(
                f'Transição inválida: {current.label} → {target.label}')
        self.status = target.value

    @classmethod
    def create(cls, user_id, request_type):
        type_enum = DataRequestType.from_value(request_type)
        return cls(
            user_id=user_id,
            request_type=type_enum.value,
            status=DataRequestStatus.PENDING.value,
            result_url=None,
            rejection_reason=None,
            processed_by=None,
            processing_at=None,
            completed_at=None,
        )

    def start_processing(self):
        self._transition(DataRequestStatus.PROCESSING.value)
        self.processing_at = datetime.utcnow()

    def complete(self, result_url=None):
        if self.status != DataRequestStatus.PROCESSING.value:
            raise LgpdError('Solicitação deve estar em processamento para ser concluída')
        self._transition(DataRequestStatus.COMPLETED.value)
        self.result_url = result_url
        self.completed_at = datetime.utcnow()

    def reject(self, reason=''):
        self._transition(DataRequestStatus.REJECTED.value)
        self.rejection_reason = reason
        self.completed_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'requestType': self.request_type,
            'requestTypeLabel': DataRequestType.from_value(self.request_type).label,
            'status': self.status,
            'statusLabel': DataRequestStatus.from_value(self.status).label,
            'resultUrl': self.result_url,
            'rejectionReason': self.rejection_reason,
            'processedBy': self.processed_by,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'processingAt': self.processing_at.isoformat() if self.processing_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
        }


class FeatureFlag(FirestoreModel):
    collection = 'feature_flags'
    """Feature flag for configurable feature toggles."""
    @classmethod
    def create(cls, key, enabled=False, description=None, rollout_percentage=100):
        if not key or not key.strip():
            raise ValidationError('Chave da feature flag é obrigatória')
        return cls(
            key=key.strip(),
            enabled=enabled,
            description=description,
            rollout_percentage=rollout_percentage,
            updated_at=None,
        )

    def toggle(self):
        self.enabled = not self.enabled

    def is_enabled(self):
        return self.enabled

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'enabled': self.enabled,
            'description': self.description,
            'rolloutPercentage': self.rollout_percentage,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class RateLimitEntry(FirestoreModel):
    collection = 'rate_limit_entrys'
    """Rate limit entry for persistent rate limiting (SQLite fallback when Redis unavailable).

    In production, use Redis. This model provides a persistent store that survives
    server restarts and works across multiple workers sharing the same database.
    """
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'timestamp': self.timestamp,
        }
