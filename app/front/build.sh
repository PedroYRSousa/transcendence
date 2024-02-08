#!/bin/bash
echo '-------------- Instalando dependencias --------------'
npm install -g -y @angular/cli;
cd /project/code && npm install;
echo '-------------- Build --------------'
cd /project/code && npm run build;
