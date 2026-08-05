"""Value Objects.

Immutable, self-validating concepts of the domain. They remove primitive
obsession (raw floats/strings) and centralize validation and formatting.
"""
import re

from domain.exceptions import ValidationError

_EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


class Money:
    """A non-negative monetary amount in BRL, rounded to cents."""

    __slots__ = ('amount',)

    def __init__(self, amount):
        try:
            value = round(float(amount), 2)
        except (TypeError, ValueError):
            raise ValidationError('Valor monetário inválido')
        if value < 0:
            raise ValidationError('Valor não pode ser negativo')
        object.__setattr__(self, 'amount', value)

    def __setattr__(self, key, value):
        raise AttributeError('Money is immutable')

    def add(self, other):
        return Money(self.amount + other.amount)

    def subtract(self, other):
        return Money(max(self.amount - other.amount, 0))

    def is_zero(self):
        return self.amount == 0

    def to_float(self):
        return self.amount

    def formatted(self):
        return f'R$ {self.amount:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

    def __eq__(self, other):
        return isinstance(other, Money) and other.amount == self.amount

    def __repr__(self):
        return f'Money({self.amount})'


class Email:
    """A validated e-mail address (optional/empty allowed for contacts)."""

    __slots__ = ('value',)

    def __init__(self, value):
        value = (value or '').strip()
        if value and not _EMAIL_RE.match(value):
            raise ValidationError('E-mail inválido')
        object.__setattr__(self, 'value', value)

    def __setattr__(self, key, value):
        raise AttributeError('Email is immutable')

    def is_empty(self):
        return self.value == ''

    def __str__(self):
        return self.value


class Duration:
    """A positive duration in minutes."""

    __slots__ = ('minutes',)

    def __init__(self, minutes):
        try:
            value = int(minutes)
        except (TypeError, ValueError):
            raise ValidationError('Duração deve ser um número válido')
        if value <= 0:
            raise ValidationError('Duração deve ser maior que zero')
        object.__setattr__(self, 'minutes', value)

    def __setattr__(self, key, value):
        raise AttributeError('Duration is immutable')

    def to_int(self):
        return self.minutes

    def formatted(self):
        if self.minutes >= 60:
            hours, mins = divmod(self.minutes, 60)
            return f'{hours}h{mins:02d}min' if mins else f'{hours}h'
        return f'{self.minutes} min'
