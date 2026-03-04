# TaskFlow — lista y revisa tusa tareas 
es una aplicación de lista de tareas (To-Do List) minimalista, rápida y elegante. Diseñada para ayudarte a organizar tu día sin distracciones, con soporte para prioridades, subtareas y modo oscuro.

## Estructura del proyecto

taskflow/
├── assets/          # Logos e iconos en caso de querer o agregar 
├── index.html       # Estructura principal
├── style.css        # Estilos y animaciones
├── app.js           # Lógica y funciones
└── README.md        # Documentación


## Características Principales

.Gestión de Tareas: Crea, edita (doble clic) y elimina tareas fácilmente.
.Subtareas: Divide tareas grandes en pasos más pequeños.
.Prioridades: Clasifica tus pendientes en Alta, Media o Baja.
.Modo Oscuro: Cambia el tema para proteger tu vista.
.Diseño Responsivo: Funciona perfecto en computadoras y celulares.
.Persistencia: Tus datos no se borran al cerrar el navegador.


## Cómo usar

1. Instalación: No requiere. Solo abre index.html en cualquier navegador.
2. Agregar: Escribe tu tarea, elige una prioridad y presiona Enter o el botón Agregar.
3. Completar: Haz clic en el círculo de la izquierda para marcar como lista.
4. Editar: Haz doble clic sobre el texto de cualquier tarea para modificarlo.
5. Subtareas: Haz clic en el botón + Subtareas para abrir el panel de pasos.
6. Filtros: Organiza tu vista usando los botones: Todas, Activas o Listas.
7. Limpiar: Usa el botón Borrar terminadas para vaciar las tareas completadas de un golpe.

## Datos guardados en LocalStorage

La aplicación utiliza el LocalStorage del navegador para que no pierdas tu información.

Clave de datos: taskflow_v2
