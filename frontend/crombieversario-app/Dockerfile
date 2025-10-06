# frontend/crombieversario-app/Dockerfile

# Etapa 1: Build de la aplicación React
FROM node:18-alpine as builder
WORKDIR /app

# ACEPTAR EL ARGUMENTO QUE VIENE DEL docker-compose.yml
ARG VITE_API_BASE_URL 

COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .

# INYECTAR LA VARIABLE DURANTE EL COMANDO BUILD
# Vite leerá esta variable y la incrustará en el código JS.
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL npm run build 

# Etapa 2: Servir con Nginx
FROM nginx:alpine
# Copia el archivo nginx.conf modificado
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia los archivos estáticos generados
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
