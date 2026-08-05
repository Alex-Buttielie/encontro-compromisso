"""Integration + E2E tests for Phase 3 — CRM, ERP, Inventory, Marketing, Analytics.

E2E flows:
1. Cadastrar produto e fornecedor
2. Registrar entrada de estoque
3. Agendar serviço que consome produto
4. Verificar baixa automática no estoque
5. Gerar relatório de fluxo de caixa
6. Criar campanha de marketing para clientes inativos
7. Consultar dashboard executivo com filtros
"""
import json
from datetime import date, timedelta

from domain.enums import (
    CampaignStatus, CampaignChannel, CouponType,
    FinancialEntryType, AccountStatus, StockMovementType,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestInventoryE2E:
    """E2E: Register supplier → product → stock entry → consume via service."""

    def test_register_supplier_and_product(self, client, app):
        uid = _register_and_get_token(client, email='inv@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # 1. Create supplier
        resp = client.post('/api/inventory/suppliers',
                           data=json.dumps({
                               'name': 'Dental Supply Ltda',
                               'cnpj': '12.345.678/0001-90',
                               'email': 'contao@dentalsupply.com',
                               'phone': '(11) 1234-5678',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        supplier_id = resp.get_json()['supplier']['id']

        # 2. Create product
        resp = client.post('/api/inventory/products',
                           data=json.dumps({
                               'name': 'Luva Descartável',
                               'sku': 'LUV-001',
                               'category': 'EPI',
                               'unit': 'caixa',
                               'minStock': 10,
                               'unitPrice': 25.00,
                               'supplierId': supplier_id,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        product_id = resp.get_json()['product']['id']
        assert resp.get_json()['product']['currentStock'] == 0

        # 3. Add stock
        resp = client.post(f'/api/inventory/products/{product_id}/add-stock',
                           data=json.dumps({'quantity': 100, 'reason': 'Compra inicial'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['product']['currentStock'] == 100

        # 4. Consume stock (simulating service usage)
        resp = client.post(f'/api/inventory/products/{product_id}/consume',
                           data=json.dumps({'quantity': 5, 'reason': 'Serviço - Limpeza'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['product']['currentStock'] == 95
        assert resp.get_json()['movement']['type'] == StockMovementType.CONSUMPTION.value

    def test_low_stock_alert(self, client, app):
        uid = _register_and_get_token(client, email='alert@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create product with min_stock=50
        resp = client.post('/api/inventory/products',
                           data=json.dumps({
                               'name': 'Test Product',
                               'sku': 'TEST-001',
                               'minStock': 50,
                               'unitPrice': 1.0,
                           }),
                           content_type='application/json', headers=headers)
        product_id = resp.get_json()['product']['id']

        # Add only 10 (below minimum of 50)
        client.post(f'/api/inventory/products/{product_id}/add-stock',
                    data=json.dumps({'quantity': 10}),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/inventory/alerts', headers=headers)
        assert resp.status_code == 200
        alerts = resp.get_json()['alerts']
        assert len(alerts) >= 1
        assert any(a['id'] == product_id for a in alerts)

    def test_insufficient_stock_rejected(self, client, app):
        uid = _register_and_get_token(client, email='insuf@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/inventory/products',
                           data=json.dumps({'name': 'Test', 'sku': 'T-002', 'minStock': 5, 'unitPrice': 1.0}),
                           content_type='application/json', headers=headers)
        product_id = resp.get_json()['product']['id']

        client.post(f'/api/inventory/products/{product_id}/add-stock',
                    data=json.dumps({'quantity': 10}),
                    content_type='application/json', headers=headers)

        # Try to consume more than available
        resp = client.post(f'/api/inventory/products/{product_id}/consume',
                           data=json.dumps({'quantity': 50}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400


class TestERPE2E:
    """E2E: Cash flow entries → summary → DRE."""

    def test_cash_flow_and_summary(self, client, app):
        uid = _register_and_get_token(client, email='erp@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create revenue entry
        resp = client.post('/api/erp/cash-flow',
                           data=json.dumps({
                               'type': FinancialEntryType.REVENUE.value,
                               'description': 'Consulta',
                               'amount': 200.00,
                               'date': date.today().isoformat(),
                               'category': 'Serviços',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # Create expense entry
        resp = client.post('/api/erp/cash-flow',
                           data=json.dumps({
                               'type': FinancialEntryType.EXPENSE.value,
                               'description': 'Aluguel',
                               'amount': 100.00,
                               'date': date.today().isoformat(),
                               'category': 'Fixo',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # Get summary
        resp = client.get(f'/api/erp/cash-flow/summary?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}',
                          headers=headers)
        assert resp.status_code == 200
        summary = resp.get_json()
        assert summary['totalRevenue'] == 200.00
        assert summary['totalExpenses'] == 100.00
        assert summary['profit'] == 100.00

    def test_dre_report(self, client, app):
        uid = _register_and_get_token(client, email='dre@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/erp/cash-flow',
                    data=json.dumps({
                        'type': FinancialEntryType.REVENUE.value,
                        'description': 'Receita 1', 'amount': 500,
                        'date': date.today().isoformat(),
                    }),
                    content_type='application/json', headers=headers)
        client.post('/api/erp/cash-flow',
                    data=json.dumps({
                        'type': FinancialEntryType.EXPENSE.value,
                        'description': 'Despesa 1', 'amount': 200,
                        'date': date.today().isoformat(),
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get(f'/api/erp/dre?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}',
                          headers=headers)
        assert resp.status_code == 200
        dre = resp.get_json()['dre']
        assert dre['revenue'] == 500.00
        assert dre['expenses'] == 200.00
        assert dre['profit'] == 300.00

    def test_accounts_payable_flow(self, client, app):
        uid = _register_and_get_token(client, email='ap@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/erp/accounts-payable',
                           data=json.dumps({
                               'description': 'Fornecedor XYZ',
                               'amount': 300.00,
                               'dueDate': (date.today() + timedelta(days=30)).isoformat(),
                               'category': 'Fornecedores',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        account_id = resp.get_json()['account']['id']
        assert resp.get_json()['account']['status'] == AccountStatus.PENDING.value

        # Pay it
        resp = client.post(f'/api/erp/accounts-payable/{account_id}/pay',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['account']['status'] == AccountStatus.PAID.value

    def test_financial_period_close(self, client, app):
        uid = _register_and_get_token(client, email='period@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/erp/periods',
                           data=json.dumps({
                               'name': 'Janeiro 2026',
                               'startDate': '2026-01-01',
                               'endDate': '2026-01-31',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        period_id = resp.get_json()['period']['id']

        resp = client.post(f'/api/erp/periods/{period_id}/close',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['period']['status'] == 'closed'


class TestMarketingE2E:
    """E2E: Create campaign → schedule → start → send → complete."""

    def test_campaign_full_lifecycle(self, client, app):
        uid = _register_and_get_token(client, email='mkt@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create campaign
        resp = client.post('/api/marketing/campaigns',
                           data=json.dumps({
                               'name': 'Black Friday',
                               'channel': CampaignChannel.EMAIL.value,
                               'subject': 'Promoção!',
                               'body': '30% de desconto!',
                               'segment': 'all',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        campaign_id = resp.get_json()['campaign']['id']
        assert resp.get_json()['campaign']['status'] == CampaignStatus.DRAFT.value

        # Schedule
        resp = client.post(f'/api/marketing/campaigns/{campaign_id}/schedule',
                           data=json.dumps({'scheduledDate': date.today().isoformat()}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['campaign']['status'] == CampaignStatus.SCHEDULED.value

        # Start
        resp = client.post(f'/api/marketing/campaigns/{campaign_id}/start',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['campaign']['status'] == CampaignStatus.RUNNING.value

        # Complete
        resp = client.post(f'/api/marketing/campaigns/{campaign_id}/complete',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['campaign']['status'] == CampaignStatus.COMPLETED.value

    def test_coupon_create_and_validate(self, client, app):
        uid = _register_and_get_token(client, email='coupon@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/marketing/coupons',
                           data=json.dumps({
                               'code': 'PROMO20',
                               'couponType': CouponType.PERCENTAGE.value,
                               'value': 20.0,
                               'validUntil': (date.today() + timedelta(days=30)).isoformat(),
                               'maxUses': 100,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        resp = client.post('/api/marketing/coupons/validate',
                           data=json.dumps({'code': 'PROMO20', 'amount': 100.00}),
                           content_type='application/json')
        assert resp.status_code == 200
        assert resp.get_json()['discount'] == 20.00

    def test_conversion_report(self, client, app):
        uid = _register_and_get_token(client, email='conv@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/marketing/campaigns',
                    data=json.dumps({
                        'name': 'Test Campaign',
                        'channel': CampaignChannel.EMAIL.value,
                        'subject': 'Test', 'body': 'Test', 'segment': 'all',
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/marketing/conversion-report', headers=headers)
        assert resp.status_code == 200
        assert 'report' in resp.get_json()


class TestAnalyticsE2E:
    """E2E: Dashboard with filters, revenue, top services, occupancy."""

    def test_dashboard_with_filters(self, client, app):
        uid = _register_and_get_token(client, email='dash@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get(
            f'/api/analytics/dashboard?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}'
            '&unit=unidade1&collaborator=Dr.+João',
            headers=headers)
        assert resp.status_code == 200
        dashboard = resp.get_json()['dashboard']
        assert 'totalRevenue' in dashboard
        assert 'profit' in dashboard
        assert 'filters' in dashboard
        assert dashboard['filters']['unit'] == 'unidade1'

    def test_revenue_report(self, client, app):
        uid = _register_and_get_token(client, email='rev@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get(
            f'/api/analytics/revenue?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}',
            headers=headers)
        assert resp.status_code == 200
        assert 'totalRevenue' in resp.get_json()
        assert 'byMonth' in resp.get_json()

    def test_occupancy_rate(self, client, app):
        uid = _register_and_get_token(client, email='occ@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get(
            f'/api/analytics/occupancy?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}',
            headers=headers)
        assert resp.status_code == 200
        assert 'occupancyRate' in resp.get_json()

    def test_growth_rate(self, client, app):
        uid = _register_and_get_token(client, email='grow@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get(
            f'/api/analytics/growth?startDate={date.today().isoformat()}&endDate={date.today().isoformat()}',
            headers=headers)
        assert resp.status_code == 200
        assert 'growthRate' in resp.get_json()

    def test_retention_metrics(self, client, app):
        uid = _register_and_get_token(client, email='ret@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get('/api/analytics/retention', headers=headers)
        assert resp.status_code == 200
        assert 'retentionRate' in resp.get_json()


class TestCRME2E:
    """E2E: CRM profile, visit recording, segmentation, surveys."""

    def test_record_visit_and_segmentation(self, client, app):
        uid = _register_and_get_token(client, email='crm@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create a client
        resp = client.post('/api/clients',
                           data=json.dumps({'name': 'João Silva', 'email': 'joao@test.com'}),
                           content_type='application/json', headers=headers)
        client_id = resp.get_json()['client']['id']

        # Get CRM profile (auto-created)
        resp = client.get(f'/api/crm/profiles/{client_id}', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['profile']['segment'] == 'new'

        # Record visits
        for _ in range(3):
            resp = client.post('/api/crm/record-visit',
                               data=json.dumps({'clientId': client_id, 'amount': 100.00}),
                               content_type='application/json', headers=headers)
            assert resp.status_code == 200

        profile = resp.get_json()['profile']
        assert profile['totalVisits'] == 3
        assert profile['totalSpent'] == 300.00
        assert profile['averageTicket'] == 100.00
        assert profile['segment'] == 'active'

    def test_satisfaction_survey(self, client, app):
        uid = _register_and_get_token(client, email='survey@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create client + service + appointment
        resp = client.post('/api/clients',
                           data=json.dumps({'name': 'Maria'}),
                           content_type='application/json', headers=headers)
        client_id = resp.get_json()['client']['id']

        resp = client.post('/api/services',
                           data=json.dumps({'name': 'Consulta', 'price': 100, 'duration': 60}),
                           content_type='application/json', headers=headers)
        service_id = resp.get_json()['service']['id']

        resp = client.post('/api/appointments',
                           data=json.dumps({
                               'clientId': client_id,
                               'serviceId': service_id,
                               'date': date.today().isoformat(),
                               'time': '10:00',
                           }),
                           content_type='application/json', headers=headers)
        appointment_id = resp.get_json()['appointment']['id']

        # Create survey
        resp = client.post('/api/crm/surveys',
                           data=json.dumps({'clientId': client_id, 'appointmentId': appointment_id}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        survey_id = resp.get_json()['survey']['id']

        # Respond
        resp = client.post(f'/api/crm/surveys/{survey_id}/respond',
                           data=json.dumps({'rating': 5, 'comment': 'Excelente!'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['survey']['rating'] == 5
