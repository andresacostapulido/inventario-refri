import React, { useEffect, useState } from "./react.js";
import { createRoot } from "./react-dom.client.js";

const CATEGORIAS = [
  "Lácteos",
  "Verduras",
  "Frutas",
  "Carnes",
  "Bebidas",
  "Otros"
];

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

function App() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    categoria: CATEGORIAS[0],
    cantidad: 1,
    unidad: "",
    fechaCaducidad: ""
  });
  const [editId, setEditId] = useState(null);
  const [alerta, setAlerta] = useState("");

  useEffect(() => {
    obtenerProductos().then(setProductos);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.fechaCaducidad) {
      setAlerta("Por favor, completa todos los campos obligatorios.");
      return;
    }
    const producto = {
      ...form,
      cantidad: Number(form.cantidad),
      id: editId || undefined
    };
    guardarProducto(producto).then(() => {
      obtenerProductos().then(setProductos);
      setForm({ nombre: "", categoria: CATEGORIAS[0], cantidad: 1, unidad: "", fechaCaducidad: "" });
      setEditId(null);
      setAlerta("");
    });
  }

  function handleEdit(producto) {
    setForm(producto);
    setEditId(producto.id);
  }

  function handleDelete(id) {
    if (window.confirm("¿Eliminar este producto?")) {
      eliminarProducto(id).then(() => obtenerProductos().then(setProductos));
    }
  }

  return (
    <div>
      <h1>Inventario de Refrigerador</h1>
      {alerta && <div className="alert">{alerta}</div>}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          name="nombre"
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <select name="categoria" value={form.categoria} onChange={handleChange}>
          {CATEGORIAS.map(cat => <option key={cat}>{cat}</option>)}
        </select>
        <input
          name="cantidad"
          type="number"
          min="1"
          value={form.cantidad}
          onChange={handleChange}
          style={{ width: 60 }}
        />
        <input
          name="unidad"
          placeholder="Unidad (ej: piezas, litros)"
          value={form.unidad}
          onChange={handleChange}
        />
        <input
          name="fechaCaducidad"
          type="date"
          value={form.fechaCaducidad}
          onChange={handleChange}
          required
        />
        <button type="submit">{editId ? "Actualizar" : "Agregar"}</button>
        {editId && <button type="button" onClick={() => { setForm({ nombre: "", categoria: CATEGORIAS[0], cantidad: 1, unidad: "", fechaCaducidad: "" }); setEditId(null); }}>Cancelar</button>}
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Caducidad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: "center" }}>No hay productos</td></tr>
          )}
          {productos.map(prod => {
            const dias = diasRestantes(prod.fechaCaducidad);
            return (
              <tr key={prod.id} style={dias <= 2 ? { background: "#fef08a" } : {}}>
                <td>{prod.nombre}</td>
                <td>{prod.categoria}</td>
                <td>{prod.cantidad} {prod.unidad}</td>
                <td>{prod.fechaCaducidad} {dias <= 2 && <span style={{ color: "#b45309" }}>({dias === 0 ? "¡Hoy!" : dias === 1 ? "Mañana" : `En ${dias} días`})</span>}</td>
                <td>
                  <button onClick={() => handleEdit(prod)}>Editar</button>
                  <button onClick={() => handleDelete(prod.id)} style={{ background: "#e53e3e" }}>Eliminar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />); 