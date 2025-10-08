import random
from faker import Faker
from app import create_app, db
from app.models import Client, Transaction
from datetime import datetime, timedelta

app = create_app()
ctx = app.app_context()
ctx.push()

fake = Faker('pt_BR')

def generate_unique_account_number():
    while True:
        acc_number = str(random.randint(100000, 999999))
        digit = str(sum(int(d) for d in acc_number) % 10)
        final_acc_number = f"{acc_number}-{digit}"
        if not Client.query.filter_by(account_number=final_acc_number).first():
            return final_acc_number

def seed_clients(num_clients=20):
    if Client.query.count() > 0:
        print("O banco de dados já contém clientes. Abortando o seeding.")
        return

    print(f"Criando {num_clients} clientes fakes e suas transações...")
    
    for i in range(num_clients):
        new_client = Client(
            full_name=fake.name(),
            rg=fake.rg(),
            cpf=fake.cpf(),
            address=fake.address(),
            account_number=generate_unique_account_number(),
            balance_cents=0,
            branch='0001'
        )
        new_client.set_password('123456')
        db.session.add(new_client)
        
        total_balance = 0
        for j in range(random.randint(5, 15)):
            is_credit = random.choice([True, False])
            amount = random.randint(1000, 150000)
            
            if is_credit:
                trans_type = 'credit'
                trans_amount = amount
                desc = random.choice(['PIX Recebido', 'Depósito', 'Salário'])
            else:
                trans_type = 'debit'
                trans_amount = -amount
                desc = random.choice(['Compra no Cartão', 'Pagamento Boleto', 'Saque'])

            total_balance += trans_amount
            
            trans = Transaction(
                client=new_client,
                description=f"{desc} - {fake.company()}",
                amount_cents=trans_amount,
                type=trans_type,
                timestamp=datetime.utcnow() - timedelta(days=random.randint(1, 90))
            )
            db.session.add(trans)
        
        new_client.balance_cents = total_balance

        print(f"  -> Cliente '{new_client.full_name}' e suas transações preparados.")

    print("\nSalvando tudo no banco de dados...")
    db.session.commit()
    print("Seeding completo!")

if __name__ == '__main__':
    seed_clients(20)
    ctx.pop()
