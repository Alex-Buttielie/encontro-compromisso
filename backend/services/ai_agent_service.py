"""AI Agent service — multi-agent orchestration with mock LLM adapter.

Rules enforced:
- No irreversible financial actions without human approval.
- No automatic campaign sending without configurable authorization.
- Full audit trail of prompts, responses, decisions and actions.
- Cost and usage limits per agent per user per month.
- AI-generated responses are flagged.
- Tenant isolation: agents only access the user's own data.
"""
import json
from logger import get_logger
from domain.enums import AgentType, AgentActionStatus
from domain.exceptions import DomainError, AIAgentError
from repositories.phase7_repository import AgentConfigRepository, AgentExecutionRepository


class MockLLMAdapter:
    """Mock LLM adapter for testing — returns deterministic responses."""

    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)

    def generate(self, agent_type, prompt, context=None):
        """Return a mock response based on agent type."""
        responses = {
            AgentType.FINANCIAL.value: (
                'Análise financeira: com base no histórico, sugiro '
                'ajustar a precificação para R$ 200,00. '
                'Margem estimada de 35%. Fluxo de caixa positivo projetado.',
                500, 0.05,
            ),
            AgentType.CRM.value: (
                'Segmentação: 12 clientes inativos identificados. '
                'Recomendo campanha de reativação com desconto de 15%.',
                400, 0.04,
            ),
            AgentType.MARKETING.value: (
                'Campanha sugerida: promoção de inverno com 20% off. '
                'Público-alvo: clientes que compraram nos últimos 6 meses.',
                450, 0.045,
            ),
            AgentType.CONTENT.value: (
                'Legenda sugerida: "Transforme seu sorriso hoje! 🦷✨ '
                'Agende sua consulta com 10% de desconto." '
                'Hashtags: #odontologia #sorriso #saude',
                300, 0.03,
            ),
            AgentType.SOCIAL.value: (
                'Melhor horário para postar: 18h-20h. '
                'Tendência atual: conteúdo educativo sobre saúde bucal.',
                350, 0.035,
            ),
            AgentType.SCHEDULING.value: (
                'Otimização de agenda: 3 horários vagos identificados. '
                'Sugiro encaixar clientes da lista de espera.',
                400, 0.04,
            ),
            AgentType.COMMERCIAL.value: (
                'Oportunidade de upsell: 8 clientes elegíveis para pacote '
                'premium. Cross-sell sugerido: clareamento + limpeza.',
                450, 0.045,
            ),
            AgentType.ANALYTICS.value: (
                'KPIs: taxa de conversão 22%, ticket médio R$ 180, '
                'retenção 68%. Insight: aumentar frequência de retorno.',
                500, 0.05,
            ),
            AgentType.LOGISTICS.value: (
                'Rota otimizada: agrupar 5 atendimentos na zona sul. '
                'Economia estimada de 40 minutos de deslocamento.',
                400, 0.04,
            ),
            AgentType.INVENTORY.value: (
                'Reposição necessária: 3 itens abaixo do estoque mínimo. '
                'Sugiro compra de luvas descartáveis e anestésico.',
                350, 0.035,
            ),
            AgentType.REPUTATION.value: (
                'Resposta sugerida para avaliação negativa: '
                '"Agradecemos o feedback. Entraremos em contato para resolver."',
                300, 0.03,
            ),
            AgentType.GROWTH.value: (
                'Oportunidade de expansão: bairro Vila Nova tem alta demanda '
                'sem prestadores na região. Sugiro nova unidade.',
                450, 0.045,
            ),
            AgentType.SECURITY.value: (
                'Alerta: 2 tentativas de login suspeitas detectadas. '
                'Recomendo verificação de contas.',
                350, 0.035,
            ),
            AgentType.SUPPORT.value: (
                'FAQ atualizado: 5 perguntas frequentes identificadas. '
                'Sugiro criar respostas automáticas.',
                300, 0.03,
            ),
            AgentType.EXECUTIVE.value: (
                'Resumo executivo: 3 prioridades identificadas — '
                '1) Reativar clientes inativos, 2) Otimizar agenda, '
                '3) Ajustar precificação. Aguardando aprovação.',
                600, 0.06,
            ),
        }
        result = responses.get(agent_type, ('Sem resposta disponível.', 100, 0.01))
        return result[0], result[1], result[2]


# Action types that require human approval
SENSITIVE_ACTIONS = {
    'pricing_change', 'send_campaign', 'financial_transfer',
    'delete_data', 'block_account', 'refund',
}


class AIAgentService:
    """Multi-agent AI orchestration service."""

    def __init__(self, config_repo=None, exec_repo=None, llm_adapter=None):
        self.config_repo = config_repo or AgentConfigRepository()
        self.exec_repo = exec_repo or AgentExecutionRepository()
        self.llm = llm_adapter or MockLLMAdapter()
        self.logger = get_logger(self.__class__.__name__)

    def configure_agent(self, data):
        from models import AgentConfig
        existing = self.config_repo.find_by_user_and_type(
            data['userId'], data.get('agentType'))
        if existing:
            return {'success': False, 'errors': ['Agente já configurado']}

        try:
            config = AgentConfig.create(
                user_id=data['userId'],
                agent_type=data.get('agentType'),
                monthly_cost_limit=data.get('monthlyCostLimit', 100.0),
                monthly_usage_limit=data.get('monthlyUsageLimit', 10000),
                auto_approve=data.get('autoApprove', False),
                consent_given=data.get('consentGiven', False),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.config_repo.add(config)
        return {'success': True, 'agent': config.to_dict()}

    def get_agents(self, user_id):
        agents = self.config_repo.find_by_user_id(user_id)
        return [a.to_dict() for a in agents]

    def get_agent(self, agent_id):
        agent = self.config_repo.get_by_id(agent_id)
        if not agent:
            return None
        return agent.to_dict()

    def enable_agent(self, agent_id):
        agent = self.config_repo.get_by_id(agent_id)
        if not agent:
            return {'success': False, 'errors': ['Agente não encontrado']}
        if not agent.consent_given:
            return {'success': False, 'errors': ['Consentimento é obrigatório para ativar o agente']}
        agent.enable()
        self.config_repo.save(agent)
        return {'success': True, 'agent': agent.to_dict()}

    def disable_agent(self, agent_id):
        agent = self.config_repo.get_by_id(agent_id)
        if not agent:
            return {'success': False, 'errors': ['Agente não encontrado']}
        agent.disable()
        self.config_repo.save(agent)
        return {'success': True, 'agent': agent.to_dict()}

    def pause_agent(self, agent_id):
        agent = self.config_repo.get_by_id(agent_id)
        if not agent:
            return {'success': False, 'errors': ['Agente não encontrado']}
        agent.pause()
        self.config_repo.save(agent)
        return {'success': True, 'agent': agent.to_dict()}

    def set_consent(self, agent_id, consent_given):
        agent = self.config_repo.get_by_id(agent_id)
        if not agent:
            return {'success': False, 'errors': ['Agente não encontrado']}
        agent.consent_given = consent_given
        self.config_repo.save(agent)
        return {'success': True, 'agent': agent.to_dict()}

    def execute(self, user_id, agent_type, prompt, context=None):
        """Execute an AI agent with full audit trail."""
        config = self.config_repo.find_by_user_and_type(user_id, agent_type)
        if not config:
            return {'success': False, 'errors': ['Agente não configurado']}
        if config.status != 'enabled':
            return {'success': False, 'errors': ['Agente não está ativo']}

        # Check cost and usage limits
        estimated_tokens = 500
        estimated_cost = 0.05
        if not config.can_use(estimated_tokens):
            return {'success': False, 'errors': ['Limite de uso mensal excedido']}
        if not config.can_spend(estimated_cost):
            return {'success': False, 'errors': ['Limite de custo mensal excedido']}

        from models import AgentExecution
        execution = AgentExecution.create(
            user_id=user_id,
            agent_type=agent_type,
            prompt=prompt,
        )
        self.exec_repo.add(execution)

        try:
            response, tokens_used, cost = self.llm.generate(
                agent_type, prompt, context)
            execution.set_response(
                response=response,
                tokens_used=tokens_used,
                cost=cost,
            )
            config.record_usage(cost=cost, tokens=tokens_used)
            self.config_repo.save(config)
            self.exec_repo.save(execution)

            return {
                'success': True,
                'execution': execution.to_dict(),
                'aiGenerated': True,
            }
        except Exception as e:
            execution.mark_failed(error=str(e))
            self.exec_repo.save(execution)
            return {'success': False, 'errors': [str(e)]}

    def propose_action(self, execution_id, action_type, payload=None):
        """Propose an action from an agent execution. Sensitive actions require approval."""
        execution = self.exec_repo.get_by_id(execution_id)
        if not execution:
            return {'success': False, 'errors': ['Execução não encontrada']}

        config = self.config_repo.find_by_user_and_type(
            execution.user_id, execution.agent_type)
        requires_approval = (action_type in SENSITIVE_ACTIONS or
                             (config and config.requires_human_approval()))

        action = execution.set_action(
            action_type=action_type,
            payload=payload or {},
            requires_approval=requires_approval,
        )
        self.exec_repo.save(execution)

        return {
            'success': True,
            'action': action,
            'requiresApproval': requires_approval,
        }

    def approve_action(self, execution_id):
        execution = self.exec_repo.get_by_id(execution_id)
        if not execution:
            return {'success': False, 'errors': ['Execução não encontrada']}
        try:
            execution.approve_action()
        except AIAgentError as e:
            return {'success': False, 'errors': [str(e)]}
        self.exec_repo.save(execution)
        return {'success': True, 'action': execution.get_action()}

    def reject_action(self, execution_id):
        execution = self.exec_repo.get_by_id(execution_id)
        if not execution:
            return {'success': False, 'errors': ['Execução não encontrada']}
        try:
            execution.reject_action()
        except AIAgentError as e:
            return {'success': False, 'errors': [str(e)]}
        self.exec_repo.save(execution)
        return {'success': True, 'action': execution.get_action()}

    def get_executions(self, user_id, agent_type=None, limit=50):
        if agent_type:
            execs = self.exec_repo.find_by_agent_type(user_id, agent_type, limit)
        else:
            execs = self.exec_repo.find_by_user_id(user_id, limit)
        return [e.to_dict() for e in execs]

    def get_execution(self, execution_id):
        execution = self.exec_repo.get_by_id(execution_id)
        if not execution:
            return None
        return execution.to_dict()

    def get_audit_trail(self, user_id, limit=100):
        """Full audit trail of all AI agent interactions for a user."""
        execs = self.exec_repo.find_by_user_id(user_id, limit)
        return [{
            'id': e.id,
            'agentType': e.agent_type,
            'prompt': e.prompt,
            'response': e.response,
            'status': e.status,
            'tokensUsed': e.tokens_used,
            'cost': e.cost,
            'action': e.get_action(),
            'aiGenerated': True,
            'createdAt': e.created_at.isoformat() if e.created_at else None,
            'completedAt': e.completed_at.isoformat() if e.completed_at else None,
        } for e in execs]

    def get_usage_stats(self, user_id):
        """Get cost and usage statistics for all agents of a user."""
        agents = self.config_repo.find_by_user_id(user_id)
        return {
            'agents': [{
                'agentType': a.agent_type,
                'status': a.status,
                'monthlyCostLimit': a.monthly_cost_limit,
                'monthlyUsageLimit': a.monthly_usage_limit,
                'currentMonthCost': a.current_month_cost or 0,
                'currentMonthUsage': a.current_month_usage or 0,
            } for a in agents],
        }
