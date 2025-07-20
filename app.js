// --- Configuración ---
const CATEGORIAS = [
  "Lácteos",
  "Verduras",
  "Frutas",
  "Proteinas",
  "Legumbres",
  "Otros"
];

// --- Funciones de seguridad para API key ---
function encriptarTexto(texto, contraseña) {
  // Función simple de encriptación usando la contraseña como clave
  let resultado = '';
  for (let i = 0; i < texto.length; i++) {
    const charCode = texto.charCodeAt(i) ^ contraseña.charCodeAt(i % contraseña.length);
    resultado += String.fromCharCode(charCode);
  }
  return btoa(resultado); // Codificar en base64
}

function desencriptarTexto(textoEncriptado, contraseña) {
  try {
    const texto = atob(textoEncriptado); // Decodificar base64
    let resultado = '';
    for (let i = 0; i < texto.length; i++) {
      const charCode = texto.charCodeAt(i) ^ contraseña.charCodeAt(i % contraseña.length);
      resultado += String.fromCharCode(charCode);
    }
    return resultado;
  } catch (error) {
    return null;
  }
}

function guardarAPIKeySegura(apiKey, contraseña) {
  const apiKeyEncriptada = encriptarTexto(apiKey, contraseña);
  localStorage.setItem('api_key_encriptada', apiKeyEncriptada);
  localStorage.setItem('api_key_hash', btoa(contraseña)); // Hash simple de la contraseña
}

function obtenerAPIKeySegura(contraseña) {
  const apiKeyEncriptada = localStorage.getItem('api_key_encriptada');
  const hashGuardado = localStorage.getItem('api_key_hash');
  
  if (!apiKeyEncriptada || !hashGuardado) {
    return null;
  }
  
  // Verificar contraseña
  if (btoa(contraseña) !== hashGuardado) {
    return null;
  }
  
  return desencriptarTexto(apiKeyEncriptada, contraseña);
}

function tieneAPIKeyGuardada() {
  return localStorage.getItem('api_key_encriptada') !== null;
}

function limpiarAPIKey() {
  localStorage.removeItem('api_key_encriptada');
  localStorage.removeItem('api_key_hash');
}

// Función para configurar API key por primera vez
window.configurarAPIKey = function() {
  const apiKey = prompt('Ingresa tu API key de Google Gemini:');
  if (!apiKey) return;
  
  if (apiKey.length < 20) {
    alert('La API key parece ser muy corta. Verifica que sea una clave válida de Google Gemini.');
    return;
  }
  
  const contraseña = prompt('Crea una contraseña para proteger tu API key:');
  if (!contraseña) return;
  
  if (contraseña.length < 4) {
    alert('La contraseña debe tener al menos 4 caracteres.');
    return;
  }
  
  const confirmarContraseña = prompt('Confirma tu contraseña:');
  if (contraseña !== confirmarContraseña) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  
  guardarAPIKeySegura(apiKey, contraseña);
  alert('✅ API key configurada correctamente. Ya no necesitarás ingresarla cada vez.');
};

// Función para cambiar API key
window.cambiarAPIKey = function() {
  const contraseña = prompt('Ingresa tu contraseña actual:');
  if (!contraseña) return;
  
  const apiKeyActual = obtenerAPIKeySegura(contraseña);
  if (!apiKeyActual) {
    alert('❌ Contraseña incorrecta.');
    return;
  }
  
  const nuevaAPIKey = prompt('Ingresa tu nueva API key de Google Gemini:');
  if (!nuevaAPIKey) return;
  
  if (nuevaAPIKey.length < 20) {
    alert('La API key parece ser muy corta. Verifica que sea una clave válida de Google Gemini.');
    return;
  }
  
  const nuevaContraseña = prompt('Ingresa tu contraseña (o la misma si no quieres cambiarla):');
  if (!nuevaContraseña) return;
  
  guardarAPIKeySegura(nuevaAPIKey, nuevaContraseña);
  alert('✅ API key actualizada correctamente.');
};

// Función para eliminar API key
window.eliminarAPIKey = function() {
  const contraseña = prompt('Ingresa tu contraseña para confirmar:');
  if (!contraseña) return;
  
  const apiKeyActual = obtenerAPIKeySegura(contraseña);
  if (!apiKeyActual) {
    alert('❌ Contraseña incorrecta.');
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres eliminar tu API key guardada?')) {
    limpiarAPIKey();
    alert('✅ API key eliminada. Tendrás que configurarla nuevamente.');
  }
};

// --- Utilidades IndexedDB ---
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("inventario_refrigerador", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function obtenerProductos() {
  return abrirDB().then(db => {
    return new Promise((resolve) => {
      const tx = db.transaction("productos", "readonly");
      const store = tx.objectStore("productos");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });
  });
}

function guardarProducto(producto) {
  return abrirDB().then(db => {
    return new Promise((resolve) => {
      const tx = db.transaction("productos", "readwrite");
      const store = tx.objectStore("productos");
      store.put(producto);
      tx.oncomplete = () => resolve();
    });
  });
}

function eliminarProducto(id) {
  return abrirDB().then(db => {
    return new Promise((resolve) => {
      const tx = db.transaction("productos", "readwrite");
      const store = tx.objectStore("productos");
      store.delete(id);
      tx.oncomplete = () => resolve();
    });
  });
}

function diasRestantes(fechaCaducidad) {
  const hoy = new Date();
  const cad = new Date(fechaCaducidad);
  const diff = cad - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// --- Precarga de verduras si la base está vacía ---
const VERDURAS_PREDEFINIDAS = [
  "achicoria", "apio", "repollo", "zapallo italiano", "acelga cruda", "espinaca cruda", "lechuga", "pepino ensalada", "rabanito", "tomate", "acelga cocida", "alcachofa", "betarraga", "cebolla", "coliflor", "brócoli", "kale", "espárragos", "espinaca cocida", "champiñones", "porotos verdes", "zanahoria", "zapallito italiano cocido", "palmitos", "palta", "papas"
];

function precargarVerduras() {
  return obtenerProductos().then(productos => {
    if (productos.length === 0) {
      return Promise.all(
        VERDURAS_PREDEFINIDAS.map(nombre => guardarProducto({
          nombre,
          categoria: "Verduras",
          cantidad: "",
          unidad: "",
          fechaCompra: ""
        }))
      );
    }
  });
}

// --- Precarga de frutas si la base está vacía ---
const FRUTAS_PREDEFINIDAS = [
  "caqui", "manzana", "membrillo", "pera", "durazno", "naranja", "kiwi", "tuna", "higos", "mandarinas", "pepino dulce", "frutillas", "melón", "sandía", "frutos rojos", "arándanos", "plátano", "cerezas", "chirimoya", "damasco", "níspero", "piña", "uva"
];

function precargarFrutas() {
  return obtenerProductos().then(productos => {
    const yaExisten = productos.filter(p => p.categoria === "Frutas").map(p => p.nombre);
    const frutasNuevas = FRUTAS_PREDEFINIDAS.filter(nombre => !yaExisten.includes(nombre));
    if (frutasNuevas.length > 0) {
      return Promise.all(
        frutasNuevas.map(nombre => guardarProducto({
          nombre,
          categoria: "Frutas",
          cantidad: "",
          unidad: "",
          fechaCompra: ""
        }))
      );
    }
  });
}

// --- Historial de cambios ---
function abrirDBv2() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("inventario_refrigerador", 2);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("historial")) {
        db.createObjectStore("historial", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function guardarHistorial(id, cambio, cantidad, fecha = new Date()) {
  abrirDBv2().then(db => {
    const tx = db.transaction("historial", "readwrite");
    const store = tx.objectStore("historial");
    store.add({ productoId: id, cambio, cantidad, fecha: fecha.toISOString() });
  });
}

function obtenerHistorial(id) {
  return abrirDBv2().then(db => {
    return new Promise((resolve) => {
      const tx = db.transaction("historial", "readonly");
      const store = tx.objectStore("historial");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.filter(h => h.productoId === id));
    });
  });
}

// Carrito de compras en localStorage
function getCarrito() {
  try {
    return JSON.parse(localStorage.getItem('carritoCompras')) || [];
  } catch {
    return [];
  }
}
function setCarrito(carrito) {
  localStorage.setItem('carritoCompras', JSON.stringify(carrito));
}

// Limpieza de productos para cambiar 'Carnes' a 'Proteinas'
function migrarCarnesAProteinas() {
  return obtenerProductos().then(productos => {
    return Promise.all(productos.map(prod => {
      if (prod.categoria === 'Proteinas') {
        prod.categoria = 'Proteinas';
        return guardarProducto(prod);
      }
      return Promise.resolve();
    }));
  });
}

// Precarga de proteinas si la base está vacía de ellas
const PROTEINAS_PREDEFINIDAS = ["carne", "pollo", "cerdo", "pescado", "atún", "huevo"];
function precargarProteinas() {
  return obtenerProductos().then(productos => {
    const yaExisten = productos.filter(p => p.categoria === "Proteinas").map(p => p.nombre);
    const nuevas = PROTEINAS_PREDEFINIDAS.filter(nombre => !yaExisten.includes(nombre));
    if (nuevas.length > 0) {
      return Promise.all(
        nuevas.map(nombre => guardarProducto({
          nombre,
          categoria: "Proteinas",
          cantidad: 0,
          fechaCompra: ""
        }))
      );
    }
  });
}

// Precarga de lácteos si la base está vacía de ellos
const LACTEOS_PREDEFINIDOS = ["leche", "yogurt", "quesos", "crema de leche"];
function precargarLacteos() {
  return obtenerProductos().then(productos => {
    const yaExisten = productos.filter(p => p.categoria === "Lácteos").map(p => p.nombre);
    const nuevas = LACTEOS_PREDEFINIDOS.filter(nombre => !yaExisten.includes(nombre));
    if (nuevas.length > 0) {
      return Promise.all(
        nuevas.map(nombre => guardarProducto({
          nombre,
          categoria: "Lácteos",
          cantidad: 0,
          fechaCompra: ""
        }))
      );
    }
  });
}

// Migrar 'Bebidas' a 'Legumbres' en productos existentes
function migrarBebidasALegumbres() {
  return obtenerProductos().then(productos => {
    return Promise.all(productos.map(prod => {
      if (prod.categoria === 'Bebidas') {
        prod.categoria = 'Legumbres';
        return guardarProducto(prod);
      }
      return Promise.resolve();
    }));
  });
}
// Precarga de legumbres si la base está vacía de ellas
const LEGUMBRES_PREDEFINIDAS = ["porotos negros", "lentejas", "arroz", "fideos"];
function precargarLegumbres() {
  return obtenerProductos().then(productos => {
    const yaExisten = productos.filter(p => p.categoria === "Legumbres").map(p => p.nombre);
    const nuevas = LEGUMBRES_PREDEFINIDAS.filter(nombre => !yaExisten.includes(nombre));
    if (nuevas.length > 0) {
      return Promise.all(
        nuevas.map(nombre => guardarProducto({
          nombre,
          categoria: "Legumbres",
          cantidad: 0,
          fechaCompra: ""
        }))
      );
    }
  });
}

// Platos de ejemplo para el menú
const PLATOS = [
  {
    nombre: "Almuerzo Proteico",
    ingredientes: ["proteinas", "legumbres", "verduras", "frutas"],
    pasos: [
      "Cocina las verduras al vapor o salteadas con un poco de aceite y sal.",
      "Cocina la proteína (carne, pollo, atún, etc.) a la plancha o hervida.",
      "Prepara la legumbre (lentejas, porotos, etc.) según corresponda.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Legumbres con Verduras",
    ingredientes: ["legumbres", "verduras"],
    pasos: [
      "Cocina las legumbres con agua, sal y un poco de aceite.",
      "Añade las verduras picadas y cocina hasta que estén blandas.",
      "Sirve caliente."
    ]
  },
  {
    nombre: "Pescado con Arroz",
    ingredientes: ["proteinas", "verduras", "arroz", "frutas"],
    pasos: [
      "Cocina el pescado a la plancha con un poco de aceite y sal.",
      "Cocina el arroz y las verduras al vapor.",
      "Sirve el pescado acompañado del arroz, verduras y fruta."
    ]
  }
];

// 10 menús/platos principales con ensalada incluida
const MENUS = [
  {
    nombre: "Almuerzo clásico",
    categorias: ["carne", "guarnicion", "frutas"],
    ensalada: true,
    pasos: [
      "Asa la carne de vacuno/lomo liso/filete a la plancha o hiérvela (15-20 min).",
      "Cocina la guarnición (arroz, fideos, papas, etc.) en agua con sal (15-20 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite, sal y vinagre.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Pollo con papas y ensalada",
    categorias: ["pollo", "papas", "frutas"],
    ensalada: true,
    pasos: [
      "Asa el pollo al horno o a la plancha (20-30 min).",
      "Cocina las papas en agua con sal (20 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Pescado con quinoa y ensalada",
    categorias: ["pescado", "quinoa", "frutas"],
    ensalada: true,
    pasos: [
      "Cocina el pescado a la plancha o al vapor (10-15 min).",
      "Cocina la quinoa en agua con sal (15 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Legumbres con mote y ensalada",
    categorias: ["legumbres", "mote", "frutas"],
    ensalada: true,
    pasos: [
      "Cocina las legumbres y el mote en agua con sal (30-40 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Cerdo con cuscús y ensalada",
    categorias: ["cerdo", "cuscús", "frutas"],
    ensalada: true,
    pasos: [
      "Asa el cerdo a la plancha (15 min).",
      "Prepara el cuscús según instrucciones del envase.",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Huevo duro con papas y ensalada",
    categorias: ["huevo", "papas", "frutas"],
    ensalada: true,
    pasos: [
      "Cocina el huevo duro (10 min).",
      "Cocina las papas en agua con sal (20 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Atún con fideos y ensalada",
    categorias: ["atún", "fideos", "frutas"],
    ensalada: true,
    pasos: [
      "Cocina los fideos en agua con sal (10 min).",
      "Sirve el atún en conserva.",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  {
    nombre: "Tortilla de verduras con ensalada",
    categorias: ["huevo", "frutas"],
    ensalada: true,
    pasos: [
      "Bate los huevos y mezcla con las verduras seleccionadas picadas.",
      "Cocina la tortilla en sartén antiadherente (5-7 min por lado).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve la tortilla con la ensalada y fruta fresca."
    ]
  },
  {
    nombre: "Guiso de legumbres y verduras",
    categorias: ["legumbres", "frutas"],
    ensalada: true,
    pasos: [
      "Cocina las legumbres con las verduras seleccionadas en agua con sal (40 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve el guiso acompañado de la ensalada y fruta fresca."
    ]
  },
  {
    nombre: "Pescado al horno con papas y ensalada",
    categorias: ["pescado", "papas", "frutas"],
    ensalada: true,
    pasos: [
      "Hornea el pescado con un poco de aceite, sal y limón (20 min).",
      "Cocina las papas en agua con sal (20 min).",
      "Prepara una ensalada clásica con los ingredientes disponibles. Aliña con aceite y sal.",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  }
];

let modoMenu = false;
let modoRecetasEnsaladas = false;

// Filtro de recetas
let filtroRecetas = 'todas'; // 'todas', 'completas', 'faltantes'

// Definir recetas reales y platos principales
const RECETAS = [
  {
    nombre: "Ensalada de tomate y cebolla",
    categorias: ["verduras"],
    productos: ["tomate", "cebolla"],
    extras: ["aceite de oliva", "sal", "vinagre"],
    pasos: [
      "Corta el tomate y la cebolla en rodajas.",
      "Mezcla en un bol, añade aceite, sal y vinagre."
    ]
  },
  {
    nombre: "Ensalada de palta y tomate",
    categorias: ["verduras"],
    productos: ["palta", "tomate", "cebolla"],
    extras: ["aceite de oliva", "sal", "limón"],
    pasos: [
      "Corta la palta y el tomate en cubos, la cebolla en pluma.",
      "Mezcla todo, añade aceite, sal y jugo de limón."
    ]
  },
  {
    nombre: "Plato de atún con arroz",
    categorias: ["proteinas"],
    productos: ["atún", "arroz"],
    extras: ["aceite de oliva", "sal"],
    pasos: [
      "Cocina el arroz.",
      "Sirve el atún con el arroz, añade aceite y sal."
    ]
  },
  {
    nombre: "Almuerzo clásico",
    categorias: ["proteinas", "guarnicion", "frutas"],
    productos: [],
    extras: ["aceite de oliva", "sal"],
    pasos: [
      "Cocina la verdura seleccionada al vapor o en ensalada.",
      "Cocina la proteína (carne, pollo, atún, etc.) a la plancha o hervida.",
      "Prepara la guarnición (arroz, fideos, papas, etc.).",
      "Sirve todo junto y acompaña con fruta fresca."
    ]
  },
  // ... puedes agregar más recetas aquí ...
];

// Mapear productos a categorías especiales
const MAPEO_CATEGORIAS = {
  proteinas: ["carne", "pollo", "cerdo", "pescado", "atún", "huevo", "jurel", "salmón", "reineta", "merluza"],
  guarnicion: ["arroz", "fideos", "papas", "quinoa", "cuscús", "mote", "granos"],
  frutas: ["plátano", "manzana", "pera", "uva", "kiwi", "naranja", "mandarina", "frutilla", "palta"],
  legumbres: ["lentejas", "porotos negros", "porotos", "garbanzos", "habas", "arvejas", "choclo"],
  verduras: ["lechuga", "tomate", "cebolla", "zapallo italiano", "zanahoria", "palta", "pepino", "betarraga", "apio", "repollo", "acelga", "espinaca", "rabanito", "alcachofa", "coliflor", "brócoli", "kale", "espárragos", "champiñones", "porotos verdes", "zapallito italiano cocido", "palmitos", "achicoria"]
};

function obtenerCombinaciones(receta, productos) {
  // Para cada categoría especial, busca productos disponibles
  let combinaciones = [{}];
  for (const cat of receta.categorias || []) {
    let opciones = productos.filter(p => (MAPEO_CATEGORIAS[cat]||[]).includes(p.nombre.toLowerCase()) && p.cantidad > 0);
    if (opciones.length === 0) {
      // Si no hay productos, marca como faltante
      combinaciones.forEach(c => c[cat] = null);
    } else {
      // Genera combinaciones para cada opción
      let nuevasCombinaciones = [];
      for (const c of combinaciones) {
        for (const prod of opciones) {
          nuevasCombinaciones.push({ ...c, [cat]: prod });
        }
      }
      combinaciones = nuevasCombinaciones;
    }
  }
  // Para productos específicos
  for (const prodName of receta.productos || []) {
    let opciones = productos.filter(p => p.nombre.toLowerCase() === prodName.toLowerCase() && p.cantidad > 0);
    if (opciones.length === 0) {
      combinaciones.forEach(c => c[prodName] = null);
    } else {
      combinaciones.forEach(c => c[prodName] = opciones[0]);
    }
  }
  return combinaciones;
}

// Recetas clásicas de ensaladas (combinaciones típicas)
const ENSALADAS_CLASICAS = [
  // Ensaladas básicas de 2 ingredientes
  ["tomate", "cebolla"],
  ["lechuga", "tomate"],
  ["palta", "tomate"],
  ["zanahoria", "betarraga"],
  ["lechuga", "cebolla"],
  ["lechuga", "palta"],
  ["tomate", "pepino"],
  ["lechuga", "zanahoria"],
  ["palta", "cebolla"],
  ["zanahoria", "pepino"],
  ["betarraga", "cebolla"],
  ["tomate", "betarraga"],
  ["lechuga", "pepino"],
  ["palta", "zanahoria"],
  ["cebolla", "pepino"],
  
  // Ensaladas de 3 ingredientes
  ["lechuga", "tomate", "cebolla"],
  ["lechuga", "tomate", "palta"],
  ["lechuga", "palta", "cebolla"],
  ["tomate", "cebolla", "pepino"],
  ["lechuga", "zanahoria", "cebolla"],
  ["palta", "tomate", "pepino"],
  ["betarraga", "zanahoria", "cebolla"],
  ["lechuga", "tomate", "pepino"],
  ["palta", "zanahoria", "cebolla"],
  ["tomate", "betarraga", "cebolla"],
  ["lechuga", "palta", "zanahoria"],
  ["zanahoria", "pepino", "cebolla"],
  ["betarraga", "tomate", "pepino"],
  ["lechuga", "betarraga", "cebolla"],
  
  // Ensaladas de 4 ingredientes
  ["lechuga", "tomate", "cebolla", "pepino"],
  ["lechuga", "tomate", "palta", "cebolla"],
  ["lechuga", "palta", "zanahoria", "cebolla"],
  ["tomate", "betarraga", "zanahoria", "cebolla"],
  ["lechuga", "tomate", "pepino", "zanahoria"],
  ["palta", "tomate", "cebolla", "pepino"],
  ["betarraga", "zanahoria", "cebolla", "pepino"],
  ["lechuga", "palta", "betarraga", "cebolla"],
  ["tomate", "zanahoria", "pepino", "cebolla"],
  ["lechuga", "betarraga", "tomate", "pepino"],
  
  // Ensaladas de 5 ingredientes
  ["lechuga", "tomate", "cebolla", "pepino", "zanahoria"],
  ["lechuga", "tomate", "palta", "cebolla", "pepino"],
  ["lechuga", "palta", "zanahoria", "cebolla", "betarraga"],
  ["tomate", "betarraga", "zanahoria", "cebolla", "pepino"],
  ["lechuga", "palta", "betarraga", "tomate", "cebolla"],
  
  // Ensaladas temáticas
  ["lechuga", "tomate", "palta"], // Ensalada César básica
  ["betarraga", "zanahoria", "cebolla"], // Ensalada rusa básica
  ["tomate", "cebolla", "pepino"], // Ensalada griega básica
  ["lechuga", "zanahoria", "pepino"], // Ensalada verde crujiente
  ["palta", "tomate", "betarraga"], // Ensalada colorida
  ["lechuga", "betarraga", "cebolla"], // Ensalada de invierno
  ["tomate", "zanahoria", "pepino"], // Ensalada de verano
  ["palta", "zanahoria", "cebolla"], // Ensalada nutritiva
  ["lechuga", "tomate", "betarraga"], // Ensalada mediterránea
  ["cebolla", "pepino", "zanahoria"] // Ensalada crujiente
];

function mejorEnsalada(productos) {
  // Obtener todas las verduras disponibles
  const verdurasDisponibles = productos.filter(p => 
    MAPEO_CATEGORIAS.verduras.includes(p.nombre.toLowerCase()) && p.cantidad > 0
  ).map(p => p.nombre.toLowerCase());
  
  if (verdurasDisponibles.length === 0) return null;
  
  // Si hay pocas verduras, crear combinación aleatoria directamente
  if (verdurasDisponibles.length <= 3) {
    const ingredientesSeleccionados = [...verdurasDisponibles].sort(() => Math.random() - 0.5);
    return {
      ingredientes: ingredientesSeleccionados,
      pasos: generarPasosEnsalada(ingredientesSeleccionados)
    };
  }
  
  // Mezclar el array de recetas para no usar siempre la primera
  const recetasMezcladas = [...ENSALADAS_CLASICAS].sort(() => Math.random() - 0.5);
  
  // Buscar la mejor combinación de ensalada clásica según el inventario
  for (const receta of recetasMezcladas) {
    if (receta.every(ing => verdurasDisponibles.includes(ing))) {
      return {
        ingredientes: receta,
        pasos: generarPasosEnsalada(receta)
      };
    }
  }
  
  // Si no hay ninguna combinación clásica, crear una combinación aleatoria
  if (verdurasDisponibles.length >= 2) {
    // Seleccionar 2-4 ingredientes aleatoriamente
    const numIngredientes = Math.min(verdurasDisponibles.length, Math.floor(Math.random() * 3) + 2);
    const ingredientesSeleccionados = [];
    
    // Mezclar el array y tomar los primeros elementos
    const verdurasMezcladas = [...verdurasDisponibles].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numIngredientes; i++) {
      ingredientesSeleccionados.push(verdurasMezcladas[i]);
    }
    
    return {
      ingredientes: ingredientesSeleccionados,
      pasos: generarPasosEnsalada(ingredientesSeleccionados)
    };
  }
  
  // Si solo hay una verdura, usarla
  if (verdurasDisponibles.length === 1) {
    return {
      ingredientes: verdurasDisponibles,
      pasos: generarPasosEnsalada(verdurasDisponibles)
    };
  }
  
  return null;
}

function generarPasosEnsalada(ingredientes) {
  let pasos = [];
  
  // Determinar el tipo de ensalada según los ingredientes
  let tipoEnsalada = "clásica";
  if (ingredientes.includes('lechuga') && ingredientes.includes('tomate') && ingredientes.includes('palta')) {
    tipoEnsalada = "César";
  } else if (ingredientes.includes('betarraga') && ingredientes.includes('zanahoria')) {
    tipoEnsalada = "Rusa";
  } else if (ingredientes.includes('tomate') && ingredientes.includes('cebolla') && ingredientes.includes('pepino')) {
    tipoEnsalada = "Griega";
  } else if (ingredientes.length >= 4) {
    tipoEnsalada = "Mixta";
  }
  
  // Paso 1: Preparación específica según ingredientes
  let preparacion = [];
  ingredientes.forEach(ing => {
    if (ing === 'lechuga') preparacion.push('Lava y corta la lechuga en trozos medianos');
    else if (ing === 'tomate') preparacion.push('Lava y corta el tomate en rodajas o cubos medianos');
    else if (ing === 'cebolla') preparacion.push('Pela y corta la cebolla en plumas finas (remoja en agua fría 10 min para quitar el picor)');
    else if (ing === 'palta') preparacion.push('Pela y corta la palta en cubos o rodajas');
    else if (ing === 'zanahoria') preparacion.push('Pela y ralla la zanahoria o córtala en juliana fina');
    else if (ing === 'betarraga') preparacion.push('Pela y corta la betarraga en cubos pequeños o rállala');
    else if (ing === 'pepino') preparacion.push('Lava y corta el pepino en rodajas o cubos (opcional: quita las semillas)');
    else preparacion.push(`Lava y corta el ${ing} según prefieras`);
  });
  pasos.push(preparacion.join('. ') + '.');
  
  // Paso 2: Aliño específico según el tipo de ensalada
  let aliño = "";
  if (tipoEnsalada === "César") {
    aliño = "Coloca todos los ingredientes en un bowl. Aliña con aceite de oliva, jugo de limón, sal y pimienta. Opcional: añade queso parmesano rallado.";
  } else if (tipoEnsalada === "Rusa") {
    aliño = "Mezcla todos los ingredientes. Aliña con aceite de oliva, vinagre, sal y un toque de azúcar para balancear el sabor.";
  } else if (tipoEnsalada === "Griega") {
    aliño = "Coloca los ingredientes en capas. Aliña con aceite de oliva, orégano seco, sal y limón. Opcional: añade queso feta.";
  } else if (tipoEnsalada === "Mixta") {
    aliño = "Coloca todos los ingredientes en un bowl grande. Aliña con aceite de oliva, vinagre balsámico, sal y hierbas frescas si tienes.";
  } else {
    aliño = "Coloca todos los ingredientes en un bowl y mezcla suavemente. Aliña con aceite de oliva, sal y limón al gusto.";
  }
  pasos.push(aliño);
  
  // Paso 3: Consejo adicional según ingredientes
  if (ingredientes.includes('palta')) {
    pasos.push("Consejo: Añade la palta al final para que no se oxide y mantenga su color verde.");
  }
  if (ingredientes.includes('betarraga')) {
    pasos.push("Consejo: La betarraga puede manchar, usa guantes si es necesario.");
  }
  if (ingredientes.length >= 4) {
    pasos.push("Consejo: Deja reposar la ensalada 5-10 minutos antes de servir para que los sabores se integren.");
  }
  
  return pasos;
}

function obtenerCombinacionesPersonalizadas(receta, productos) {
  // Selecciona 1 proteína, 1 guarnición, 1 fruta, mejor ensalada
  let proteinas = productos.filter(p => MAPEO_CATEGORIAS.proteinas.includes(p.nombre.toLowerCase()) && p.cantidad > 0);
  let guarniciones = productos.filter(p => MAPEO_CATEGORIAS.guarnicion.includes(p.nombre.toLowerCase()) && p.cantidad > 0);
  let frutas = productos.filter(p => MAPEO_CATEGORIAS.frutas.includes(p.nombre.toLowerCase()) && p.cantidad > 0);
  let legumbres = productos.filter(p => MAPEO_CATEGORIAS.legumbres.includes(p.nombre.toLowerCase()) && p.cantidad > 0);
  let ensalada = mejorEnsalada(productos);
  let combinaciones = [];
  // Generar todas las combinaciones posibles
  for (const prot of proteinas.length ? proteinas : [null]) {
    for (const guar of guarniciones.length ? guarniciones : [null]) {
      for (const fru of frutas.length ? frutas : [null]) {
        for (const leg of legumbres.length ? legumbres : [null]) {
          combinaciones.push({
            proteina: prot,
            guarnicion: guar,
            fruta: fru,
            legumbre: leg,
            ensalada
          });
        }
      }
    }
  }
  return combinaciones;
}

// --- Renderizado y lógica de la app ---
const root = document.getElementById("root");
let editId = null;
// Leer categoría seleccionada de localStorage al iniciar
let categoriaSeleccionada = localStorage.getItem('categoriaSeleccionada') || CATEGORIAS[0];
let modoListaCompras = false;
let textoBusqueda = "";

function render(form = null, alerta = "") {
  // Guardar posición del cursor y foco antes del render
  let busquedaInput = document.getElementById("busqueda");
  let busquedaHadFocus = false;
  let cursorStart = 0, cursorEnd = 0;
  if (busquedaInput && document.activeElement === busquedaInput) {
    busquedaHadFocus = true;
    cursorStart = busquedaInput.selectionStart;
    cursorEnd = busquedaInput.selectionEnd;
  }
  if (modoMenu) {
    obtenerProductos().then(productos => {
      function pickRandom(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

      function obtenerCombinacionMenuPersonalizada(menu, productos) {
        let seleccion = {};
        for (const cat of menu.categorias) {
          let opciones = productos.filter(p => {
            if (cat === 'carne') return ['carne', 'vacuno', 'lomo liso', 'filete', 'posta', 'pollo ganso', 'asiento picaña'].includes(p.nombre.toLowerCase());
            if (cat === 'pollo') return p.nombre.toLowerCase().includes('pollo');
            if (cat === 'pescado') return ['pescado', 'salmón', 'reineta', 'merluza', 'atún', 'jurel'].includes(p.nombre.toLowerCase());
            if (cat === 'cerdo') return p.nombre.toLowerCase().includes('cerdo');
            if (cat === 'huevo') return p.nombre.toLowerCase().includes('huevo');
            if (cat === 'atún') return p.nombre.toLowerCase().includes('atún');
            if (cat === 'legumbres') return MAPEO_CATEGORIAS.legumbres.includes(p.nombre.toLowerCase());
            if (cat === 'guarnicion') return MAPEO_CATEGORIAS.guarnicion.includes(p.nombre.toLowerCase());
            if (cat === 'papas') return p.nombre.toLowerCase().includes('papa');
            if (cat === 'cuscús') return p.nombre.toLowerCase().includes('cuscús');
            if (cat === 'quinoa') return p.nombre.toLowerCase().includes('quinoa');
            if (cat === 'fideos') return p.nombre.toLowerCase().includes('fideo');
            if (cat === 'mote') return p.nombre.toLowerCase().includes('mote');
            if (cat === 'frutas') return MAPEO_CATEGORIAS.frutas.includes(p.nombre.toLowerCase());
            return false;
          }).filter(p => p.cantidad > 0);
          seleccion[cat] = pickRandom(opciones) || null;
        }
        // Ensalada: buscar la mejor combinación clásica posible
        if (menu.ensalada) {
          const ensalada = mejorEnsalada(productos);
          seleccion.ensalada = ensalada;
        }
        return seleccion;
      }

      let sugerencias = MENUS.map(menu => {
        let seleccionada = obtenerCombinacionMenuPersonalizada(menu, productos);
        // Filtro: completa si todos los ingredientes principales están presentes
        let completa = menu.categorias.every(cat => seleccionada[cat]) && (!menu.ensalada || (seleccionada.ensalada && seleccionada.ensalada.ingredientes && seleccionada.ensalada.ingredientes.length >= 2));
        let faltantes = menu.categorias.filter(cat => !seleccionada[cat]);
        return { menu, seleccionada, completa, faltantes };
      });
      let mostrar = sugerencias;
      if (filtroRecetas === 'completas') mostrar = sugerencias.filter(s => s.completa);
      if (filtroRecetas === 'faltantes') mostrar = sugerencias.filter(s => !s.completa);
      root.innerHTML = `
        <h1>Menú de Recetas</h1>
        <button id="btn-volver" style="margin-bottom:16px">Volver al inventario</button>
        <div class="filtros" style="margin-bottom:16px">
          <label><input type="radio" name="filtroRecetas" value="todas" ${filtroRecetas==='todas'?'checked':''}/> Todas</label>
          <label><input type="radio" name="filtroRecetas" value="completas" ${filtroRecetas==='completas'?'checked':''}/> Solo completas</label>
          <label><input type="radio" name="filtroRecetas" value="faltantes" ${filtroRecetas==='faltantes'?'checked':''}/> Con faltantes</label>
          <button id="btn-regenerar" style="margin-top:8px">Regenerar menú</button>
          <button id="btn-generar-plato-ia" style="margin-top:8px;margin-left:8px;background:#3182ce;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer">🤖 Generar Plato con IA</button>
        </div>
        ${mostrar.map(({menu, seleccionada, completa, faltantes}) => `
          <div class="menu-item" style="margin-bottom:24px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f9fafb">
            <h3>${menu.nombre}</h3>
            <ul>
              ${menu.categorias.map(cat => `<li><b>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</b> ${seleccionada[cat] ? seleccionada[cat].nombre : '<span style=\'color:#e53e3e\'>FALTA</span>'}</li>`).join('')}
              ${seleccionada.ensalada ? `<li><b>Ensalada:</b> ${seleccionada.ensalada.ingredientes ? seleccionada.ensalada.ingredientes.join(', ') : 'No disponible'}</li>` : ''}
            </ul>
            <strong>Preparación:</strong>
            <ol>
              ${menu.pasos.map((paso, idx) => {
                let pasoFinal = paso;
                menu.categorias.forEach(cat => {
                  if (seleccionada[cat]) {
                    pasoFinal = pasoFinal.replace(new RegExp(cat, 'gi'), seleccionada[cat].nombre);
                  } else {
                    pasoFinal = pasoFinal.replace(new RegExp(cat, 'gi'), '<span style=\'color:#e53e3e;font-weight:bold\'>NO DISPONIBLE</span>');
                  }
                });
                return `<li${!completa && faltantes.some(f => pasoFinal.includes('NO DISPONIBLE')) ? " style='color:#e53e3e'" : ''}>${pasoFinal}</li>`;
              }).join('')}
              ${seleccionada.ensalada && seleccionada.ensalada.pasos ? seleccionada.ensalada.pasos.map((paso, idx) => `<li>${paso}</li>`).join('') : ''}
            </ol>
          </div>
        `).join('')}
      `;
      // Filtro de recetas
      document.querySelectorAll('input[name="filtroRecetas"]').forEach(radio => {
        radio.onchange = function() {
          filtroRecetas = this.value;
          render();
        };
      });
      const btnRegenerar = document.getElementById("btn-regenerar");
      if (btnRegenerar) {
        btnRegenerar.onclick = function() {
          render();
        };
      }
      const btnVolver = document.getElementById("btn-volver");
      if (btnVolver) {
        btnVolver.onclick = function() {
          modoMenu = false;
          render();
        };
      }
      
      const btnGenerarPlatoIA = document.getElementById("btn-generar-plato-ia");
      if (btnGenerarPlatoIA) {
        btnGenerarPlatoIA.onclick = async function() {
          // Obtener ingredientes disponibles
          const ingredientesDisponibles = productos.filter(p => p.cantidad > 0).map(p => p.nombre);
          
          if (ingredientesDisponibles.length === 0) {
            alert('No hay ingredientes disponibles para generar un plato');
            return;
          }
          
          // Verificar si hay API key guardada
          let apiKey = null;
          if (tieneAPIKeyGuardada()) {
            const contraseña = prompt('Ingresa tu contraseña para acceder a la API key:');
            if (contraseña) {
              apiKey = obtenerAPIKeySegura(contraseña);
              if (!apiKey) {
                alert('❌ Contraseña incorrecta. Intenta de nuevo.');
                return;
              }
            } else {
              return; // Usuario canceló
            }
          } else {
            // No hay API key guardada, configurar por primera vez
            if (confirm('No tienes una API key configurada. ¿Quieres configurarla ahora?')) {
              configurarAPIKey();
              return; // El usuario configurará la API key
            } else {
              return;
            }
          }
          
          btnGenerarPlatoIA.textContent = '🤖 Generando plato...';
          btnGenerarPlatoIA.disabled = true;
          
          try {
            const ingredientes = ingredientesDisponibles.slice(0, 8).join(', '); // Limitar a 8 ingredientes
            const platosIA = await generarPlatoGemini(ingredientes, apiKey);
            
            // Mostrar los platos generados
            const resultadoDiv = document.createElement('div');
            resultadoDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);max-width:800px;max-height:90vh;overflow-y:auto;z-index:1000;border:1px solid #e2e8f0';
            resultadoDiv.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h2 style="margin:0;color:#2d3748">🍽️ 10 Platos Generados con IA</h2>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#718096">×</button>
              </div>
              <div style="margin-bottom:16px;padding:12px;background:#f7fafc;border-radius:6px;border:1px solid #e2e8f0">
                <strong>📋 Ingredientes utilizados:</strong> ${ingredientes}
              </div>
              ${platosIA.map((plato, index) => `
                <div style="margin-bottom:24px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f9fafb">
                  <h3 style="margin:0 0 12px 0;color:#2d3748;display:flex;align-items:center">
                    <span style="background:#3182ce;color:white;padding:4px 8px;border-radius:4px;font-size:12px;margin-right:8px">${index + 1}</span>
                    ${plato.titulo}
                  </h3>
                  <div style="margin-bottom:12px;padding:8px;background:#edf2f7;border-radius:4px;font-size:14px">
                    <strong>⏱️ Tiempo:</strong> ${plato.tiempo_preparacion} | <strong>📊 Dificultad:</strong> ${plato.dificultad}
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
                    <div>
                      <h4 style="margin:0 0 8px 0;color:#4a5568">Ingredientes:</h4>
                      <ul style="margin:0;padding-left:16px;font-size:14px">
                        ${plato.ingredientes.map(ing => `<li>${ing}</li>`).join('')}
                      </ul>
                    </div>
                    <div>
                      <h4 style="margin:0 0 8px 0;color:#4a5568">Preparación:</h4>
                      <ol style="margin:0;padding-left:16px;font-size:14px">
                        ${plato.pasos.map(paso => `<li>${paso}</li>`).join('')}
                      </ol>
                    </div>
                  </div>
                  <div style="margin-bottom:12px">
                    <h4 style="margin:0 0 8px 0;color:#4a5568">Información nutricional:</h4>
                    <p style="margin:0;font-size:14px">${plato.nutricion}</p>
                  </div>
                  <div style="padding:8px;background:#edf2f7;border-radius:4px">
                    <strong style="color:#4a5568">💡 Consejos:</strong>
                    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:14px">
                      ${plato.consejos.map(consejo => `<li>${consejo}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
              <p style="margin-top:16px;font-style:italic;color:#666;text-align:center">
                🔄 <button onclick="generarNuevoPlatoIA()" style="background:#3182ce;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer">Generar otros 10 platos</button>
              </p>
            `;
            document.body.appendChild(resultadoDiv);
            
          } catch (error) {
            console.error('Error completo:', error);
            console.error('Tipo de error:', error.constructor.name);
            console.error('Mensaje de error:', error.message);
            console.error('Stack trace:', error.stack);
            
            let mensajeError = 'Error al generar los platos. ';
            
            if (error.message.includes('Error de API: 400')) {
              mensajeError += 'API key inválida. Verifica que tu clave de Google Gemini sea correcta.';
            } else if (error.message.includes('Error de API: 403')) {
              mensajeError += 'API key sin permisos. Verifica que tu clave tenga acceso a Gemini.';
            } else if (error.message.includes('Error de API: 429')) {
              mensajeError += 'Límite de uso excedido. Intenta más tarde.';
            } else if (error.message.includes('Error de API: 500')) {
              mensajeError += 'Error del servidor de Google. Intenta de nuevo.';
            } else if (error.message.includes('fetch')) {
              mensajeError += 'Error de conexión. Verifica tu internet.';
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
              mensajeError += 'Error de conexión. Verifica tu internet.';
            } else if (error.message.includes('parsear')) {
              mensajeError += 'Error en la respuesta de la IA. Intenta de nuevo.';
            } else if (error.message.includes('incompleta')) {
              mensajeError += 'Respuesta incompleta de la IA. Intenta de nuevo.';
            } else {
              mensajeError += `Error inesperado: ${error.message}. Verifica tu API key o intenta de nuevo.`;
            }
            
            alert(mensajeError);
          } finally {
            btnGenerarPlatoIA.textContent = '🤖 Generar Plato con IA';
            btnGenerarPlatoIA.disabled = false;
          }
        };
      }
    });
    return;
  }
  
  if (modoRecetasEnsaladas) {
    obtenerProductos().then(productos => {
      const verdurasDisponibles = productos.filter(p => 
        MAPEO_CATEGORIAS.verduras.includes(p.nombre.toLowerCase()) && p.cantidad > 0
      ).map(p => p.nombre.toLowerCase());
      
      root.innerHTML = `
        <h1>Recetas de Ensaladas</h1>
        <button id="btn-volver-recetas" style="margin-bottom:16px">Volver al inventario</button>
        
        <div style="margin-bottom:20px">
          <h3>Ingredientes disponibles:</h3>
          <p>${verdurasDisponibles.length > 0 ? verdurasDisponibles.join(', ') : 'No hay verduras disponibles'}</p>
        </div>
        
        <div style="margin-bottom:20px">
          <button id="btn-buscar-receta" style="background:#38a169;margin-right:10px">🤖 Generar Receta con IA</button>
        </div>
        
        <div id="receta-resultado" style="display:none;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f9fafb;margin-top:20px">
          <h3 id="receta-titulo"></h3>
          <div id="receta-contenido"></div>
        </div>
      `;
      
      const btnVolver = document.getElementById("btn-volver-recetas");
      if (btnVolver) {
        btnVolver.onclick = function() {
          modoRecetasEnsaladas = false;
          render();
        };
      }
      
      const btnBuscar = document.getElementById("btn-buscar-receta");
      if (btnBuscar) {
        btnBuscar.onclick = async function() {
          if (verdurasDisponibles.length === 0) {
            alert('No hay verduras disponibles para generar una receta');
            return;
          }
          
          // Verificar si hay API key guardada
          let apiKey = null;
          if (tieneAPIKeyGuardada()) {
            const contraseña = prompt('Ingresa tu contraseña para acceder a la API key:');
            if (contraseña) {
              apiKey = obtenerAPIKeySegura(contraseña);
              if (!apiKey) {
                alert('❌ Contraseña incorrecta. Intenta de nuevo.');
                return;
              }
            } else {
              return; // Usuario canceló
            }
          } else {
            // No hay API key guardada, configurar por primera vez
            if (confirm('No tienes una API key configurada. ¿Quieres configurarla ahora?')) {
              configurarAPIKey();
              return; // El usuario configurará la API key
            } else {
              return;
            }
          }
          
          btnBuscar.textContent = '🤖 Generando receta...';
          btnBuscar.disabled = true;
          
          try {
            const ingredientes = verdurasDisponibles.slice(0, 6).join(', '); // Limitar a 6 ingredientes
            const ensaladasIA = await generarRecetaGemini(ingredientes, apiKey);
            
            const resultadoDiv = document.getElementById("receta-resultado");
            const tituloDiv = document.getElementById("receta-titulo");
            const contenidoDiv = document.getElementById("receta-contenido");
            
            tituloDiv.innerHTML = `🥗 10 Ensaladas Generadas con IA`;
            contenidoDiv.innerHTML = `
              <div style="margin-bottom:16px;padding:12px;background:#f7fafc;border-radius:6px;border:1px solid #e2e8f0">
                <strong>📋 Ingredientes utilizados:</strong> ${ingredientes}
              </div>
              ${ensaladasIA.map((ensalada, index) => `
                <div style="margin-bottom:24px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f9fafb">
                  <h3 style="margin:0 0 12px 0;color:#2d3748;display:flex;align-items:center">
                    <span style="background:#38a169;color:white;padding:4px 8px;border-radius:4px;font-size:12px;margin-right:8px">${index + 1}</span>
                    ${ensalada.titulo}
                  </h3>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
                    <div>
                      <h4 style="margin:0 0 8px 0;color:#4a5568">Ingredientes:</h4>
                      <ul style="margin:0;padding-left:16px;font-size:14px">
                        ${ensalada.ingredientes.map(ing => `<li>${ing}</li>`).join('')}
                      </ul>
                    </div>
                    <div>
                      <h4 style="margin:0 0 8px 0;color:#4a5568">Preparación:</h4>
                      <ol style="margin:0;padding-left:16px;font-size:14px">
                        ${ensalada.pasos.map(paso => `<li>${paso}</li>`).join('')}
                      </ol>
                    </div>
                  </div>
                  <div style="margin-bottom:12px">
                    <h4 style="margin:0 0 8px 0;color:#4a5568">Información nutricional:</h4>
                    <p style="margin:0;font-size:14px">${ensalada.nutricion}</p>
                  </div>
                  <div style="padding:8px;background:#edf2f7;border-radius:4px">
                    <strong style="color:#4a5568">💡 Consejos:</strong>
                    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:14px">
                      ${ensalada.consejos.map(consejo => `<li>${consejo}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
              <p style="margin-top:16px;font-style:italic;color:#666;text-align:center">
                🔄 <button onclick="generarNuevaRecetaIA()" style="background:#38a169;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer">Generar otras 10 ensaladas</button>
              </p>
            `;
            resultadoDiv.style.display = 'block';
            
          } catch (error) {
            console.error('Error completo:', error);
            console.error('Tipo de error:', error.constructor.name);
            console.error('Mensaje de error:', error.message);
            console.error('Stack trace:', error.stack);
            
            let mensajeError = 'Error al generar la receta. ';
            
            if (error.message.includes('Error de API: 400')) {
              mensajeError += 'API key inválida. Verifica que tu clave de Google Gemini sea correcta.';
            } else if (error.message.includes('Error de API: 403')) {
              mensajeError += 'API key sin permisos. Verifica que tu clave tenga acceso a Gemini.';
            } else if (error.message.includes('Error de API: 429')) {
              mensajeError += 'Límite de uso excedido. Intenta más tarde.';
            } else if (error.message.includes('Error de API: 500')) {
              mensajeError += 'Error del servidor de Google. Intenta de nuevo.';
            } else if (error.message.includes('fetch')) {
              mensajeError += 'Error de conexión. Verifica tu internet.';
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
              mensajeError += 'Error de conexión. Verifica tu internet.';
            } else if (error.message.includes('parsear')) {
              mensajeError += 'Error en la respuesta de la IA. Intenta de nuevo.';
            } else if (error.message.includes('incompleta')) {
              mensajeError += 'Respuesta incompleta de la IA. Intenta de nuevo.';
            } else {
              mensajeError += `Error inesperado: ${error.message}. Verifica tu API key o intenta de nuevo.`;
            }
            
            alert(mensajeError);
          } finally {
            btnBuscar.textContent = '🤖 Generar Receta con IA';
            btnBuscar.disabled = false;
          }
        };
      }
      
      // Función para generar nueva receta
      window.generarNuevaRecetaIA = function() {
        const btnBuscar = document.getElementById("btn-buscar-receta");
        if (btnBuscar) {
          btnBuscar.click();
        }
      };
    });
    return;
  }
  obtenerProductos().then(productos => {
    // Determinar la categoría seleccionada
    const catSel = form?.categoria || categoriaSeleccionada || CATEGORIAS[0];
    categoriaSeleccionada = catSel;
    localStorage.setItem('categoriaSeleccionada', catSel);
    // Filtrar productos por categoría seleccionada
    let productosFiltrados = productos.filter(p => p.categoria === catSel);
    // Ordenar alfabéticamente por nombre
    productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', {sensitivity:'base'}));
    // Filtrar por búsqueda
    if (textoBusqueda.trim()) {
      productosFiltrados = productosFiltrados.filter(p => p.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()));
    }
    // Carrito
    let carrito = getCarrito();
    // Filtrar por lista de compras (carrito)
    if (modoListaCompras) {
      productosFiltrados = productos.filter(p => carrito.includes(p.id));
    }
    root.innerHTML = `
        <h1>Inventario del Refrigerador</h1>
        ${alerta ? `<div class="alert">${alerta}</div>` : ''}
        
        <div style="margin-bottom:16px;padding:12px;background:#f7fafc;border-radius:6px;border:1px solid #e2e8f0">
          <strong>🔐 Gestión de API Key:</strong>
          ${tieneAPIKeyGuardada() ? 
            '<span style="color:#38a169">✅ Configurada</span> | ' +
            '<button onclick="cambiarAPIKey()" style="background:#3182ce;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px">Cambiar</button> | ' +
            '<button onclick="eliminarAPIKey()" style="background:#e53e3e;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px">Eliminar</button>' :
            '<span style="color:#e53e3e">❌ No configurada</span> | ' +
            '<button onclick="configurarAPIKey()" style="background:#38a169;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px">Configurar</button>'
          }
        </div>
        
        <form id="form-producto" class="form-group">
          <input type="text" id="nombre" placeholder="Nombre del producto" value="${editId ? (productos.find(p => p.id === editId)?.nombre || '') : ''}" required>
          <select id="categoria" required>
            ${CATEGORIAS.map(cat => `<option value="${cat}" ${cat === (editId ? (productos.find(p => p.id === editId)?.categoria || categoriaSeleccionada) : categoriaSeleccionada) ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
          <input type="number" id="cantidad" placeholder="Cantidad" min="0" step="0.1" value="${editId ? (productos.find(p => p.id === editId)?.cantidad || '') : ''}">
          <input type="text" id="unidad" placeholder="Unidad (kg, unidades, etc.)" value="${editId ? (productos.find(p => p.id === editId)?.unidad || '') : ''}">
          <button type="submit">${editId ? 'Actualizar' : 'Agregar'} Producto</button>
          ${editId ? '<button type="button" onclick="cancelarEdicion()">Cancelar</button>' : ''}
        </form>

        <div style="margin: 16px 0">
          <input type="text" id="busqueda" placeholder="Buscar productos..." value="${textoBusqueda}">
          <select id="filtro-categoria" style="margin-left: 8px">
            <option value="">Todas las categorías</option>
            ${CATEGORIAS.map(cat => `<option value="${cat}" ${cat === categoriaSeleccionada ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom: 16px">
          <button onclick="modoListaCompras = !modoListaCompras; render()">${modoListaCompras ? 'Ver Inventario' : 'Ver Lista de Compras'}</button>
          <button onclick="modoMenu = true; render()">Ver Menú</button>
          <button onclick="modoRecetasEnsaladas = true; render()">Recetas de Ensaladas</button>
          <button onclick="limpiarProductos()" style="background: #e53e3e">Limpiar Todo</button>
        </div>

        ${modoListaCompras ? `
          <h2>Lista de Compras</h2>
          <div id="lista-compras"></div>
        ` : `
          <h2>Productos</h2>
          <div id="productos"></div>
        `}
      `;
    // Restaurar foco y posición del cursor en búsqueda
    const newBusquedaInput = document.getElementById("busqueda");
    if (busquedaHadFocus && newBusquedaInput) {
      newBusquedaInput.focus();
      newBusquedaInput.setSelectionRange(cursorStart, cursorEnd);
    }
    
    // Eventos del formulario
    const formProducto = document.getElementById("form-producto");
    if (formProducto) {
      formProducto.onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value;
        const categoria = document.getElementById("categoria").value;
        const cantidad = Number(document.getElementById("cantidad").value) || 0;
        const unidad = document.getElementById("unidad").value;
        
        if (!nombre || !categoria) {
          render(null, "Por favor, completa todos los campos obligatorios.");
          return;
        }
        
        const data = {
          nombre,
          categoria,
          cantidad,
          unidad
        };
        
        if (editId) data.id = editId;
        
        guardarProducto(data).then(() => {
          guardarHistorial(data.id || Date.now(), editId ? "Actualización" : "Alta", data.cantidad);
          location.reload();
        });
      };
    }
    
    // Evento para búsqueda
    if (newBusquedaInput) {
      newBusquedaInput.oninput = function(e) {
        textoBusqueda = this.value;
        render();
      };
    }
    
    // Evento para filtro de categoría
    const filtroCategoria = document.getElementById("filtro-categoria");
    if (filtroCategoria) {
      filtroCategoria.onchange = function() {
        categoriaSeleccionada = this.value;
        localStorage.setItem('categoriaSeleccionada', categoriaSeleccionada);
        render();
      };
    }
    
    // Mostrar productos o lista de compras
    if (modoListaCompras) {
      const carrito = getCarrito();
      const productosCarrito = productos.filter(p => carrito.includes(p.id));
      // Ordenar productos del carrito alfabéticamente
      productosCarrito.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', {sensitivity: 'base'}));
      document.getElementById("lista-compras").innerHTML = productosCarrito.length === 0 
        ? "<p>No hay productos en la lista de compras</p>"
        : productosCarrito.map(prod => `
            <div class="producto-item" style="padding:12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px;background:#fff">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${prod.nombre}</strong> (${prod.categoria})
                <button onclick="quitarDelCarrito(${prod.id})" style="background:#e53e3e;margin-left:8px;padding:6px 10px;border:none;border-radius:4px;color:white;cursor:pointer;font-size:1rem" title="Quitar del carrito">❌</button>
              </div>
            </div>
          `).join('');
    } else {
      // Filtrar productos
      let productosFiltrados = productos;
      if (categoriaSeleccionada) {
        productosFiltrados = productos.filter(p => p.categoria === categoriaSeleccionada);
      }
      if (textoBusqueda) {
        productosFiltrados = productosFiltrados.filter(p => 
          p.nombre.toLowerCase().includes(textoBusqueda.toLowerCase())
        );
      }
      
      // Ordenar productos alfabéticamente por nombre
      productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', {sensitivity: 'base'}));
      
      const carrito = getCarrito();
      document.getElementById("productos").innerHTML = productosFiltrados.length === 0 
        ? "<p>No hay productos</p>"
        : productosFiltrados.map(prod => {
            let cantidad = 0;
            if (typeof prod.cantidad === 'number' && !isNaN(prod.cantidad)) {
              cantidad = prod.cantidad;
            } else if (typeof prod.cantidad === 'string' && prod.cantidad.trim() !== '' && !isNaN(Number(prod.cantidad))) {
              cantidad = Number(prod.cantidad);
            }
            const enCarrito = carrito.includes(prod.id);
            
            return `
              <div class="producto-item" style="padding:12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px;background:#fff">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                  <div>
                    <strong>${prod.nombre}</strong> (${prod.categoria})
                    <br><small>Cantidad: ${cantidad} ${prod.unidad || ''}</small>
                  </div>
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button onclick="editarProducto(${prod.id})" class="btn-small" title="Editar">✏️</button>
                    <button onclick="borrarStock(${prod.id})" class="btn-small" style="background:#e53e3e" title="Borrar stock">🗑️</button>
                    ${enCarrito 
                      ? `<button disabled class="btn-small" style="background:#a0aec0" title="En carrito">🛒</button>`
                      : `<button onclick="agregarAlCarrito(${prod.id})" class="btn-small" style="background:#38a169" title="Añadir al carrito">🛒</button>`
                    }
                  </div>
                </div>
              </div>
            `;
          }).join('');
    }
    
    // Función para cancelar edición
    window.cancelarEdicion = function() {
      editId = null;
      render();
    };
    
    // Funciones para carrito
    window.agregarAlCarrito = function(id) {
      const carrito = getCarrito();
      if (!carrito.includes(id)) {
        carrito.push(id);
        setCarrito(carrito);
        render();
      }
    };
    
    window.quitarDelCarrito = function(id) {
      const carrito = getCarrito();
      const nuevoCarrito = carrito.filter(itemId => itemId !== id);
      setCarrito(nuevoCarrito);
      render();
    };
    
    // Funciones para productos
    window.editarProducto = function(id) {
      editId = id;
      render(); // Esto recargará el formulario con los datos del producto
      
      // Hacer scroll automático al formulario después de un pequeño delay
      setTimeout(() => {
        const formProducto = document.getElementById("form-producto");
        if (formProducto) {
          formProducto.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          // También enfocar el campo de cantidad
          const cantidadInput = document.getElementById("cantidad");
          if (cantidadInput) {
            cantidadInput.focus();
          }
        }
      }, 100);
    };
    
    window.borrarStock = function(id) {
      const prod = productos.find(p => p.id === id);
      if (prod) {
        prod.cantidad = 0;
        guardarProducto(prod).then(() => {
          guardarHistorial(prod.id, "Borrado de stock", 0);
          location.reload();
        });
      }
    };
  });
}

// Limpieza automática de productos al iniciar para asegurar que cantidad sea número
function limpiarProductos() {
  return obtenerProductos().then(productos => {
    return Promise.all(productos.map(prod => {
      let cantidad = 0;
      if (typeof prod.cantidad === 'number' && !isNaN(prod.cantidad)) {
        cantidad = prod.cantidad;
      } else if (typeof prod.cantidad === 'string') {
        // Buscar todos los números en el string y tomar el último
        const matches = prod.cantidad.match(/\d+/g);
        if (matches && matches.length > 0) {
          cantidad = Number(matches[matches.length - 1]);
        }
      } else if (Array.isArray(prod.cantidad)) {
        // Si es array, tomar el último número válido
        const nums = prod.cantidad.map(x => Number(x)).filter(x => !isNaN(x));
        if (nums.length > 0) {
          cantidad = nums[nums.length - 1];
        }
      }
      if (typeof cantidad !== 'number' || isNaN(cantidad) || cantidad < 0) {
        cantidad = 0;
      }
      if (prod.cantidad !== cantidad) {
        prod.cantidad = cantidad;
        return guardarProducto(prod);
      }
      return Promise.resolve();
    }));
  });
}

// Inicializar
limpiarProductos()
  .then(() => migrarCarnesAProteinas())
  .then(() => migrarBebidasALegumbres())
  .then(() => precargarVerduras())
  .then(() => precargarFrutas())
  .then(() => precargarProteinas())
  .then(() => precargarLacteos())
  .then(() => precargarLegumbres())
  .then(() => render());

       // Función para generar receta con Google Gemini API
       async function generarRecetaGemini(ingredientes, apiKey) {
         console.log('Iniciando generación de ensaladas con ingredientes:', ingredientes);
         console.log('API key (primeros 10 chars):', apiKey.substring(0, 10) + '...');
         
         const prompt = `Genera 10 recetas de ensaladas creativas y variadas usando estos ingredientes: ${ingredientes}.

Responde en formato JSON con esta estructura exacta:
{
  "ensaladas": [
    {
      "titulo": "Nombre creativo de la ensalada 1",
      "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3", "aceite de oliva", "sal", "pimienta"],
      "pasos": ["Paso 1 detallado", "Paso 2 detallado", "Paso 3 detallado"],
      "nutricion": "Información nutricional breve y útil",
      "consejos": ["Consejo 1", "Consejo 2", "Consejo 3"]
    },
    {
      "titulo": "Nombre creativo de la ensalada 2",
      "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3", "aceite de oliva", "sal", "pimienta"],
      "pasos": ["Paso 1 detallado", "Paso 2 detallado", "Paso 3 detallado"],
      "nutricion": "Información nutricional breve y útil",
      "consejos": ["Consejo 1", "Consejo 2", "Consejo 3"]
    }
  ]
}

Asegúrate de:
- Generar exactamente 10 ensaladas diferentes y variadas
- Incluir los ingredientes principales proporcionados en cada ensalada
- Agregar ingredientes básicos como aceite, sal, pimienta, vinagre
- Hacer los pasos específicos y fáciles de seguir
- Incluir información nutricional realista
- Dar consejos útiles para la preparación
- Variar los estilos: mediterránea, asiática, mexicana, griega, etc.
- Incluir diferentes tipos de aderezos y combinaciones
- Responder SOLO el JSON, sin texto adicional`;

         console.log('Enviando petición a Gemini API para ensaladas...');
         
         const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             contents: [{
               parts: [{
                 text: prompt
               }]
             }]
           })
         });

         console.log('Respuesta recibida para ensaladas, status:', response.status);
         
         if (!response.ok) {
           const errorData = await response.text();
           console.error('Error de API para ensaladas:', response.status, errorData);
           throw new Error(`Error de API: ${response.status}`);
         }

         console.log('Parseando respuesta JSON para ensaladas...');
         const data = await response.json();
         console.log('Respuesta parseada para ensaladas:', data);
         
         const ensaladasText = data.candidates[0].content.parts[0].text;
         console.log('Texto de ensaladas recibido:', ensaladasText);
         
         // Extraer JSON de la respuesta
         const jsonMatch = ensaladasText.match(/\{[\s\S]*\}/);
         if (!jsonMatch) {
           console.error('No se encontró JSON en la respuesta de las ensaladas:', ensaladasText);
           throw new Error('No se pudo parsear la respuesta de la IA');
         }
         
         console.log('JSON extraído de las ensaladas:', jsonMatch[0]);
         const resultado = JSON.parse(jsonMatch[0]);
         console.log('Ensaladas parseadas:', resultado);
         
         // Validar estructura
         if (!resultado.ensaladas || !Array.isArray(resultado.ensaladas) || resultado.ensaladas.length === 0) {
           console.error('Estructura de ensaladas incompleta:', resultado);
           throw new Error('Respuesta de IA incompleta');
         }
         
         // Validar cada ensalada
         for (let i = 0; i < resultado.ensaladas.length; i++) {
           const ensalada = resultado.ensaladas[i];
           if (!ensalada.titulo || !ensalada.ingredientes || !ensalada.pasos || !ensalada.nutricion || !ensalada.consejos) {
             console.error(`Ensalada ${i + 1} incompleta:`, ensalada);
             throw new Error(`Ensalada ${i + 1} incompleta en la respuesta de IA`);
           }
         }
         
         console.log('Ensaladas validadas correctamente');
         return resultado.ensaladas;
       }
       
       // Función para generar plato con Google Gemini API
       async function generarPlatoGemini(ingredientes, apiKey) {
         console.log('Iniciando generación de platos con ingredientes:', ingredientes);
         console.log('API key (primeros 10 chars):', apiKey.substring(0, 10) + '...');
         
         const prompt = `Genera 10 recetas de platos principales creativos y variados usando estos ingredientes: ${ingredientes}.

Responde en formato JSON con esta estructura exacta:
{
  "platos": [
    {
      "titulo": "Nombre creativo del plato 1",
      "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3", "aceite de oliva", "sal", "pimienta"],
      "pasos": ["Paso 1 detallado", "Paso 2 detallado", "Paso 3 detallado"],
      "nutricion": "Información nutricional breve y útil",
      "consejos": ["Consejo 1", "Consejo 2", "Consejo 3"],
      "tiempo_preparacion": "Tiempo estimado de preparación",
      "dificultad": "Nivel de dificultad (Fácil/Medio/Difícil)"
    },
    {
      "titulo": "Nombre creativo del plato 2",
      "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3", "aceite de oliva", "sal", "pimienta"],
      "pasos": ["Paso 1 detallado", "Paso 2 detallado", "Paso 3 detallado"],
      "nutricion": "Información nutricional breve y útil",
      "consejos": ["Consejo 1", "Consejo 2", "Consejo 3"],
      "tiempo_preparacion": "Tiempo estimado de preparación",
      "dificultad": "Nivel de dificultad (Fácil/Medio/Difícil)"
    }
  ]
}

Asegúrate de:
- Generar exactamente 10 platos diferentes y variados
- Incluir los ingredientes principales proporcionados en cada plato
- Agregar ingredientes básicos como aceite, sal, pimienta, especias
- Hacer los pasos específicos y fáciles de seguir
- Incluir información nutricional realista
- Dar consejos útiles para la preparación
- Incluir tiempo de preparación y dificultad
- Variar los estilos: italiano, mexicano, asiático, mediterráneo, etc.
- Responder SOLO el JSON, sin texto adicional`;

         console.log('Enviando petición a Gemini API para platos...');
         
         const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             contents: [{
               parts: [{
                 text: prompt
               }]
             }]
           })
         });

         console.log('Respuesta recibida para platos, status:', response.status);
         
         if (!response.ok) {
           const errorData = await response.text();
           console.error('Error de API para platos:', response.status, errorData);
           throw new Error(`Error de API: ${response.status}`);
         }

         console.log('Parseando respuesta JSON para platos...');
         const data = await response.json();
         console.log('Respuesta parseada para platos:', data);
         
         const platosText = data.candidates[0].content.parts[0].text;
         console.log('Texto de platos recibido:', platosText);
         
         // Extraer JSON de la respuesta
         const jsonMatch = platosText.match(/\{[\s\S]*\}/);
         if (!jsonMatch) {
           console.error('No se encontró JSON en la respuesta de los platos:', platosText);
           throw new Error('No se pudo parsear la respuesta de la IA');
         }
         
         console.log('JSON extraído de los platos:', jsonMatch[0]);
         const resultado = JSON.parse(jsonMatch[0]);
         console.log('Platos parseados:', resultado);
         
         // Validar estructura
         if (!resultado.platos || !Array.isArray(resultado.platos) || resultado.platos.length === 0) {
           console.error('Estructura de platos incompleta:', resultado);
           throw new Error('Respuesta de IA incompleta');
         }
         
         // Validar cada plato
         for (let i = 0; i < resultado.platos.length; i++) {
           const plato = resultado.platos[i];
           if (!plato.titulo || !plato.ingredientes || !plato.pasos || !plato.nutricion || !plato.consejos || !plato.tiempo_preparacion || !plato.dificultad) {
             console.error(`Plato ${i + 1} incompleto:`, plato);
             throw new Error(`Plato ${i + 1} incompleto en la respuesta de IA`);
           }
         }
         
         console.log('Platos validados correctamente');
         return resultado.platos;
       }
       
       // Función para generar nueva receta
       window.generarNuevaRecetaIA = function() {
         const btnBuscar = document.getElementById("btn-buscar-receta");
         if (btnBuscar) {
           btnBuscar.click();
         }
       };
       
       // Función para generar nuevo plato
       window.generarNuevoPlatoIA = function() {
         const btnGenerarPlatoIA = document.getElementById("btn-generar-plato-ia");
         if (btnGenerarPlatoIA) {
           btnGenerarPlatoIA.click();
         }
       };