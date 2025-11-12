# Étape 1 : Construction de l'application Angular
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Vérification du répertoire de build
RUN ls -la /app/dist

# Étape 2 : Configuration de Nginx
FROM nginx:1.25
COPY --from=build /app/dist/class-room-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker cp D://Project_Angular/class-room-frontend/dist/class-room-frontend/browser/. classroomproject-frontend-1:/usr/share/nginx/html/
# docker cp D://Project_Angular/class-room-frontend/dist/class-room-frontend/. classroomproject-frontend-1:/usr/share/nginx/html/
