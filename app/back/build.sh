#!/bin/bash
echo '-------------- Instalando dependencias --------------'
npm install -g -y @nestjs/cli;
cd /project/code && npm install;
echo '-------------- Build --------------'
cd /project/code && npm run build;
echo '-------------- Iniciando --------------'
cd /project/code && npm run start;
