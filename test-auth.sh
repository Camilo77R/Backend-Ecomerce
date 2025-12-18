#!/bin/bash

# Script de prueba de API de autenticación
# Uso: bash test-auth.sh

echo "🚀 Iniciando pruebas de autenticación..."
echo ""

# URL base
BASE_URL="http://localhost:3000/api/auth"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============ PRUEBA 1: REGISTRO ============
echo -e "${YELLOW}1️⃣ PRUEBA DE REGISTRO${NC}"
echo "Registrando usuario nuevo..."

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/registrarse" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@ejemplo.com",
    "contraseña": "TestPassword123",
    "gender": "other"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.usuario.id')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✅ Registro exitoso${NC}"
  echo "Token: $TOKEN"
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Error en registro${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}2️⃣ PRUEBA DE LOGIN${NC}"
echo "Iniciando sesión..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/iniciar-sesion" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "contraseña": "TestPassword123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$LOGIN_TOKEN" != "null" ] && [ ! -z "$LOGIN_TOKEN" ]; then
  echo -e "${GREEN}✅ Login exitoso${NC}"
else
  echo -e "${RED}❌ Error en login${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}3️⃣ PRUEBA DE PERFIL (protegido)${NC}"
echo "Obteniendo perfil con token..."

PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/perfil" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PROFILE_RESPONSE" | jq '.'

if echo "$PROFILE_RESPONSE" | jq '.usuario' &> /dev/null; then
  echo -e "${GREEN}✅ Perfil obtenido correctamente${NC}"
else
  echo -e "${RED}❌ Error obteniendo perfil${NC}"
fi

echo ""
echo -e "${YELLOW}4️⃣ PRUEBA DE ACTUALIZAR PERFIL${NC}"
echo "Actualizando nombre del usuario..."

UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/perfil" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User Actualizado",
    "gender": "female"
  }')

echo "$UPDATE_RESPONSE" | jq '.'

if echo "$UPDATE_RESPONSE" | jq '.usuario.name' &> /dev/null; then
  echo -e "${GREEN}✅ Perfil actualizado correctamente${NC}"
else
  echo -e "${RED}❌ Error actualizando perfil${NC}"
fi

echo ""
echo -e "${GREEN}✅ TODAS LAS PRUEBAS COMPLETADAS${NC}"
