from app import create_app

app = create_app()

if __name__ == '__main__':
    # Usaremos a porta 5006 para este serviço
    app.run(host='0.0.0.0', port=5006)
