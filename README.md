# 🍽️ Inventario Refri v2.0

Una aplicación web moderna para gestionar el inventario de tu refrigerador con generación de recetas usando Inteligencia Artificial.

## ✨ Características

### 🔐 Seguridad Mejorada
- **Encriptación AES-256**: Reemplaza la encriptación XOR anterior con estándares de seguridad modernos
- **PBKDF2**: Derivación segura de claves con 10,000 iteraciones
- **Validación de contraseñas**: Verificación de fortaleza con múltiples criterios
- **Protección de API Keys**: Almacenamiento seguro de claves de Google Gemini

### 🚀 Rendimiento Optimizado
- **Cache en memoria**: Reducción de consultas a IndexedDB
- **Rate limiting**: Control de uso de API para evitar excesos
- **Carga diferida**: Optimización de recursos y componentes
- **Compresión de datos**: Almacenamiento eficiente

### 🎨 Experiencia de Usuario Moderna
- **Modo oscuro/claro**: Tema adaptable con persistencia
- **Diseño responsive**: Funciona perfectamente en móviles y desktop
- **Notificaciones toast**: Feedback visual inmediato
- **Iconos modernos**: Interfaz intuitiva con Lucide React
- **Navegación mejorada**: Menú móvil y navegación por pestañas

### 📊 Gestión de Datos Avanzada
- **Exportar/Importar**: Backup y restauración de datos
- **Filtros avanzados**: Búsqueda por nombre, categoría, estado
- **Estadísticas en tiempo real**: Resumen visual del inventario
- **Ordenamiento múltiple**: Por nombre, categoría, cantidad, caducidad
- **Indicadores visuales**: Estados de caducidad y stock

### 🤖 IA Integrada
- **Google Gemini API**: Generación de recetas con IA avanzada
- **Recetas variadas**: Ensaladas y platos principales
- **Prompt engineering**: Prompts optimizados para mejores resultados
- **Manejo de errores**: Gestión robusta de fallos de API
- **Estadísticas de uso**: Monitoreo de consumo de API

## 🛠️ Tecnologías

- **Frontend**: React 18 (via CDN)
- **Estilos**: CSS moderno con variables y modo oscuro
- **Base de datos**: IndexedDB v2 con múltiples stores
- **Encriptación**: CryptoJS (AES-256, PBKDF2, SHA256)
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast
- **IA**: Google Gemini API

## 📁 Estructura del Proyecto

```
inventario-refri/
├── index.html          # Página principal con CDNs
├── app.js              # Aplicación React principal
├── utils.js            # Utilidades (encriptación, DB, API)
├── style.css           # Estilos modernos y responsive
└── README.md           # Documentación
```

## 🚀 Instalación y Uso

### Opción 1: Uso Directo (Recomendado)
1. Descarga todos los archivos en una carpeta
2. Abre `index.html` en tu navegador
3. ¡Listo! No necesitas instalar nada

### Opción 2: Servidor Local
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (si lo tienes)
npx serve .

# Con PHP
php -S localhost:8000
```

Luego abre `http://localhost:8000` en tu navegador.

## 🔧 Configuración

### 1. Configurar API Key de Google Gemini
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key gratuita
3. En la app, ve a "Recetas IA" → "Configuración de API Key"
4. Ingresa tu API key y una contraseña de protección
5. ¡Ya puedes generar recetas con IA!

### 2. Personalizar Configuración
- **Tema**: Cambia entre modo claro y oscuro
- **Datos**: Exporta/importa tu inventario
- **API**: Gestiona tu configuración de IA

## 📱 Funcionalidades

### 📦 Gestión de Inventario
- **Agregar productos**: Nombre, categoría, cantidad, fecha de caducidad
- **Editar productos**: Modificar cualquier campo
- **Eliminar productos**: Confirmación antes de eliminar
- **Búsqueda y filtros**: Encuentra productos rápidamente
- **Estadísticas**: Resumen visual del estado del inventario

### 🤖 Generación de Recetas
- **Ensaladas**: Recetas ligeras y saludables
- **Platos principales**: Comidas completas y variadas
- **Ingredientes disponibles**: Solo usa lo que tienes
- **Información nutricional**: Datos de cada receta
- **Exportar recetas**: Guarda tus recetas favoritas

### ⚙️ Configuración
- **Tema personalizable**: Claro/oscuro
- **Backup de datos**: Exportar/importar inventario
- **Gestión de API**: Configurar y proteger tu API key
- **Estadísticas de uso**: Monitorear consumo de IA

## 🔒 Seguridad

### Encriptación
- **AES-256**: Algoritmo de encriptación estándar
- **PBKDF2**: Derivación segura de claves
- **Salt único**: Para cada encriptación
- **SHA256**: Hashing de contraseñas

### Protección de Datos
- **Almacenamiento local**: Tus datos nunca salen de tu dispositivo
- **API key protegida**: Encriptada con tu contraseña
- **Validación de entrada**: Prevención de datos maliciosos
- **Rate limiting**: Protección contra abuso de API

## 📊 Base de Datos

### IndexedDB v2
- **Store productos**: Inventario principal
- **Store configuración**: Configuraciones de la app
- **Store cache**: Cache para optimización
- **Migraciones automáticas**: Actualización de esquemas

### Estructura de Datos
```javascript
// Producto
{
  id: number,
  nombre: string,
  categoria: string,
  cantidad: number,
  unidad: string,
  fechaCaducidad: string,
  fechaCreacion: string
}

// Configuración
{
  key: string,
  value: any,
  timestamp: number
}
```

## 🎨 Temas y Personalización

### Modo Oscuro/Claro
- **Detección automática**: Basada en preferencias del sistema
- **Persistencia**: Recuerda tu preferencia
- **Transiciones suaves**: Cambio visual fluido
- **Accesibilidad**: Cumple estándares WCAG

### Colores y Estilos
- **Variables CSS**: Fácil personalización
- **Diseño responsive**: Adaptable a cualquier pantalla
- **Iconos consistentes**: Lucide React
- **Tipografía moderna**: Sistema de fuentes optimizado

## 🔧 Desarrollo

### Estructura de Componentes
- **App**: Componente principal
- **ProductForm**: Formulario de productos
- **ProductList**: Lista y filtros
- **RecipeGenerator**: Generación de recetas
- **Utils**: Utilidades compartidas

### Patrones de Diseño
- **Componentes funcionales**: React hooks
- **Estado centralizado**: Gestión de datos
- **Separación de responsabilidades**: Módulos especializados
- **Error boundaries**: Manejo robusto de errores

## 📈 Mejoras v2.0

### Comparación con v1.0
| Característica | v1.0 | v2.0 |
|---|---|---|
| Encriptación | XOR básica | AES-256 + PBKDF2 |
| Framework | Vanilla JS | React 18 |
| UI/UX | Básica | Moderna + responsive |
| Cache | No | Memoria + IndexedDB |
| Rate Limiting | No | Sí |
| Modo Oscuro | No | Sí |
| Export/Import | No | Sí |
| Validación | Básica | Avanzada |
| Error Handling | Básico | Robusto |
| Performance | Básica | Optimizada |

### Nuevas Funcionalidades
- ✅ Encriptación AES-256
- ✅ Modo oscuro/claro
- ✅ Exportar/importar datos
- ✅ Rate limiting para API
- ✅ Cache en memoria
- ✅ Validación avanzada
- ✅ Diseño responsive
- ✅ Notificaciones toast
- ✅ Estadísticas en tiempo real
- ✅ Filtros avanzados

## 🐛 Solución de Problemas

### Problemas Comunes

**La app no carga**
- Verifica que todos los archivos estén en la misma carpeta
- Asegúrate de usar un navegador moderno (Chrome, Firefox, Safari, Edge)
- Revisa la consola del navegador para errores

**No se guardan los datos**
- Verifica que IndexedDB esté habilitado
- Limpia el caché del navegador
- Intenta en modo incógnito

**Error con la API de IA**
- Verifica que tu API key sea válida
- Asegúrate de tener saldo en tu cuenta de Google
- Revisa la configuración de rate limiting

**Problemas de rendimiento**
- Cierra otras pestañas del navegador
- Limpia el caché del navegador
- Verifica que tengas suficiente memoria RAM

### Logs y Debugging
- Abre las herramientas de desarrollador (F12)
- Revisa la consola para errores
- Verifica la pestaña Application → Storage
- Monitorea el uso de red en la pestaña Network

## 🤝 Contribuir

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature
3. Haz tus cambios
4. Prueba exhaustivamente
5. Envía un pull request

### Estándares de Código
- Usa ES6+ features
- Sigue las convenciones de React
- Documenta funciones complejas
- Mantén la compatibilidad con navegadores modernos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

## 🙏 Agradecimientos

- **Google Gemini**: Por proporcionar la API de IA gratuita
- **React Team**: Por el framework increíble
- **Lucide**: Por los iconos hermosos
- **CryptoJS**: Por las utilidades de encriptación
- **Comunidad open source**: Por todas las librerías utilizadas

## 📞 Soporte

Si tienes problemas o sugerencias:
1. Revisa la sección de solución de problemas
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles

---

**¡Disfruta gestionando tu refrigerador con IA! 🍽️🤖** 
