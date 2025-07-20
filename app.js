// --- Configuración ---
const CATEGORIAS = [
  "Lácteos",
  "Verduras",
  "Frutas",
  "Proteinas",
  "Legumbres",
  "Otros"
];

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