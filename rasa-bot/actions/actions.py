from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests

API_GATEWAY_URL = "http://api-gateway:5000/api"

class ActionGetBalance(Action):
    def name(self) -> Text:
        return "action_get_balance"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # A lógica para obter o user_id a partir do tracker.sender_id (número do whats)
        # precisaria ser implementada, talvez com uma chamada a um endpoint de lookup no gateway.
        # Para simplificar, usaremos um ID fixo para demonstração.
        user_id = 1 
        
        try:
            # Em produção, o token JWT do backoffice não é usado aqui.
            # O Action Server deveria ter seu próprio método seguro de se comunicar com os microserviços.
            # Por simplicidade, vamos chamar o microserviço diretamente (não recomendado para PROD).
            response = requests.get(f"http://service-accounts:5001/balance/{user_id}")
            if response.status_code == 200:
                data = response.json()
                balance = data.get('balance')
                dispatcher.utter_message(text=f"Seu saldo atual é de R$ {balance}.")
            else:
                dispatcher.utter_message(text="Não consegui consultar seu saldo no momento.")
        except Exception as e:
            dispatcher.utter_message(text="Ocorreu um erro técnico ao buscar seu saldo.")
            
        return []
