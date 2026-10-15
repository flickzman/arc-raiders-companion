# ARC Raiders Companion

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)](https://tailwindcss.com/)
[![Zod Validated](https://img.shields.io/badge/Zod-Validated-3068b7)](https://zod.dev/)

> **Tactical Companion & Raid Route Planner for ARC Raiders**  
> Una companion app de código abierto (GNU AGPLv3), local-first y sin costes de servidor para eliminar la sobrecarga de gestionar 15+ misiones simultáneas en *ARC Raiders*.

---

## ⚡ Características Implementadas (Fase 1)

1. **Selector Rápido de Misiones por Comerciante (Flujo de 10 segundos):**
   - Agrupación por facciones y vendedores: **Tian Wen**, **Shani**, **Lance**, **Celeste** y **Apollo**.
   - Búsqueda predictiva instantánea y filtrado por sectores/mapas.
   - Activación/desactivación en 1 clic con persistencia local (`localStorage` vía Zustand).

2. **Loadout & Stash HUD (Qué Llevar vs Qué Buscar):**
   - **Preparación de Alijo (Qué Llevar):** Consolidación de llaves (Apartamento Grandioso, etc.), herramientas y consumibles requeridos para tus misiones activas.
   - **Loot Prioritario (Qué Buscar en Raid):** Listado de objetos clave a extraer (diarios encriptados, microchips lógicos, núcleos pesados ARC).
   - **Alerta de Refugio / Estaciones (¡NO VENDER!):** Detección automática de materiales necesarios para mejoras del banco de trabajo, armería o alijo, impidiendo que vendas o recicles ítems críticos por error.

3. **Optimizador de Incursión Dinámico (Clustering y Perfiles):**
   - Agrupación de misiones por mapa para identificar dónde tienes mayor sinergia.
   - Selección de punto de aparición dentro de la partida (*"He aparecido aquí"*).
   - Conmutador de perfil táctico:
     - **Modo Rata / Supervivencia:** Prioriza 1-2 objetivos cercanos a la extracción evitando zonas calientes.
     - **Modo Barrido / Eficiencia:** Maximiza XP y objetivos cubriendo la raid completa.
   - Checklist en tiempo real durante la partida para marcar objetivos completados.

4. **Base de Datos Comunitaria Abierta y Validada con Zod:**
   - Todo el contenido reside en archivos JSON abiertos en `src/data/` (`quests.json`, `maps.json`, `items.json`).
   - Esquemas Zod con soporte bilingüe (`es` / `en`).
   - Tests automatizados en Vitest que garantizan integridad referencial total (sin IDs huérfanos ni referencias rotas).

---

## 🚀 Instalación y Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/Flickzman/arc-raiders-companion.git
cd arc-raiders-companion

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Ejecutar tests de validación e integridad referencial
npm test

# Compilar para producción
npm run build
```

---

## 🗺️ Hoja de Ruta

- [x] **Fase 1:** Base de datos Zod + Selector rápido por comerciante + Loadout HUD + Alerta de Refugio.
- [ ] **Fase 2:** Mapa vectorial SVG interactivo para *Dam Battlegrounds* y *Buried City* con trazado de ruta óptima desde el spawn elegido.
- [ ] **Fase 3:** Ingesta por `Ctrl+V` (captura limpia de Windows `Win+Shift+S`) con OCR local + Conector opcional con Gemini Flash API para fotos de móvil.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **GNU Affero General Public License v3.0 (AGPLv3)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
