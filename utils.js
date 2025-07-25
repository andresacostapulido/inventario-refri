// ===== UTILIDADES DE ENCRIPTACIÓN =====
const ENCRYPTION_CONFIG = {
  iterations: 10000,
  keySize: 256,
  saltSize: 128
};

function deriveKey(password, salt = null) {
  const generatedSalt = salt || CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.saltSize / 8);
  const key = CryptoJS.PBKDF2(password, generatedSalt, {
    keySize: ENCRYPTION_CONFIG.keySize / 32,
    iterations: ENCRYPTION_CONFIG.iterations
  });
  
  return {
    key: key.toString(),
    salt: generatedSalt.toString()
  };
}

function encryptText(text, password) {
  try {
    const { key, salt } = deriveKey(password);
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    
    return CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(salt + ':' + encrypted)
    );
  } catch (error) {
    console.error('Error al encriptar:', error);
    throw new Error('Error al encriptar el texto');
  }
}

function decryptText(encryptedText, password) {
  try {
    const decoded = CryptoJS.enc.Base64.parse(encryptedText).toString(CryptoJS.enc.Utf8);
    const [salt, encrypted] = decoded.split(':');
    
    if (!salt || !encrypted) {
      throw new Error('Formato de texto encriptado inválido');
    }
    
    const { key } = deriveKey(password, salt);
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
}

function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function validatePassword(password) {
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(validations).every(Boolean);
  const score = Object.values(validations).filter(Boolean).length;
  
  let strength = 'débil';
  if (score >= 4) strength = 'fuerte';
  else if (score >= 3) strength = 'media';
  
  return {
    isValid,
    score,
    strength,
    validations
  };
}

// ===== UTILIDADES DE BASE DE DATOS =====
const DB_CONFIG = {
  name: 'inventario_refrigerador_v2',
  version: 2
};

const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("configuracion")) {
        db.createObjectStore("configuracion", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };
  });
}

async function executeTransaction(storeName, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    
    operation(store, resolve, reject);
  });
}

async function getProductos() {
  const cacheKey = 'productos_all';
  const cached = memoryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const productos = await executeTransaction('productos', 'readonly', (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
  
  memoryCache.set(cacheKey, {
    data: productos,
    timestamp: Date.now()
  });
  
  return productos;
}

async function saveProducto(producto) {
  const result = await executeTransaction('productos', 'readwrite', (store, resolve) => {
    const request = store.put(producto);
    request.onsuccess = () => resolve(request.result);
  });
  
  memoryCache.delete('productos_all');
  return result;
}

async function deleteProducto(id) {
  await executeTransaction('productos', 'readwrite', (store, resolve) => {
    store.delete(id);
    resolve();
  });
  
  memoryCache.delete('productos_all');
}

function diasRestantes(fechaCaducidad) {
  const hoy = new Date();
  const cad = new Date(fechaCaducidad);
  const diff = cad - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function saveConfig(key, value) {
  await executeTransaction('configuracion', 'readwrite', (store, resolve) => {
    store.put({ key, value, timestamp: Date.now() });
    resolve();
  });
}

async function getConfig(key) {
  const config = await executeTransaction('configuracion', 'readonly', (store, resolve) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
  });
  
  return config ? config.value : null;
}

async function exportData() {
  const productos = await getProductos();
  const config = await executeTransaction('configuracion', 'readonly', (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
  
  return {
    productos,
    configuracion: config,
    exportDate: new Date().toISOString(),
    version: DB_CONFIG.version
  };
}

async function importData(data) {
  if (data.productos) {
    for (const producto of data.productos) {
      await saveProducto(producto);
    }
  }
  
  if (data.configuracion) {
    for (const config of data.configuracion) {
      await saveConfig(config.key, config.value);
    }
  }
  
  memoryCache.clear();
}

// ===== UTILIDADES DE API =====
const API_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  rateLimit: {
    maxRequests: 10,
    timeWindow: 60000,
    cooldown: 5000
  }
};

const requestHistory = [];
let lastRequestTime = 0;

function cleanupRequestHistory() {
  const now = Date.now();
  const cutoff = now - API_CONFIG.rateLimit.timeWindow;
  
  while (requestHistory.length > 0 && requestHistory[0] < cutoff) {
    requestHistory.shift();
  }
}

function canMakeRequest() {
  cleanupRequestHistory();
  
  if (requestHistory.length >= API_CONFIG.rateLimit.maxRequests) {
    return false;
  }
  
  const now = Date.now();
  if (now - lastRequestTime < API_CONFIG.rateLimit.cooldown) {
    return false;
  }
  
  return true;
}

function recordRequest() {
  const now = Date.now();
  requestHistory.push(now);
  lastRequestTime = now;
}

function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  if (apiKey.length < 20 || !apiKey.startsWith('AIza')) {
    return false;
  }
  
  return true;
}

async function callGeminiAPI(apiKey, prompt, ingredientes = []) {
  if (!validateApiKey(apiKey)) {
    throw new Error('API key inválida');
  }
  
  if (!canMakeRequest()) {
    const waitTime = Math.max(
      API_CONFIG.rateLimit.cooldown - (Date.now() - lastRequestTime),
      1000
    );
    throw new Error(`Rate limit excedido. Espera ${Math.ceil(waitTime / 1000)} segundos.`);
  }
  
  const url = `${API_CONFIG.baseUrl}?key=${apiKey}`;
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };
  
  try {
    recordRequest();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Error HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Respuesta inválida de la API');
    }
    
    return {
      text: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('Error en API call:', error);
    
    if (error.message.includes('Rate limit')) {
      throw error;
    }
    
    if (error.message.includes('API key')) {
      throw new Error('API key inválida o expirada');
    }
    
    if (error.message.includes('quota')) {
      throw new Error('Cuota de API excedida. Intenta mañana.');
    }
    
    throw new Error(`Error al comunicarse con la IA: ${error.message}`);
  }
}

async function generarEnsaladas(apiKey, ingredientes) {
  const ingredientesTexto = ingredientes.map(i => i.nombre).join(', ');
  
  const prompt = `Genera 10 recetas de ensaladas variadas y deliciosas usando estos ingredientes disponibles: ${ingredientesTexto}.

Para cada receta incluye:
1. Nombre de la ensalada
2. Lista de ingredientes con cantidades
3. Pasos de preparación (máximo 5 pasos)
4. Tiempo de preparación
5. Información nutricional básica
6. Consejos de preparación

Formato la respuesta como JSON con esta estructura:
{
  "ensaladas": [
    {
      "nombre": "Nombre de la ensalada",
      "ingredientes": ["ingrediente 1", "ingrediente 2"],
      "preparacion": ["paso 1", "paso 2"],
      "tiempo": "10 minutos",
      "nutricion": "Calorías: X, Proteínas: Xg, etc.",
      "consejos": "Consejos útiles"
    }
  ]
}

Asegúrate de que las recetas sean variadas (mediterránea, asiática, mexicana, griega, etc.) y que solo uses los ingredientes disponibles.`;

  try {
    const result = await callGeminiAPI(apiKey, prompt, ingredientes);
    
    try {
      const parsed = JSON.parse(result.text);
      return parsed.ensaladas || [];
    } catch (parseError) {
      return [{
        nombre: "Receta generada",
        ingredientes: ingredientes.map(i => i.nombre),
        preparacion: [result.text],
        tiempo: "Variable",
        nutricion: "Información no disponible",
        consejos: "Sigue las instrucciones de la IA"
      }];
    }
  } catch (error) {
    throw error;
  }
}

async function generarPlatos(apiKey, ingredientes) {
  const ingredientesTexto = ingredientes.map(i => i.nombre).join(', ');
  
  const prompt = `Genera 10 platos principales variados y deliciosos usando estos ingredientes disponibles: ${ingredientesTexto}.

Para cada plato incluye:
1. Nombre del plato
2. Tipo de cocina (italiana, mexicana, asiática, mediterránea, etc.)
3. Lista de ingredientes con cantidades
4. Pasos de preparación (máximo 8 pasos)
5. Tiempo de preparación
6. Nivel de dificultad (Fácil, Medio, Difícil)
7. Información nutricional básica
8. Consejos de preparación

Formato la respuesta como JSON con esta estructura:
{
  "platos": [
    {
      "nombre": "Nombre del plato",
      "tipo": "Tipo de cocina",
      "ingredientes": ["ingrediente 1", "ingrediente 2"],
      "preparacion": ["paso 1", "paso 2"],
      "tiempo": "30 minutos",
      "dificultad": "Fácil",
      "nutricion": "Calorías: X, Proteínas: Xg, etc.",
      "consejos": "Consejos útiles"
    }
  ]
}

Asegúrate de que los platos sean variados y que solo uses los ingredientes disponibles.`;

  try {
    const result = await callGeminiAPI(apiKey, prompt, ingredientes);
    
    try {
      const parsed = JSON.parse(result.text);
      return parsed.platos || [];
    } catch (parseError) {
      return [{
        nombre: "Plato generado",
        tipo: "Variado",
        ingredientes: ingredientes.map(i => i.nombre),
        preparacion: [result.text],
        tiempo: "Variable",
        dificultad: "Media",
        nutricion: "Información no disponible",
        consejos: "Sigue las instrucciones de la IA"
      }];
    }
  } catch (error) {
    throw error;
  }
}

function getApiStats() {
  cleanupRequestHistory();
  
  return {
    requestsInWindow: requestHistory.length,
    maxRequests: API_CONFIG.rateLimit.maxRequests,
    timeWindow: API_CONFIG.rateLimit.timeWindow,
    lastRequest: lastRequestTime,
    canMakeRequest: canMakeRequest()
  };
}

// Exportar funciones para uso global
window.Utils = {
  // Encriptación
  encryptText,
  decryptText,
  hashPassword,
  verifyPassword,
  validatePassword,
  
  // Base de datos
  getProductos,
  saveProducto,
  deleteProducto,
  diasRestantes,
  saveConfig,
  getConfig,
  exportData,
  importData,
  
  // API
  generarEnsaladas,
  generarPlatos,
  getApiStats
}; 