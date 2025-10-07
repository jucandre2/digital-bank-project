# Imagem base do Nginx
FROM nginx:stable-alpine

# Remove os arquivos padrão da pasta de destino para garantir uma cópia limpa
RUN rm -rf /usr/share/nginx/html/*

# Copia o conteúdo da nossa pasta 'public' para o diretório raiz padrão do Nginx
COPY public/ /usr/share/nginx/html/

# Expõe as portas que o Nginx irá usar
EXPOSE 80 443 8443

# Comando padrão para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
