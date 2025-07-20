// --- Configuración ---
const CATEGORIAS = [
  "Lácteos",
  "Verduras",
  "Frutas",
  "Proteinas",
  "Bebidas",
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
  "achicoria", "apio", "repollo", "zapallo italiano", "acelga cruda", "espinaca cruda", "lechuga", "pepino ensalada", "rabanito", "tomate", "acelga cocida", "alcachofa", "betarraga", "cebolla", "coliflor", "brócoli", "kale", "espárragos", "espinaca cocida", "champiñones", "porotos verdes", "zanahoria", "zapallito italiano cocido", "palmitos"
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
const PROTEINAS_PREDEFINIDAS = ["carne", "pollo", "cerdo", "pescado"];
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
      <h1>Inventario de Refrigerador</h1>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <button id="btn-lista" ${modoListaCompras ? 'disabled' : ''}>Lista de compras</button>
        <input id="busqueda" placeholder="Buscar producto..." value="${textoBusqueda}" style="flex:1;max-width:200px" />
      </div>
      ${alerta ? `<div class="alert">${alerta}</div>` : ""}
      <form id="form-producto" style="margin-bottom:24px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input name="nombre" placeholder="Nombre del producto" value="${form?.nombre || ""}" required />
        <select name="categoria">
          ${CATEGORIAS.map(cat => `<option${catSel === cat ? " selected" : ""}>${cat}</option>`).join("")}
        </select>
        <input name="cantidad" type="number" min="0" step="1" value="${form?.cantidad ?? ""}" placeholder="Cantidad" />
        <input name="fechaCompra" type="date" value="${form?.fechaCompra || ""}" required />
        <button type="submit">${editId ? "Actualizar" : "Agregar"}</button>
        ${editId ? `<button type="button" id="cancelar">Cancelar</button>` : ""}
      </form>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#e2e8f0">
            <th>Categoría</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Fecha de compra</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${productosFiltrados.length === 0 ? `<tr><td colspan="5" style="text-align:center">No hay productos</td></tr>` : productosFiltrados.map(prod => {
            let cantidad = 0;
            if (typeof prod.cantidad === 'number' && !isNaN(prod.cantidad)) {
              cantidad = prod.cantidad;
            } else if (typeof prod.cantidad === 'string' && prod.cantidad.trim() !== '' && !isNaN(Number(prod.cantidad))) {
              cantidad = Number(prod.cantidad);
            }
            // Carrito
            let carrito = getCarrito();
            let enCarrito = carrito.includes(prod.id);
            return `<tr>
              <td>${prod.categoria}</td>
              <td>${prod.nombre}</td>
              <td>${cantidad}</td>
              <td>${prod.fechaCompra || ""}</td>
              <td>
                <button data-edit="${prod.id}">Editar</button>
                <button data-delstock="${prod.id}" style="background:#e53e3e">Borrar stock</button>
                ${modoListaCompras
                  ? `<button data-quitarcarrito="${prod.id}" style="background:#f59e42">Quitar del carrito</button>`
                  : enCarrito
                    ? `<button disabled style="background:#a0aec0">Añadido al carrito</button>`
                    : `<button data-addcarrito="${prod.id}" style="background:#38a169">Añadir al carrito</button>`}
                <button data-historial="${prod.id}" style="background:#718096">Historial</button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
      <div id="historial-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);align-items:center;justify-content:center;z-index:10">
        <div style="background:#fff;padding:24px 16px;border-radius:8px;max-width:350px;width:90%">
          <h3>Historial de cambios</h3>
          <ul id="historial-lista" style="max-height:200px;overflow:auto"></ul>
          <button id="cerrar-historial">Cerrar</button>
        </div>
      </div>
    `;
    // Restaurar foco y posición del cursor en búsqueda
    const newBusquedaInput = document.getElementById("busqueda");
    if (busquedaHadFocus && newBusquedaInput) {
      newBusquedaInput.focus();
      newBusquedaInput.setSelectionRange(cursorStart, cursorEnd);
    }
    newBusquedaInput.oninput = function(e) {
      textoBusqueda = this.value;
      render({ categoria: catSel });
    };
    document.getElementById("btn-lista").onclick = function() {
      modoListaCompras = true;
      render({ categoria: catSel });
    };
    // Eventos del formulario
    document.getElementById("form-producto").onsubmit = function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if (!data.nombre || !data.fechaCompra) {
        render(data, "Por favor, completa todos los campos obligatorios.");
        return;
      }
      data.cantidad = Number(data.cantidad);
      if (isNaN(data.cantidad) || data.cantidad < 0) data.cantidad = 0;
      if (editId) data.id = editId;
      guardarProducto(data).then(() => {
        guardarHistorial(data.id || Date.now(), editId ? "Actualización" : "Alta", data.cantidad);
        location.reload();
      });
    };
    if (editId) {
      document.getElementById("cancelar").onclick = function() {
        editId = null;
        modoListaCompras = false;
        textoBusqueda = "";
        render({ categoria: catSel });
      };
    }
    // Evento para cambiar la categoría y filtrar
    document.querySelector('select[name="categoria"]').onchange = function(e) {
      modoListaCompras = false;
      textoBusqueda = "";
      render({ categoria: this.value });
    };
    // Botones de editar
    root.querySelectorAll("button[data-edit]").forEach(btn => {
      btn.onclick = () => {
        const prod = productos.find(p => p.id == btn.getAttribute("data-edit"));
        editId = prod.id;
        modoListaCompras = false;
        render(prod);
      };
    });
    // Botón de borrar stock
    root.querySelectorAll("button[data-delstock]").forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute("data-delstock"));
        const prod = productos.find(p => p.id === id);
        if (!prod) return;
        prod.cantidad = 0;
        prod.fechaCompra = "";
        guardarProducto(prod).then(() => {
          guardarHistorial(prod.id, "Stock borrado", 0);
          location.reload();
        });
      };
    });
    // Botón de marcar como comprado
    root.querySelectorAll("button[data-comprado]").forEach(btn => {
      btn.onclick = () => {
        const prod = productos.find(p => p.id == btn.getAttribute("data-comprado"));
        const nuevoStock = prompt(`¿Cuánto stock tienes ahora de "${prod.nombre}"?`, prod.cantidad || 1);
        if (nuevoStock !== null && !isNaN(Number(nuevoStock))) {
          prod.cantidad = Number(nuevoStock);
          prod.fechaCompra = new Date().toISOString().slice(0,10);
          guardarProducto(prod).then(() => {
            guardarHistorial(prod.id, "Compra", prod.cantidad);
            modoListaCompras = false;
            render({ categoria: catSel });
          });
        }
      };
    });
    // Botón de historial
    root.querySelectorAll("button[data-historial]").forEach(btn => {
      btn.onclick = () => {
        const prodId = Number(btn.getAttribute("data-historial"));
        const modal = document.getElementById("historial-modal");
        const lista = document.getElementById("historial-lista");
        obtenerHistorial(prodId).then(historial => {
          lista.innerHTML = historial.length === 0 ? '<li>No hay movimientos</li>' : historial.map(h => `<li>${new Date(h.fecha).toLocaleString()} - ${h.cambio} (${h.cantidad})</li>`).join("");
          modal.style.display = "flex";
        });
        document.getElementById("cerrar-historial").onclick = function() {
          modal.style.display = "none";
        };
      };
    });
    // Botón añadir al carrito
    root.querySelectorAll("button[data-addcarrito]").forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute("data-addcarrito"));
        let carrito = getCarrito();
        if (!carrito.includes(id)) {
          carrito.push(id);
          setCarrito(carrito);
        }
        render({ categoria: catSel });
      };
    });
    // Botón quitar del carrito
    root.querySelectorAll("button[data-quitarcarrito]").forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute("data-quitarcarrito"));
        let carrito = getCarrito();
        carrito = carrito.filter(pid => pid !== id);
        setCarrito(carrito);
        render({ categoria: catSel });
      };
    });
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
  .then(() => precargarVerduras())
  .then(() => precargarFrutas())
  .then(() => precargarProteinas())
  .then(() => precargarLacteos())
  .then(() => render()); 