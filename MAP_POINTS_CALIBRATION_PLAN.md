# Plan de Calibración de Puntos y POIs de Arc Raiders (Update 2.0)

Este documento detalla el plan para corregir todas las ubicaciones y puntos de interés (POIs) en los mapas de ARC Raiders y vincularlos a los 206 objetivos pendientes.

---

## 1. El Calibrador Visual Integrado en la App
Dentro de la pestaña del Mapa Táctico de la app, hemos implementado el botón:
> **🎯 CALIBRADOR** (Esquina superior derecha del radar).

### Cómo funciona mientras juegas:
1. Abre el mapa táctico de tu sector (ej: *Dam Battlegrounds*).
2. Activa el botón **🎯 Calibrador**.
3. Haz clic sobre cualquier edificio, cúpula, complejo o punto del mapa satelital real.
4. Aparecerá un recuadro con las coordenadas exactas calculadas en porcentaje `(X: XX.X%, Y: YY.Y%)`.
5. Haz clic en **Copiar Coordenada** para pegarla directamente en la base de datos o en tu archivo de notas.

---

## 2. Derivación al Modelo Externo (Argon 4 / GPT-4)
Hemos generado el archivo estructurado listo para alimentar al modelo:
📁 [`unmapped_quests_for_llm.json`](./unmapped_quests_for_llm.json)

Este archivo contiene los 206 objetivos divididos por los 7 mapas principales:
- **Dam Battlegrounds**: 62 objetivos
- **Buried City**: 52 objetivos
- **The Spaceport**: 27 objetivos
- **The Blue Gate**: 18 objetivos
- **Riven Tides**: 16 objetivos
- **Stella Montis**: 18 objetivos
- **Pendola Pass**: 13 objetivos

### Prompt listo para copiar y pegar en tu modelo (Argon 4 / GPT-4):

```text
Eres un experto en el videojuego ARC Raiders (de Embark Studios).
A continuación tienes un listado de misiones con objetivos que transcurren en el mapa [NOMBRE DEL MAPA].
Tu tarea es asociar cada objectiveId con el POI correspondiente en dicho mapa, o indicar un nuevo POI con su nombre y coordenadas estimadas en porcentaje (X: 0 a 100, Y: 0 a 100).

POIs ya existentes en este mapa:
[PEGAR SECCIÓN existingPois DEL MAPA CORRESPONDIENTE]

Objetivos a vincular:
[PEGAR SECCIÓN unmappedObjectives DEL MAPA CORRESPONDIENTE]

Responde ÚNICAMENTE con un array JSON con esta estructura exacta para cada objetivo:
[
  {
    "objectiveId": "obj_ejemplo_1",
    "poiId": "dam_research_admin",
    "poiDetails": {
      "id": "dam_research_admin",
      "mapId": "dam_battlegrounds",
      "name": {
        "en": "Research & Administration",
        "es": "Investigación y Administración"
      },
      "coordinates": { "x": 48.5, "y": 32.0 },
      "dangerLevel": "high"
    }
  }
]
```

---

## 3. Fusión Automática en la Base de Datos
Cuando el modelo te responda con el JSON:
1. Guarda la respuesta en un archivo (por ejemplo `mapped_quests_input.json` en la raíz del proyecto).
2. Ejecuta en terminal:
   ```powershell
   node scripts/import_mapped_quests.cjs
   ```
3. El script automáticamente:
   - Añadirá los nuevos POIs a `src/data/maps.json` sin duplicados.
   - Enlazará cada `objectiveId` con su `poiId` en `src/data/quests.json`.
   - El optimizador de incursión y el radar táctico comenzarán a trazar la ruta real sobre el terreno.
