#!/bin/bash
# Script de deployment para cPanel/NutHost
# Uso: bash deploy.sh

echo "🚀 Iniciando deployment..."

# 1. Actualizar código desde Git (opcional)
if [ -d ".git" ]; then
  echo "📥 Obteniendo últimos cambios de Git..."
  git pull origin main
fi

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

# 3. Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

# 4. Reiniciar aplicación con PM2
if command -v pm2 &> /dev/null; then
  echo "♻️ Reiniciando aplicación con PM2..."
  pm2 restart dashboard-usittel || pm2 start npm --name "dashboard-usittel" -- start
  pm2 save
else
  echo "⚠️ PM2 no instalado. Instálalo con: npm install -g pm2"
fi

echo "✅ Deployment completado!"
echo "🌐 Tu dashboard debería estar disponible en tu subdominio"
