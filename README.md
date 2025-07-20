# 📝 ColaboraDev - Notion Clone

Este repositorio contiene el proyecto final del curso **ColaboraDev**. Es una simulación de una aplicación tipo Notion que permite crear notas jerárquicas y organizar tareas en una interfaz web sencilla.

## 🎯 Objetivo

- Practicar trabajo colaborativo en GitHub
- Control de versiones con ramas y commits significativos
- Automatización básica con GitHub Actions
- Documentación técnica y decisiones de desarrollo

## 📦 Estructura

- `frontend/`: HTML, CSS y JS para interfaz de usuario
- `backend/`: servidor Node.js simulado para persistencia de notas
- `tests/`: pruebas unitarias de la API
- `.github/workflows/`: CI con Node.js para validación automática
- `docs/`: documentos técnicos y decisiones del equipo

## 🚀 Cómo ejecutar

```bash
# Backend
cd backend
npm install
node server.js

# Frontend
Abre index.html desde navegador (se conecta al backend por fetch)
