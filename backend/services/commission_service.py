"""Commission application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.commission_repository import (
    CommissionRuleRepository, CommissionPaymentRepository,
)


class CommissionService:
    def __init__(self, rule_repo=None, payment_repo=None):
        self.rule_repo = rule_repo or CommissionRuleRepository()
        self.payment_repo = payment_repo or CommissionPaymentRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_rule(self, data):
        from models import CommissionRule
        try:
            rule = CommissionRule.create(
                user_id=data['userId'],
                employee_id=data['employeeId'],
                commission_type=data.get('commissionType'),
                value=data.get('value'),
                service_id=data.get('serviceId'),
                branch_id=data.get('branchId'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.rule_repo.add(rule)
        return {'success': True, 'rule': rule.to_dict()}

    def get_rules(self, user_id):
        rules = self.rule_repo.find_by_user_id(user_id)
        return [r.to_dict() for r in rules]

    def get_rules_by_employee(self, user_id, employee_id):
        rules = self.rule_repo.find_by_employee(user_id, employee_id)
        return [r.to_dict() for r in rules]

    def calculate_commission(self, user_id, employee_id, base_amount,
                             service_id=None, branch_id=None):
        """Find the best matching commission rule and calculate amount."""
        # Try service-specific rule first
        rule = None
        if service_id:
            rule = self.rule_repo.find_by_employee_and_service(
                user_id, employee_id, service_id)
        if not rule and branch_id:
            rule = self.rule_repo.find_by_employee_and_branch(
                user_id, employee_id, branch_id)
        if not rule:
            # Try general rule (no service, no branch)
            rules = self.rule_repo.find_by_employee(user_id, employee_id)
            rule = next((r for r in rules
                        if r.service_id is None and r.branch_id is None), None)
        if not rule:
            return {'success': True, 'commission': 0.0, 'rule': None}
        commission = rule.calculate(base_amount)
        return {'success': True, 'commission': commission, 'rule': rule.to_dict()}

    def create_payment(self, user_id, employee_id, amount, base_amount,
                       appointment_id=None, service_id=None):
        from models import CommissionPayment
        try:
            payment = CommissionPayment.create(
                user_id=user_id, employee_id=employee_id,
                amount=amount, base_amount=base_amount,
                appointment_id=appointment_id, service_id=service_id,
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.payment_repo.add(payment)
        return {'success': True, 'payment': payment.to_dict()}

    def mark_paid(self, payment_id):
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            return {'success': False, 'errors': ['Comissão não encontrada']}
        try:
            payment.mark_paid()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.payment_repo.save(payment)
        return {'success': True, 'payment': payment.to_dict()}

    def cancel_payment(self, payment_id):
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            return {'success': False, 'errors': ['Comissão não encontrada']}
        try:
            payment.cancel()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.payment_repo.save(payment)
        return {'success': True, 'payment': payment.to_dict()}

    def get_payments(self, user_id):
        payments = self.payment_repo.find_by_user_id(user_id)
        return [p.to_dict() for p in payments]

    def get_payments_by_employee(self, user_id, employee_id):
        payments = self.payment_repo.find_by_employee(user_id, employee_id)
        return [p.to_dict() for p in payments]

    def get_commission_report(self, user_id):
        """Report with paid and pending totals per employee."""
        from collections import defaultdict
        payments = self.payment_repo.find_by_user_id(user_id)
        report = defaultdict(lambda: {'paid': 0.0, 'pending': 0.0, 'count': 0})
        for p in payments:
            key = p.employee_id
            if p.status == 'paid':
                report[key]['paid'] += p.amount
            elif p.status == 'pending':
                report[key]['pending'] += p.amount
            report[key]['count'] += 1
        return [{
            'employeeId': emp_id,
            'paid': round(data['paid'], 2),
            'pending': round(data['pending'], 2),
            'total': round(data['paid'] + data['pending'], 2),
            'count': data['count'],
        } for emp_id, data in report.items()]

    def process_appointment_commission(self, user_id, employee_id, service_id,
                                       base_amount, appointment_id, branch_id=None):
        """Auto-calculate and create commission payment for an appointment."""
        result = self.calculate_commission(
            user_id, employee_id, base_amount, service_id, branch_id)
        if result['commission'] <= 0:
            return {'success': True, 'payment': None, 'commission': 0.0}
        payment_result = self.create_payment(
            user_id, employee_id, result['commission'], base_amount,
            appointment_id, service_id)
        payment_result['commission'] = result['commission']
        return payment_result
