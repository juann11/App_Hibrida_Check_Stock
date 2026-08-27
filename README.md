# 📦 Check Stock — Sistema de Gestión de Inventario Offline-First

**Check Stock** es una aplicación web híbrida (Single Page Application - SPA) diseñada para la administración y control logístico de inventario en pequeñas y medianas empresas (PyMEs). Desarrollada bajo la filosofía **Offline-First**, permite a los comerciantes gestionar sus productos, movimientos y métricas sin depender de una conexión a internet ni de servidores centralizados.

---

## 🚀 Características Principales

* **Filosofía Offline-First:** Toda la información reside en el cliente mediante el uso de `localStorage`, garantizando un rendimiento inmediato y funcionamiento sin red.
* **Navegación SPA (Single Page Application):** Interfaz fluida sin recarga de página, coordinada por un gestor dinámico de estados de vista.
* **Diseño Mobile-First y Adaptativo:** Interfaz limpia construida con SASS, optimizada para dispositivos móviles mediante una barra de navegación inferior (*Bottom Navbar*) accesible a una mano.
* **Módulo de Autenticación Local:** Control de sesión dinámico mediante *overlay* de inicio de sesión que protege la vista principal ante usuarios no autenticados.
* **Dashboard e Indicadores en Tiempo Real:** Métricas automáticas de stock total, valor del inventario, productos agotados y alertas visuales configurables para stock crítico (amarillo/rojo).
* **Gestión de Inventario (CRUD):** Registro, consulta, filtrado dinámico por categorías (*pills*), eliminación y búsqueda de productos en tiempo real.
* **Control de Movimientos de Entradas y Salidas:** Registro detallado de transacciones con historial de auditoría y recalculo inmediato del stock.
* **Respaldo de Datos (Importación/Exportación JSON):** Generación de copias de seguridad físicas descargables en formato `.json` y restauración mediante `FileReader`.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica base y contenedores de vistas SPA.
* **SASS (SCSS):** Arquitectura de diseño modular basada en variables (`_variables.scss`), nesting, flexbox/grid y media queries.
* **JavaScript (Vanilla JS - ES6+):** Programación modular orientada a eventos para el control del DOM, persistencia de datos y lógica del sistema.
* **Figma:** Diseño de wireframes, arquitectura de información y prototipado UI/UX.

---

## 📁 Arquitectura del Proyecto

```text
check-stock/
├── index.html            # Estructura SPA y contenedores de vistas
├── src/
│   ├── scss/
│   │   ├── _variables.scss # Paleta de colores, fuentes y medidas
│   │   └── styles.scss     # Estilos globales, componentes y layout
│   └── js/
│       ├── main.js         # Orquestador principal y eventos DOM
│       ├── auth.js         # Lógica de autenticación y estado de sesión
│       ├── inventory.js    # Lógica CRUD de productos y cálculo de stock
│       ├── storage.js      # Manejo de localStorage e Import/Export JSON
│       └── ui.js           # Renderizado dinámico de vistas, toasts y filtros
└── README.md             # Documentación del proyecto


⚙️ Instalación y Uso Local
Al ser una aplicación nativa construida con Vanilla JS, no requiere de la instalación de Node.js ni de gestores de paquetes para ejecutarse en producción.

1. Clonar el repositorio:

Bash

git clone https://github.com/juann11/App_Hibrida_Check_Stock.git

2. Compilar SASS (opcional, si deseas modificar estilos):

sass --watch src/scss/styles.scss src/css/styles.css

3. Ejecutar la aplicación:
Abre el archivo index.html directamente en cualquier navegador web o mediante una extensión como Live Server en Visual Studio Code.


💾 Respaldo y Migración de Datos
Para evitar la pérdida de información al borrar la caché del navegador:

Dirígete a la sección Ajustes / Respaldo.

Haz clic en Exportar Copia de Seguridad para descargar un archivo backup-checkstock.json.

En cualquier otro dispositivo, utiliza la opción Importar para cargar el archivo y restaurar el estado completo del sistema.