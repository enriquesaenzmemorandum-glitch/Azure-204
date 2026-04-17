# AZ-204 Master Simulator Premium 🚀

Refactorización modular y premium de la aplicación de estudio para el examen Microsoft AZ-204.

## ✨ Características Principales
- **Arquitectura Modular**: Código separado en módulos ES6 para facilitar el mantenimiento.
- **Modo Examen Configurable**: Símulacro de examen con número de preguntas y tiempo personalizables.
- **Dashboard de Progreso**: Estadísticas visuales y seguimiento por categoría (Compute, Storage, etc.).
- **Persistencia Avanzada**: Guardado automático de progreso y configuración de filtros.
- **Backup & Restore**: Exporta tu progreso a un archivo JSON y restáuralo en cualquier momento.
- **Diseño Premium**: Interfaz moderna con *glassmorphism*, modo oscuro y optimización para móviles.

## 🚀 Cómo ejecutar la aplicación

Debido a que la aplicación carga datos desde un archivo JSON local (`data/questions.json`), los navegadores bloquean estas peticiones por seguridad (CORS) si abres el archivo `index.html` directamente desde el explorador de archivos.

**Debes ejecutar la aplicación usando un servidor web local.** Aquí tienes 3 formas sencillas:

### 1. Visual Studio Code (Recomendado)
- Instala la extensión **"Live Server"**.
- Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

### 2. Python (Si tienes Python instalado)
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
python -m http.server 8000
```
Luego ve a `http://localhost:8000` en tu navegador.

### 3. Node.js (Si tienes Node/NPM instalado)
Instala y ejecuta `serve`:
```bash
npx serve
```
Luego ve a la URL que te indique la terminal (usualmente `http://localhost:3000`).

## 📁 Estructura del Proyecto
```text
az204-app/
├── index.html         # Entrada principal
├── README.md           # Instrucciones y documentación
├── data/
│   └── questions.json  # Base de datos de preguntas (vial 317 extraídas)
├── css/
│   └── style.css       # Sistema de diseño y estilos premium
└── js/
    ├── main.js         # Controlador de UI y eventos
    ├── engine.js       # Lógica del cuestionario y modo examen
    └── storage.js      # Gestión de persistencia y backup
```

## 🛠️ Próximos Pasos
- Los campos `reference` en `data/questions.json` son placeholders. Puedes editarlos para añadir links a Microsoft Learn.
- Puedes ajustar la `difficulty` de cada pregunta en el archivo JSON.
