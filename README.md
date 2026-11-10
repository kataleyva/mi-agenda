# 🌿 Mi Agenda

Agenda personal para organizar pendientes día a día, con colores tierra y pastel, animaciones y un sistema de puntos para mantenerte motivada.

## Qué puedes hacer

- **Hoy**: saludo, frase del día, anillo de progreso, racha 🔥 y nivel. Las tareas atrasadas aparecen arriba con un botón para pasarlas todas a hoy.
- **Semana**: siete columnas; **arrastra** una tarea a otro día para cambiarle la fecha (con botón *Deshacer*). Abajo está la bandeja **Algún día** para lo que aún no tiene fecha.
- **Calendario**: vista mensual; también puedes arrastrar tareas entre días. Al tocar un día ves su lista a la derecha.
- **Pendientes**: todo agrupado (Atrasadas, Hoy, Mañana, Resto de la semana, Más adelante, Algún día), con buscador y filtros por categoría y estado.
- **Progreso**: nivel (Semilla → Montaña), gráfica de los últimos 14 días, pendientes por categoría y logros.
- **Detalles de cada tarea**: fecha (con atajos Hoy / Mañana / En 3 días / Próx. semana), hora, **alarma**, categoría, prioridad, repetición (diaria, semanal, mensual), subtareas y notas.
- **Categorías** con color y emoji, editables en *Ajustes*.
- **Escritura rápida**: `Llamar a mamá mañana 18:00 #personal !alta` crea la tarea con fecha, hora, categoría y prioridad. También entiende `hoy`, `pasado mañana`, `el viernes`, `25/12`, `algún día`, `5pm`.
- **Copia de seguridad**: descarga y restaura tus datos en *Ajustes*.

### Sobre las alarmas
Suenan con un sonido suave, un aviso dentro de la app y una notificación del sistema (si das permiso). Funcionan **mientras la agenda esté abierta** en alguna pestaña. Puedes posponerlas 10 minutos.

### Dónde se guardan los datos
En el navegador (localStorage) del dispositivo donde la uses. No hay cuentas ni servidor todavía, así que lo que anotes en el computador no aparece en el celular.

## Desarrollo

```bash
npm install
npm run dev      # abre http://localhost:5173
npm run build    # genera la versión final en dist/
```

Hecha con React, TypeScript y Vite. Arrastrar y soltar con `@dnd-kit/core`, confeti con `canvas-confetti`.

## Publicarla en internet (GitHub Pages)

El repositorio incluye `.github/workflows/deploy.yml`. Para activarlo: en GitHub ve a **Settings → Pages → Build and deployment → Source: GitHub Actions**. Cada cambio en `main` se publica solo en `https://<tu-usuario>.github.io/<repositorio>/`.
