# ARC Raiders Companion

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)](https://tailwindcss.com/)
[![Zod Validated](https://img.shields.io/badge/Zod-Validated-3068b7)](https://zod.dev/)

> **Tactical Companion & Raid Route Planner for ARC Raiders**  
> Una companion app de código abierto (GNU AGPLv3), local-first y sin costes de servidor para eliminar la sobrecarga de gestionar 15+ misiones simultáneas en *ARC Raiders*.

---

## ⚡ Características del Sistema

### 1. Selector Rápido de Misiones por Comerciante (Flujo de 10 segundos)
- Agrupación por facciones y comerciantes del juego: **Tian Wen**, **Shani**, **Lance**, **Celeste** y **Apollo**.
- Búsqueda predictiva instantánea y filtrado por sectores y mapas.
- Activación en un clic con persistencia en el navegador (`localStorage` vía Zustand).

### 2. Loadout & Stash HUD (Qué Llevar vs Qué Buscar)
- **Preparación de Alijo (Qué Llevar):** Consolidación de llaves (*Apartamento Grandioso*, etc.), herramientas y consumibles requeridos para tus misiones activas antes de salir a la raid.
- **Loot Prioritario (Qué Buscar en Raid):** Listado de objetos clave a extraer (diarios encriptados, microchips lógicos, núcleos pesados ARC).
- **Alerta de Refugio / Estaciones (¡NO VENDER!):** Detección automática de materiales necesarios para mejoras del banco de trabajo, armería o alijo, impidiendo que vendas o recicles ítems críticos por error.

### 3. Optimizador de Incursión Dinámico & Mapa Táctico (Fase 2)
- **Selección de Spawn en Partida:** El usuario marca dónde ha aparecido (*"He aparecido aquí"*) y el motor recalcula el vector de aproximación en tiempo real.
- **Modos de Ruta Táctica:**
  - **Modo Rata / Supervivencia:** Prioriza 1-2 objetivos cercanos a la extracción, esquiva POIs con peligro elevado (`dangerLevel: 'high'`) y traza la ruta hacia el punto de extracción más seguro.
  - **Modo Barrido / Eficiencia:** Resuelve el Problema del Viajante (TSP) para completar todos los objetivos del mapa minimizando la distancia global.
- **Mecánicas Complejas de Misiones:**
  - **Objetivos con Alternativas (OR):** Si una misión permite hackear la consola A o la consola B, el optimizador calcula cuál está más cerca y descarta la redundante.
  - **Dependencias Secuenciales (AND):** Respeta el orden estricto de pasos previos (ej. conseguir la llave antes de abrir la bóveda).
- **HUD de Incursión en Vivo:** Interfaz limpia sin distracciones, navegación paso a paso y botón de aborto/pánico para evacuar hacia la extracción más cercana.

### 4. Ingesta Visual de Misiones (Fase 3: OCR & Visión IA)
- **Modo PC Doble Monitor (`Ctrl+V` Instantáneo):**
  - Pulsa `Win+Shift+S` en tu juego y haz `Ctrl+V` en la app.
  - Procesamiento 100% local en tu navegador con **Tesseract.js** (binarización adaptativa y contraste) y emparejamiento difuso con **Fuse.js**.
  - Sin subir imágenes a servidores externos, privado y de latencia cero.
- **Modo Móvil (Foto a Monitor con Gemini 1.5 Flash Vision):**
  - Supera el problema físico del patrón de muaré y la inclinación de perspectiva de fotos hechas con el móvil a pantallas.
  - Conector directo con la API gratuita de Google Gemini Flash para detección semántica de misiones.
  - La clave de API se almacena de forma estrictamente local en tu navegador.

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

# Ejecutar tests de validación e integridad referencial (15 tests)
npm test

# Compilar para producción
npm run build
```

---

## 🗺️ Estado del Proyecto

- [x] **Fase 1:** Base de datos Zod + Selector rápido por comerciante + Loadout HUD + Alerta de Refugio.
- [x] **Fase 2:** Radar vectorial SVG interactivo (*Dam Battlegrounds*, *Buried City*, *The Spaceport*), cálculo dinámico de rumbos de brújula ($0^\circ - 360^\circ$), Modo Rata vs. Barrido, objetivos OR/AND y HUD de foco.
- [x] **Fase 3:** Ingesta visual por `Ctrl+V` (captura limpia de Windows `Win+Shift+S`) con OCR local + Conector de visión IA con Gemini Flash para fotos de móvil.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **GNU Affero General Public License v3.0 (AGPLv3)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
