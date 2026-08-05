"""Flask Blueprint for cep routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
import requests
import re

cep_bp = Blueprint('cep', __name__)

logger = get_logger("routes.cep")

@cep_bp.route('/cep/<cep>', methods=['GET'])
def lookup_cep(cep):
    clean_cep = re.sub(r'[^0-9]', '', cep)
    if len(clean_cep) != 8:
        return jsonify({'success': False, 'errors': ['CEP inválido']}), 400
    try:
        resp = requests.get(f'https://viacep.com.br/ws/{clean_cep}/json/', timeout=5)
        data = resp.json()
        if data.get('erro'):
            return jsonify({'success': False, 'errors': ['CEP não encontrado']}), 404
        return jsonify({
            'success': True,
            'cep': data.get('cep', ''),
            'rua': data.get('logradouro', ''),
            'complemento': data.get('complemento', ''),
            'bairro': data.get('bairro', ''),
            'cidade': data.get('localidade', ''),
            'estado': data.get('uf', ''),
        })
    except requests.RequestException:
        return jsonify({'success': False, 'errors': ['Erro ao consultar CEP']}), 502
