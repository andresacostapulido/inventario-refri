# 🍽️ Inventario del Refrigerador

Una aplicación web moderna y completa para gestionar el inventario de tu refrigerador con funcionalidades avanzadas de Inteligencia Artificial para generar recetas personalizadas.

![Inventario del Refrigerador](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Características Principales

### 📦 Gestión de Inventario
- **CRUD completo** de productos (Crear, Leer, Actualizar, Eliminar)
- **Categorización inteligente** (Lácteos, Verduras, Frutas, Proteínas, Legumbres, Otros)
- **Búsqueda en tiempo real** de productos
- **Filtrado por categorías** y estado
- **Alertas de caducidad** automáticas
- **Cantidades y unidades** personalizables

### 🤖 Inteligencia Artificial
- **Generación de recetas** con Google Gemini AI
- **10 platos variados** por consulta (italiano, mexicano, asiático, mediterráneo, etc.)
- **10 ensaladas variadas** por consulta (mediterránea, asiática, mexicana, griega, etc.)
- **Recetas personalizadas** basadas en tu inventario
- **Información nutricional** detallada
- **Consejos de preparación** de la IA
- **Tiempo de preparación** y nivel de dificultad

### 🔐 Seguridad Avanzada
- **API key encriptada** localmente
- **Protección con contraseña** personal
- **Nunca se expone** en el código fuente
- **Gestión completa** (configurar, cambiar, eliminar)
- **Almacenamiento seguro** en localStorage

### 🎨 Interfaz Moderna
- **Diseño responsive** (móvil, tablet, desktop)
- **Interfaz intuitiva** y fácil de usar
- **Iconos descriptivos** para mejor UX
- **Modal elegante** para recetas generadas
- **Navegación fluida** entre secciones

### 💾 Almacenamiento Local
- **IndexedDB** para datos persistentes
- **localStorage** para configuración
- **Sin necesidad de servidor** externo
- **Funciona offline** completamente
- **Datos privados** en tu dispositivo

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- API key de Google Gemini (gratuita)

### Pasos de Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/inventario-refrigerador.git
   cd inventario-refrigerador
   ```

2. **Abre la aplicación:**
   - **Opción A:** Abre `dieta/index.html` directamente en tu navegador
   - **Opción B:** Usa un servidor local:
     ```bash
     cd dieta
     python -m http.server 8000
     # Luego abre http://localhost:8000
     ```

3. **Configura tu API key:**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva API key para Gemini
   - En la aplicación, haz clic en "Configurar" en la sección de API Key
   - Ingresa tu API key y crea una contraseña de protección

## 📖 Guía de Uso

### Gestión de Inventario

#### Agregar Productos
1. Completa el formulario con:
   - **Nombre** del producto
   - **Categoría** (selecciona la apropiada)
   - **Cantidad** (opcional)
   - **Unidad** (kg, unidades, etc.)
2. Haz clic en "Agregar Producto"

#### Editar Productos
1. Haz clic en el icono ✏️ junto al producto
2. Modifica los campos necesarios
3. Haz clic en "Actualizar"

#### Eliminar Productos
1. Haz clic en el icono 🗑️ junto al producto
2. Confirma la eliminación

#### Buscar y Filtrar
- Usa la **barra de búsqueda** para encontrar productos
- Cambia de **categoría** para filtrar productos
- Activa **"Solo con stock"** para ver productos disponibles

### Generación de Recetas con IA

#### Configuración Inicial
1. Haz clic en "Configurar" en la sección de API Key
2. Ingresa tu API key de Google Gemini
3. Crea una contraseña para proteger tu API key
4. Confirma la contraseña

#### Generar Ensaladas
1. Ve a la sección "Recetas de Ensaladas"
2. Haz clic en "🤖 Generar Receta con IA"
3. Ingresa tu contraseña cuando se solicite
4. Recibe 10 ensaladas variadas con:
   - Lista de ingredientes
   - Pasos de preparación
   - Información nutricional
   - Consejos de la IA

#### Generar Platos Principales
1. Ve a la sección "Menú de Recetas"
2. Haz clic en "🤖 Generar Plato con IA"
3. Ingresa tu contraseña cuando se solicite
4. Recibe 10 platos variados con:
   - Tiempo de preparación
   - Nivel de dificultad
   - Ingredientes y pasos
   - Información nutricional
   - Consejos de la IA

### Gestión de API Key

#### Cambiar API Key
1. Haz clic en "Cambiar" en la sección de API Key
2. Ingresa tu contraseña actual
3. Ingresa la nueva API key
4. Confirma la nueva contraseña

#### Eliminar API Key
1. Haz clic en "Eliminar" en la sección de API Key
2. Ingresa tu contraseña para confirmar
3. Confirma la eliminación

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsive
- **JavaScript ES6+** - Lógica de aplicación
- **IndexedDB** - Base de datos local
- **localStorage** - Almacenamiento de configuración

### Inteligencia Artificial
- **Google Gemini API** - Generación de recetas
- **Modelo gemini-1.5-flash** - Respuestas rápidas y eficientes
- **Encriptación XOR** - Protección de API key

### Características Técnicas
- **Aplicación SPA** (Single Page Application)
- **Almacenamiento local** (sin servidor externo)
- **Funcionamiento offline** completo
- **Responsive design** con media queries
- **Manejo de errores** robusto

## 📁 Estructura del Proyecto

```
inventario-refrigerador/
├── dieta/
│   ├── index.html          # Página principal
│   ├── app.js             # Lógica principal de la aplicación
│   └── style.css          # Estilos CSS
├── README.md              # Este archivo
└── .gitignore            # Archivos ignorados por Git
```

### Archivos Principales

#### `index.html`
- Estructura HTML principal
- Meta tags para responsive design
- Enlaces a CSS y JavaScript

#### `app.js`
- Configuración de IndexedDB
- Funciones CRUD para productos
- Integración con Google Gemini API
- Sistema de encriptación
- Lógica de generación de recetas
- Manejo de eventos y UI

#### `style.css`
- Estilos responsive
- Diseño moderno y limpio
- Media queries para móvil
- Animaciones y transiciones

## 🔐 Seguridad

### Protección de API Key
- **Encriptación XOR** con contraseña personal
- **Codificación base64** para almacenamiento
- **Verificación de contraseña** antes de desencriptar
- **Nunca se expone** en el código fuente
- **Almacenamiento local** (no se sube a servidores)

### Privacidad de Datos
- **Todos los datos** se almacenan localmente
- **Sin tracking** o análisis externo
- **Sin cookies** de terceros
- **Control total** sobre tus datos

## 🎯 Funcionalidades Avanzadas

### Sistema de Menús
- **Generación automática** de menús completos
- **Combinaciones inteligentes** de ingredientes
- **Filtrado por disponibilidad** de productos
- **Regeneración** de menús con un clic

### Gestión de Categorías
- **6 categorías principales** predefinidas
- **Productos pre-cargados** para cada categoría
- **Migración automática** de categorías antiguas
- **Filtrado dinámico** por categoría

### Alertas y Notificaciones
- **Cálculo automático** de días restantes
- **Alertas visuales** para productos próximos a caducar
- **Filtrado** por estado de caducidad
- **Gestión proactiva** del inventario

## 🚀 Despliegue

### GitHub Pages (Recomendado)
1. Sube tu código a GitHub
2. Ve a Settings > Pages
3. Selecciona la rama main
4. Tu app estará disponible en `https://tu-usuario.github.io/inventario-refrigerador`

### Servidor Local
```bash
cd dieta
python -m http.server 8000
# Abre http://localhost:8000
```

### Otros Servidores
- **Node.js:** `npx serve dieta`
- **PHP:** `php -S localhost:8000 -t dieta`
- **Cualquier servidor web** estático

## 🤝 Contribuir

### Cómo Contribuir
1. Haz un **fork** del repositorio
2. Crea una **rama** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz **commit** de tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Haz **push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un **Pull Request**

### Áreas de Mejora
- [ ] Soporte para múltiples idiomas
- [ ] Exportar/importar inventario
- [ ] Estadísticas de uso
- [ ] Más categorías de productos
- [ ] Integración con otras APIs de recetas
- [ ] Modo oscuro
- [ ] Notificaciones push

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Google Gemini** por proporcionar la API de IA
- **Comunidad de desarrolladores** por las librerías y herramientas
- **Usuarios** por el feedback y sugerencias

## 📞 Soporte

Si tienes problemas o sugerencias:

1. **Issues:** Crea un issue en GitHub
2. **Documentación:** Revisa este README
3. **Código:** Revisa los comentarios en el código

---

**¡Disfruta gestionando tu inventario y creando deliciosas recetas con IA! 🍽️🤖** 