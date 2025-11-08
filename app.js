// --- Inventario Refri App.js Standalone React (CDN) ---
// Requiere que window.Utils esté disponible (de tu lógica actual)

// Componente de Autenticación
function AuthButton({ user, onSignIn, onSignOut, isLoading = false }) {
  if (isLoading) {
    return React.createElement('button', {
      className: 'btn-secondary auth-btn loading',
      disabled: true
    }, '⏳ Cargando...');
  }

  if (user) {
    return React.createElement('div', { className: 'auth-user' },
      React.createElement('div', { className: 'user-info' },
        React.createElement('img', {
          src: user.photoURL || 'https://via.placeholder.com/32x32',
          alt: user.displayName || 'Usuario',
          className: 'user-avatar'
        }),
        React.createElement('span', { className: 'user-name' }, user.displayName || user.email)
      ),
      React.createElement('button', {
        onClick: onSignOut,
        className: 'btn-secondary auth-btn',
        title: 'Cerrar sesión'
      }, '🚪 Salir')
    );
  }

  return React.createElement('button', {
    onClick: onSignIn,
    className: 'btn-primary auth-btn',
    title: 'Iniciar sesión con Google'
  }, '🔐 Iniciar Sesión');
}

function ProductForm({ onSubmit, onCancel, initialData = null, isLoading = false }) {
  const [form, setForm] = React.useState({
    nombre: "",
    categoria: "Lácteos",
    cantidad: 1,
    unidad: "unidades"
  });
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const CATEGORIAS = ["Lácteos", "Verduras", "Frutas", "Proteínas", "Legumbres", "Otros"];
  const UNIDADES = ["unidades", "kg", "g", "litros", "ml", "paquetes", "latas", "botellas"];

  React.useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || null,
        nombre: initialData.nombre || "",
        categoria: initialData.categoria || CATEGORIAS[0],
        cantidad: initialData.cantidad || 1,
        unidad: initialData.unidad || UNIDADES[0]
      });
    }
  }, [initialData]);

  React.useEffect(() => {
    const newErrors = {};
    if (touched.nombre && !form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (touched.cantidad && (form.cantidad <= 0 || form.cantidad > 999)) newErrors.cantidad = "La cantidad debe estar entre 1 y 999";
    setErrors(newErrors);
  }, [form, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (!touched[name]) setTouched(prev => ({ ...prev, [name]: true }));
  };
  const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ nombre: true, cantidad: true });
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (form.cantidad <= 0 || form.cantidad > 999) newErrors.cantidad = "La cantidad debe estar entre 1 y 999";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSubmit({ ...form, cantidad: Number(form.cantidad) });
  };
  const isFormValid = Object.keys(errors).length === 0 && form.nombre.trim() && form.cantidad > 0;

  return React.createElement('div', { className: 'product-form' },
    React.createElement('div', { className: 'form-header' },
      React.createElement('h3', null, initialData ? '✏️ Editar Producto' : '➕ Agregar Producto'),
      onCancel && React.createElement('button', { type: 'button', onClick: onCancel, className: 'btn-icon', disabled: isLoading }, '✕')
    ),
    React.createElement('form', { onSubmit: handleSubmit, className: 'form-content' },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'nombre' }, 'Nombre del producto *'),
        React.createElement('input', {
          id: 'nombre', name: 'nombre', type: 'text', placeholder: 'Ej: Leche, Manzanas, Pollo...', value: form.nombre,
          onChange: handleChange, onBlur: handleBlur, className: errors.nombre ? 'error' : '', disabled: isLoading
        }),
        errors.nombre && React.createElement('div', { className: 'error-message' }, '⚠️ ', errors.nombre)
      ),
      React.createElement('div', { className: 'form-row' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'categoria' }, 'Categoría'),
          React.createElement('select', {
            id: 'categoria', name: 'categoria', value: form.categoria, onChange: handleChange, disabled: isLoading
          }, CATEGORIAS.map(cat => React.createElement('option', { key: cat }, cat)))
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'cantidad' }, 'Cantidad *'),
          React.createElement('div', { className: 'quantity-input' },
            React.createElement('input', {
              id: 'cantidad', name: 'cantidad', type: 'number', min: '1', max: '999', value: form.cantidad,
              onChange: handleChange, onBlur: handleBlur, className: errors.cantidad ? 'error' : '', disabled: isLoading
            }),
            React.createElement('select', {
              name: 'unidad', value: form.unidad, onChange: handleChange, disabled: isLoading
            }, UNIDADES.map(unidad => React.createElement('option', { key: unidad }, unidad)))
          ),
          errors.cantidad && React.createElement('div', { className: 'error-message' }, '⚠️ ', errors.cantidad)
        )
      ),

      React.createElement('div', { className: 'form-actions' },
        React.createElement('button', { type: 'submit', className: 'btn-primary', disabled: !isFormValid || isLoading }, isLoading ? '⏳ Cargando...' : (initialData ? '💾 Actualizar' : '➕ Agregar')),
        onCancel && React.createElement('button', { type: 'button', onClick: onCancel, className: 'btn-secondary', disabled: isLoading }, 'Cancelar')
      )
    )
  );
}

function ProductList({ productos, onEdit, onDelete, onClearStock, onAddToCart, shoppingList = [], isLoading = false }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Todas');
  const [sortBy, setSortBy] = React.useState('nombre');
  const [stockFilter, setStockFilter] = React.useState('all');

  const CATEGORIAS = ["Todas", "Lácteos", "Verduras", "Frutas", "Proteínas", "Legumbres", "Otros"];

  const filteredProductos = React.useMemo(() => {
    let filtered = productos.filter(producto => {
      if (searchTerm && !producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (selectedCategory !== 'Todas' && producto.categoria !== selectedCategory) {
        return false;
      }
      
      if (stockFilter === 'empty' && producto.cantidad !== 0) return false;
      if (stockFilter === 'low' && (producto.cantidad === 0 || producto.cantidad > 2)) return false;
      if (stockFilter === 'medium' && (producto.cantidad <= 2 || producto.cantidad > 5)) return false;
      if (stockFilter === 'high' && producto.cantidad <= 5) return false;
      
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'categoria':
          return a.categoria.localeCompare(b.categoria);
        case 'cantidad':
          return b.cantidad - a.cantidad;
        case 'caducidad':
          return new Date(a.fechaCaducidad) - new Date(b.fechaCaducidad);
        default:
          return 0;
      }
    });

    return filtered;
  }, [productos, searchTerm, selectedCategory, sortBy, stockFilter]);

  const stats = React.useMemo(() => {
    const total = productos.length;
    const stockBajo = productos.filter(p => p.cantidad > 0 && p.cantidad <= 2).length;
    const stockMedio = productos.filter(p => p.cantidad > 2 && p.cantidad <= 5).length;
    const stockAlto = productos.filter(p => p.cantidad > 5).length;

    return { total, stockBajo, stockMedio, stockAlto };
  }, [productos]);



  const getStockStatus = (cantidad) => {
    if (cantidad === 0) {
      return { status: 'empty', text: 'Sin stock', color: 'red' };
    } else if (cantidad <= 2) {
      return { status: 'low', text: 'Stock bajo', color: 'orange' };
    } else {
      return { status: 'ok', text: 'En stock', color: 'green' };
    }
  };

  if (isLoading) {
    return React.createElement('div', { className: 'product-list' },
      React.createElement('div', { className: 'loading-container' },
        React.createElement('div', { className: 'loading-spinner' }),
        React.createElement('p', null, 'Cargando productos...')
      )
    );
  }

  return React.createElement('div', { className: 'product-list' },
    // Estadísticas
    React.createElement('div', { className: 'stats-grid' },
      React.createElement('div', { 
        className: `stat-card ${stockFilter === 'all' ? 'active' : ''}`,
        onClick: () => setStockFilter('all'),
        style: { cursor: 'pointer' }
      },
        '📦',
        React.createElement('div', null,
          React.createElement('h4', null, stats.total),
          React.createElement('p', null, 'Total')
        )
      ),
      React.createElement('div', { 
        className: `stat-card warning ${stockFilter === 'low' ? 'active' : ''}`,
        onClick: () => setStockFilter('low'),
        style: { cursor: 'pointer' }
      },
        '⚠️',
        React.createElement('div', null,
          React.createElement('h4', null, stats.stockBajo),
          React.createElement('p', null, 'Stock bajo')
        )
      ),
      React.createElement('div', { 
        className: `stat-card info ${stockFilter === 'medium' ? 'active' : ''}`,
        onClick: () => setStockFilter('medium'),
        style: { cursor: 'pointer' }
      },
        '📊',
        React.createElement('div', null,
          React.createElement('h4', null, stats.stockMedio),
          React.createElement('p', null, 'Stock medio')
        )
      ),
      React.createElement('div', { 
        className: `stat-card success ${stockFilter === 'high' ? 'active' : ''}`,
        onClick: () => setStockFilter('high'),
        style: { cursor: 'pointer' }
      },
        '✅',
        React.createElement('div', null,
          React.createElement('h4', null, stats.stockAlto),
          React.createElement('p', null, 'Stock alto')
        )
      )
    ),
    // Filtros
    React.createElement('div', { className: 'filters-section' },
      React.createElement('div', { className: 'search-box' },
        '🔍',
        React.createElement('input', {
          type: 'text',
          placeholder: 'Buscar productos...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value)
        })
      ),
      React.createElement('div', { className: 'filters-row' },
        React.createElement('div', { className: 'filter-group' },
          '🔧',
          React.createElement('select', {
            value: selectedCategory,
            onChange: (e) => setSelectedCategory(e.target.value)
          }, CATEGORIAS.map(cat => React.createElement('option', { key: cat }, cat)))
        ),
        React.createElement('div', { className: 'filter-group' },
          React.createElement('select', {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value)
          },
            React.createElement('option', { value: 'nombre' }, 'Ordenar por nombre'),
            React.createElement('option', { value: 'categoria' }, 'Ordenar por categoría'),
            React.createElement('option', { value: 'cantidad' }, 'Ordenar por cantidad'),
                                    React.createElement('option', { value: 'cantidad' }, 'Ordenar por cantidad')
          )
        )
      ),

    ),
    // Lista de productos
    React.createElement('div', { className: 'products-grid' },
      filteredProductos.length === 0 ? React.createElement('div', { className: 'empty-state' },
        '📦',
        React.createElement('h3', null, 'No hay productos'),
        React.createElement('p', null,
          searchTerm || selectedCategory !== 'Todas'
            ? 'No se encontraron productos con los filtros aplicados'
            : 'Agrega tu primer producto para comenzar'
        )
      ) : filteredProductos.map(producto => {
        const stockStatus = getStockStatus(producto.cantidad);

        return React.createElement('div', {
          key: producto.id,
          className: `product-card ${stockStatus.status}`
        },
          React.createElement('div', { className: 'product-header' },
            React.createElement('h4', null, producto.nombre),
                                        React.createElement('div', { className: 'product-actions' },
                              React.createElement('button', {
                                onClick: () => onEdit(producto),
                                className: 'btn-icon small',
                                title: 'Editar'
                              }, '✏️'),
                                      React.createElement('button', {
          onClick: () => onAddToCart(producto),
          className: `btn-icon small ${shoppingList.some(item => item.id === producto.id) ? 'disabled' : 'success'}`,
          title: shoppingList.some(item => item.id === producto.id) ? 'Ya está en la lista de compras' : 'Agregar al carrito',
          disabled: shoppingList.some(item => item.id === producto.id)
        }, '🛒'),
                              React.createElement('button', {
                                onClick: () => onClearStock(producto.id),
                                className: 'btn-icon small warning',
                                title: 'Limpiar Stock'
                              }, '📦'),
                              React.createElement('button', {
                                onClick: () => onDelete(producto.id),
                                className: 'btn-icon small danger',
                                title: 'Eliminar'
                              }, '🗑️')
                            )
          ),
          React.createElement('div', { className: 'product-details' },
            React.createElement('div', { className: 'detail-row' },
              React.createElement('span', { className: 'label' }, 'Categoría:'),
              React.createElement('span', { className: 'value' }, producto.categoria)
            ),
            React.createElement('div', { className: 'detail-row' },
              React.createElement('span', { className: 'label' }, 'Cantidad:'),
              React.createElement('span', { className: `value ${stockStatus.status}` },
                `${producto.cantidad} ${producto.unidad}`
              )
            ),

          ),
          React.createElement('div', { className: 'product-footer' },
            React.createElement('span', { className: 'date' },
              `Agregado: ${new Date(producto.fechaCreacion).toLocaleDateString()}`
            )
          )
        );
      })
    ),
    // Resumen
    filteredProductos.length > 0 && React.createElement('div', { className: 'list-summary' },
      React.createElement('p', null,
        `Mostrando ${filteredProductos.length} de ${productos.length} productos`,
        searchTerm && ` que coinciden con "${searchTerm}"`
      )
    )
  );
}

function ShoppingList({ items, onRemove, onClear, onUpdateStock, isLoading = false }) {
  if (isLoading) {
    return React.createElement('div', { className: 'shopping-list' },
      React.createElement('div', { className: 'loading-container' },
        React.createElement('div', { className: 'loading-spinner' }),
        React.createElement('p', null, 'Cargando lista de compras...')
      )
    );
  }

  return React.createElement('div', { className: 'shopping-list' },
    React.createElement('div', { className: 'section-header' },
      React.createElement('h2', null, '🛒 Lista de Compras'),
      items.length > 0 && React.createElement('button', {
        onClick: onClear,
        className: 'btn-secondary'
      }, '🗑️ Limpiar lista')
    ),
    
    items.length === 0 ? React.createElement('div', { className: 'empty-state' },
      '🛒',
      React.createElement('h3', null, 'Lista de compras vacía'),
      React.createElement('p', null, 'Agrega productos desde el inventario para crear tu lista de compras')
    ) : React.createElement('div', { className: 'shopping-items' },
      React.createElement('div', { className: 'shopping-header' },
        React.createElement('div', { className: 'header-product' }, 'Producto'),
        React.createElement('div', { className: 'header-category' }, 'Categoría'),
        React.createElement('div', { className: 'header-quantity' }, 'Cantidad'),
        React.createElement('div', { className: 'header-actions' }, 'Acciones')
      ),
      items.map(item => React.createElement('div', {
        key: item.id,
        className: 'shopping-item'
      },
        React.createElement('div', { className: 'item-product' },
          React.createElement('div', { className: 'product-icon' }, '📦'),
          React.createElement('div', { className: 'product-details' },
            React.createElement('h4', null, item.nombre),
            React.createElement('span', { className: 'item-date' }, 
              `Agregado: ${new Date(item.fechaAgregado).toLocaleDateString()}`
            )
          )
        ),
        React.createElement('div', { className: 'item-category' },
          React.createElement('span', { className: 'category-badge' }, item.categoria)
        ),
        React.createElement('div', { className: 'item-quantity-section' },
          React.createElement('div', { className: 'quantity-controls' },
            React.createElement('button', {
              onClick: () => {
                const newQuantity = Math.max(0, item.cantidad - 1);
                const updatedItem = { ...item, cantidad: newQuantity };
                onUpdateStock(item.id, updatedItem);
              },
              className: 'quantity-btn',
              disabled: item.cantidad <= 0
            }, '−'),
            React.createElement('input', {
              type: 'number',
              min: '0',
              max: '999',
              value: item.cantidad,
              onChange: (e) => {
                const newQuantity = parseInt(e.target.value) || 0;
                const updatedItem = { ...item, cantidad: newQuantity };
                onUpdateStock(item.id, updatedItem);
              },
              className: 'quantity-input'
            }),
            React.createElement('button', {
              onClick: () => {
                const newQuantity = item.cantidad + 1;
                const updatedItem = { ...item, cantidad: newQuantity };
                onUpdateStock(item.id, updatedItem);
              },
              className: 'quantity-btn'
            }, '+')
          ),
          React.createElement('span', { className: 'item-unit' }, item.unidad)
        ),
        React.createElement('div', { className: 'item-actions' },
          React.createElement('button', {
            onClick: () => onUpdateStock(item.id, item, true),
            className: 'btn-primary small',
            title: 'Actualizar inventario'
          }, '📦 Actualizar'),
          React.createElement('button', {
            onClick: () => onRemove(item.id),
            className: 'btn-icon small danger',
            title: 'Remover de lista'
          }, '✕')
        )
      ))
    ),
    
    items.length > 0 && React.createElement('div', { className: 'shopping-summary' },
      React.createElement('div', { className: 'summary-stats' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('span', { className: 'stat-label' }, 'Total productos:'),
          React.createElement('span', { className: 'stat-value' }, items.length)
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('span', { className: 'stat-label' }, 'Cantidad total:'),
          React.createElement('span', { className: 'stat-value' }, 
            items.reduce((sum, item) => sum + item.cantidad, 0)
          )
        )
      ),
      React.createElement('div', { className: 'summary-actions' },
        React.createElement('button', {
          onClick: () => {
            // Actualizar todos los productos al inventario
            items.forEach(item => onUpdateStock(item.id, item, true));
          },
          className: 'btn-primary',
          title: 'Actualizar todo el inventario'
        }, '📦 Actualizar Todo el Inventario')
      )
    )
  );
}

function RecipeGenerator({ productos, user }) {
  const [apiKey, setApiKey] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isConfiguring, setIsConfiguring] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [recipes, setRecipes] = React.useState([]);
  const [recipeType, setRecipeType] = React.useState('almuerzo');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  React.useEffect(() => {
    loadApiConfiguration();
  }, []);

  const loadApiConfiguration = async () => {
    try {
      const hasApiKey = await window.Utils.getConfig('has_api_key');
      if (hasApiKey) {
        setSuccess('API key configurada. Puedes generar recetas.');
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleConfigureApi = async () => {
    if (!apiKey.trim()) {
      setError('Por favor ingresa tu API key');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa una contraseña');
      return;
    }

    const passwordValidation = window.Utils.validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(`Contraseña débil. Debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos.`);
      return;
    }

    try {
      setIsConfiguring(true);
      setError('');

      // Crear sesión y guardar API key
      const result = await window.Utils.saveApiKey(apiKey, password);
      
      if (result.success) {
        // Guardar sessionId en localStorage para uso posterior
        sessionStorage.setItem('current_session_id', result.sessionId);
        sessionStorage.setItem('session_password', password);
        
        setSuccess('✅ API key configurada correctamente. Sesión iniciada por 24 horas.');
        setApiKey('');
        setPassword('');
      }
      
      setIsConfiguring(false);
      
    } catch (error) {
      setError('Error al configurar API key: ' + error.message);
      setIsConfiguring(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (!user) {
      setError('Debes iniciar sesión para generar recetas con IA');
      return;
    }
    
    if (productos.length === 0) {
      setError('No hay productos en el inventario para generar recetas');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      setRecipes([]);

      // Verificar sesión activa
      const sessionId = sessionStorage.getItem('current_session_id');
      const sessionPassword = sessionStorage.getItem('session_password');
      
      if (!sessionId || !sessionPassword) {
        setError('Sesión no válida. Configura tu API key nuevamente.');
        return;
      }

      // Validar sesión
      const isValidSession = await window.Utils.validateSession(sessionId, sessionPassword);
      if (!isValidSession) {
        setError('Sesión expirada o inválida. Configura tu API key nuevamente.');
        sessionStorage.removeItem('current_session_id');
        sessionStorage.removeItem('session_password');
        return;
      }

      const encryptedApiKey = await window.Utils.getConfig('api_key_encrypted');
      if (!encryptedApiKey) {
        setError('API key no configurada. Configúrala primero.');
        return;
      }

      const decryptedApiKey = window.Utils.decryptText(encryptedApiKey, sessionPassword);
      if (!decryptedApiKey) {
        setError('Error al desencriptar API key');
        return;
      }

      const productosConStock = productos.filter(p => p.cantidad > 0);
      
      if (productosConStock.length === 0) {
        setError('No hay productos con stock disponible');
        return;
      }

      const generatedRecipes = await window.Utils.generarRecetas(decryptedApiKey, productosConStock, recipeType);

      setRecipes(generatedRecipes);
      setSuccess(`✅ ${generatedRecipes.length} recetas generadas exitosamente`);
      
    } catch (error) {
      setError('Error al generar recetas: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearApi = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar la configuración de API key?')) {
      return;
    }

    try {
      await window.Utils.saveConfig('api_key_encrypted', null);
      await window.Utils.saveConfig('password_hash', null);
      await window.Utils.saveConfig('has_api_key', false);
      
      setSuccess('Configuración de API eliminada');
    } catch (error) {
      setError('Error al eliminar configuración: ' + error.message);
    }
  };

  const exportRecipes = () => {
    if (recipes.length === 0) return;
    
    const data = {
      recipes,
      mealType: recipeType,
      generatedAt: new Date().toISOString(),
      ingredients: productos.filter(p => p.cantidad > 0).map(p => p.nombre)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recetas_${recipeType}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return React.createElement('div', { className: 'recipe-generator' },
    React.createElement('div', { className: 'section-header' },
      React.createElement('h2', null, '🤖 Generador de Recetas con IA')
    ),
    // Mensajes
    error && React.createElement('div', { className: 'alert error' },
      '⚠️ ',
      React.createElement('span', null, error),
      React.createElement('button', {
        onClick: () => setError(''),
        className: 'btn-icon small'
      }, '✕')
    ),
    success && React.createElement('div', { className: 'alert success' },
      '✅ ',
      React.createElement('span', null, success),
      React.createElement('button', {
        onClick: () => setSuccess(''),
        className: 'btn-icon small'
      }, '✕')
    ),
    // Configuración de API
    React.createElement('div', { className: 'config-section' },
      React.createElement('h3', null, '⚙️ Configuración de API Key'),
      React.createElement('div', { className: 'config-form' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'API Key de Google Gemini'),
          React.createElement('input', {
            type: 'text',
            placeholder: 'AIzaSy...',
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            disabled: isConfiguring
          }),
          React.createElement('small', null,
            'Obtén tu API key gratuita en ',
            React.createElement('a', {
              href: 'https://makersuite.google.com/app/apikey',
              target: '_blank',
              rel: 'noopener'
            }, 'Google AI Studio')
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Contraseña de protección'),
          React.createElement('div', { className: 'password-input' },
            React.createElement('input', {
              type: showPassword ? 'text' : 'password',
              placeholder: 'Contraseña para proteger tu API key',
              value: password,
              onChange: (e) => setPassword(e.target.value),
              disabled: isConfiguring
            }),
            React.createElement('button', {
              type: 'button',
              onClick: () => setShowPassword(!showPassword),
              className: 'btn-icon',
              disabled: isConfiguring
            }, showPassword ? '👁️' : '🙈')
          ),
          React.createElement('small', null, 'Esta contraseña protege tu API key localmente')
        ),
        React.createElement('div', { className: 'config-actions' },
          React.createElement('button', {
            onClick: handleConfigureApi,
            disabled: isConfiguring || !apiKey.trim() || !password.trim(),
            className: 'btn-primary'
          }, isConfiguring ? '⏳ Configurando...' : '🔑 Configurar API Key'),
          React.createElement('button', {
            onClick: handleClearApi,
            className: 'btn-secondary'
          }, 'Eliminar Configuración')
        )
      )
    ),
    // Generador de recetas
    React.createElement('div', { className: 'generator-section' },
      React.createElement('h3', null, '🍽️ Generar Recetas con IA'),
      React.createElement('div', { className: 'generator-controls' },
        React.createElement('div', { className: 'recipe-type-selector' },
          React.createElement('button', {
            className: recipeType === 'desayuno' ? 'active' : '',
            onClick: () => setRecipeType('desayuno')
          }, '🌅 Desayuno'),
          React.createElement('button', {
            className: recipeType === 'almuerzo' ? 'active' : '',
            onClick: () => setRecipeType('almuerzo')
          }, '🍽️ Almuerzo'),
          React.createElement('button', {
            className: recipeType === 'cena' ? 'active' : '',
            onClick: () => setRecipeType('cena')
          }, '🌙 Cena')
        ),
        React.createElement('button', {
          onClick: handleGenerateRecipes,
          disabled: isGenerating || productos.length === 0 || !user,
          className: user ? 'btn-primary' : 'btn-primary btn-disabled',
          title: !user ? 'Inicia sesión para usar IA' : 'Generar recetas con IA'
        }, isGenerating ? '⏳ Generando recetas...' : '🤖 Generar con IA')
      ),
      // Lista de recetas generadas
      recipes.length > 0 && React.createElement('div', { className: 'recipes-section' },
        React.createElement('div', { className: 'recipes-header' },
          React.createElement('h4', null, `Recetas Generadas (${recipes.length})`),
          React.createElement('button', {
            onClick: exportRecipes,
            className: 'btn-secondary'
          }, '📥 Exportar')
        ),
        React.createElement('div', { className: 'recipes-grid' },
          recipes.map((recipe, index) => React.createElement('div', {
            key: index,
            className: 'recipe-card'
          },
            React.createElement('div', { className: 'recipe-header' },
              React.createElement('h5', null, recipe.nombre),
              recipe.tipo && React.createElement('span', { className: 'recipe-type' }, recipe.tipo)
            ),
            React.createElement('div', { className: 'recipe-details' },
              React.createElement('div', { className: 'recipe-info' },
                React.createElement('span', null, `⏱️ ${recipe.tiempo}`),
                recipe.dificultad && React.createElement('span', null, `📊 ${recipe.dificultad}`)
              ),
              React.createElement('div', { className: 'recipe-ingredients' },
                React.createElement('h6', null, 'Ingredientes:'),
                React.createElement('ul', null,
                  recipe.ingredientes.map((ing, i) => React.createElement('li', { key: i }, ing))
                )
              ),
              React.createElement('div', { className: 'recipe-preparation' },
                React.createElement('h6', null, 'Preparación:'),
                React.createElement('ol', null,
                  recipe.preparacion.map((paso, i) => React.createElement('li', { key: i }, paso))
                )
              ),
              recipe.nutricion && React.createElement('div', { className: 'recipe-nutrition' },
                React.createElement('h6', null, 'Información nutricional:'),
                React.createElement('p', null, recipe.nutricion)
              ),
              recipe.consejos && React.createElement('div', { className: 'recipe-tips' },
                React.createElement('h6', null, 'Consejos:'),
                React.createElement('p', null, recipe.consejos)
              )
            )
          ))
        )
      )
    )
  );
}

function App() {
  const [productos, setProductos] = React.useState([]);
  const [shoppingList, setShoppingList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('inventario');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
    loadTheme();
    
    // Escuchar cambios de autenticación
    const unsubscribe = window.Utils.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthLoading(false);
      if (user) {
        // Recargar datos cuando el usuario inicia sesión
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      await window.Utils.signInWithGoogle();
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      alert('Error al iniciar sesión: ' + error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsAuthLoading(true);
      await window.Utils.signOut();
      setProductos([]);
      setShoppingList([]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      alert('Error al cerrar sesión: ' + error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [productosData, shoppingListData] = await Promise.all([
        window.Utils.getProductos(),
        window.Utils.getShoppingList()
      ]);
      
      setProductos(productosData);
      setShoppingList(shoppingListData);
      
      // Si el usuario está autenticado y no tiene productos, forzar inicialización
      if (user && productosData.length === 0) {
        console.log('Usuario autenticado sin productos, inicializando productos base...');
        await window.Utils.forceInitializeProducts();
        const newProductosData = await window.Utils.getProductos();
        setProductos(newProductosData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheme = async () => {
    try {
      const theme = await window.Utils.getConfig('theme') || 'light';
      setIsDarkMode(theme === 'dark');
      applyTheme(theme);
    } catch (error) {
      console.error('Error cargando tema:', error);
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    applyTheme(newTheme);
    
    try {
      await window.Utils.saveConfig('theme', newTheme);
    } catch (error) {
      console.error('Error guardando tema:', error);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await window.Utils.saveProducto(productData);
      await loadData();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar el producto');
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      console.log('Editando producto:', productData);
      console.log('ID del producto a editar:', productData.id);
      
      await window.Utils.saveProducto(productData);
      await loadData();
      setEditingProduct(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar el producto');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      await window.Utils.deleteProducto(id);
      await loadData();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleClearStock = async (id) => {
    if (!confirm('¿Estás seguro de que quieres limpiar el stock de este producto?')) {
      return;
    }

    try {
      await window.Utils.clearStock(id);
      await loadData();
      alert('Stock limpiado exitosamente');
    } catch (error) {
      console.error('Error limpiando stock:', error);
      alert('Error al limpiar el stock');
    }
  };

  const handleForceInitialize = async () => {
    const TOTAL_PREDEFINED = 26 + 23 + 7 + 4 + 4; // Verduras + Frutas + Proteínas + Lácteos + Legumbres
    
    if (!confirm(`¿Estás seguro de que quieres reinicializar todos los productos? Esto eliminará todos los productos existentes y creará los ${TOTAL_PREDEFINED} productos predefinidos.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const count = await window.Utils.forceInitializeProducts();
      await loadData();
      alert(`Se reinicializaron ${count} productos exitosamente`);
    } catch (error) {
      console.error('Error reinicializando productos:', error);
      alert('Error al reinicializar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanAndInitialize = async () => {
    const TOTAL_PREDEFINED = 26 + 23 + 7 + 4 + 4; // Verduras + Frutas + Proteínas + Lácteos + Legumbres
    
    if (!confirm(`¿Estás seguro de que quieres limpiar completamente la base de datos y reinicializarla? Esto eliminará TODOS los datos (productos, configuración, lista de compras) y creará los ${TOTAL_PREDEFINED} productos predefinidos con stock 0.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const count = await window.Utils.cleanAndInitialize();
      await loadData();
      alert(`Base de datos limpiada y reinicializada con ${count} productos exitosamente`);
    } catch (error) {
      console.error('Error limpiando y reinicializando:', error);
      alert('Error al limpiar y reinicializar la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (producto) => {
    try {
      await window.Utils.addToShoppingList(producto);
      const updatedShoppingList = await window.Utils.getShoppingList();
      setShoppingList(updatedShoppingList);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert('Error al agregar al carrito');
    }
  };

  const handleRemoveFromCart = async (id) => {
    try {
      await window.Utils.removeFromShoppingList(id);
      const updatedShoppingList = await window.Utils.getShoppingList();
      setShoppingList(updatedShoppingList);
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      alert('Error al remover del carrito');
    }
  };

  const handleUpdateStock = async (id, updatedItem, updateInventory = false) => {
    try {
      if (updateInventory) {
        // Actualizar el inventario con la cantidad de la lista de compras
        await window.Utils.saveProducto({
          id: updatedItem.id,
          nombre: updatedItem.nombre,
          categoria: updatedItem.categoria,
          cantidad: updatedItem.cantidad,
          unidad: updatedItem.unidad,
          fechaActualizacion: new Date().toISOString()
        });
        
        // Recargar productos
        const updatedProductos = await window.Utils.getProductos();
        setProductos(updatedProductos);
        
        // Remover de la lista de compras
        await window.Utils.removeFromShoppingList(id);
        const updatedShoppingList = await window.Utils.getShoppingList();
        setShoppingList(updatedShoppingList);
      } else {
        // Solo actualizar la cantidad en la lista de compras
        const updatedShoppingList = shoppingList.map(item => 
          item.id === id ? updatedItem : item
        );
        setShoppingList(updatedShoppingList);
        
        // Guardar en Firebase
        await window.Utils.saveShoppingList(updatedShoppingList);
      }
    } catch (error) {
      console.error('Error actualizando stock:', error);
      alert('Error al actualizar stock');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar toda la lista de compras?')) {
      return;
    }

    try {
      await window.Utils.clearShoppingList();
      setShoppingList([]);
    } catch (error) {
      console.error('Error limpiando carrito:', error);
      alert('Error al limpiar la lista de compras');
    }
  };

  const [dbStats, setDbStats] = React.useState(null);

  const loadDatabaseStats = async () => {
    try {
      const stats = await window.Utils.getDatabaseStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  React.useEffect(() => {
    loadDatabaseStats();
  }, [productos, shoppingList]);

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleExportData = async () => {
    try {
      const data = await window.Utils.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Datos exportados exitosamente');
    } catch (error) {
      console.error('Error exportando datos:', error);
      alert('Error al exportar los datos');
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.productos) {
        throw new Error('Formato de archivo inválido');
      }

      await window.Utils.importData(data);
      await loadData();
      alert('Datos importados exitosamente');
    } catch (error) {
      console.error('Error importando datos:', error);
      alert('Error al importar los datos');
    }

    event.target.value = '';
  };

  const tabs = [
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'compras', label: 'Lista de Compras', icon: '🛒' },
    { id: 'recetas', label: 'Recetas IA', icon: '🤖' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' }
  ];

  return React.createElement('div', { className: 'app' },
    // Header
    React.createElement('header', { className: 'app-header' },
      React.createElement('div', { className: 'header-content' },
        React.createElement('div', { className: 'header-left' },
          React.createElement('button', {
            className: 'mobile-menu-btn',
            onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen)
          }, isMobileMenuOpen ? '✕' : '☰'),
          React.createElement('h1', null, '🍽️ Inventario Refri')
        ),
        React.createElement('div', { className: 'header-actions' },
          React.createElement(AuthButton, {
            user,
            onSignIn: handleSignIn,
            onSignOut: handleSignOut,
            isLoading: isAuthLoading
          }),
          React.createElement('button', {
            onClick: toggleTheme,
            className: 'btn-icon',
            title: isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
          }, isDarkMode ? '☀️' : '🌙')
        )
      )
    ),
    // Navigation
    React.createElement('nav', { className: `app-nav ${isMobileMenuOpen ? 'open' : ''}` },
      React.createElement('div', { className: 'nav-content' },
        tabs.map(tab => React.createElement('button', {
          key: tab.id,
          className: `nav-tab ${activeTab === tab.id ? 'active' : ''}`,
          onClick: () => {
            setActiveTab(tab.id);
            setIsMobileMenuOpen(false);
          }
        }, `${tab.icon} ${tab.label}`))
      )
    ),
    // Main Content
    React.createElement('main', { className: 'app-main' },
      // Banner de modo invitado
      !user && !isAuthLoading && React.createElement('div', { className: 'guest-mode' },
        React.createElement('span', { className: 'guest-icon' }, '👤'),
        'Modo Invitado - Solo puedes ver datos. Inicia sesión para guardar productos y usar recetas IA.'
      ),
      // Inventario Tab
      activeTab === 'inventario' && React.createElement('div', { className: 'tab-content' },
        React.createElement('div', { className: 'content-header' },
          React.createElement('h2', null, 'Gestión de Inventario'),
          React.createElement('div', { className: 'header-actions' },
            React.createElement('button', {
              onClick: () => setShowForm(true),
              className: user ? 'btn-primary' : 'btn-primary btn-disabled',
              disabled: !user,
              title: !user ? 'Inicia sesión para agregar productos' : 'Agregar producto'
            }, '➕ Agregar Producto'),
            React.createElement('div', { className: 'dropdown' },
              React.createElement('button', { className: 'btn-secondary' }, '📥 Exportar/Importar'),
              React.createElement('div', { className: 'dropdown-content' },
                React.createElement('button', { onClick: handleExportData }, '📤 Exportar datos'),
                React.createElement('label', { className: 'import-btn' },
                  '📥 Importar datos',
                  React.createElement('input', {
                    type: 'file',
                    accept: '.json',
                    onChange: handleImportData,
                    style: { display: 'none' }
                  })
                )
              )
            )
          )
        ),
        React.createElement(ProductList, {
          productos: productos,
          onEdit: handleEdit,
          onDelete: handleDeleteProduct,
          onClearStock: handleClearStock,
          onAddToCart: handleAddToCart,
          shoppingList: shoppingList,
          isLoading: isLoading
        })
      ),
      // Lista de Compras Tab
      activeTab === 'compras' && React.createElement('div', { className: 'tab-content' },
        React.createElement(ShoppingList, {
          items: shoppingList,
          onRemove: handleRemoveFromCart,
          onClear: handleClearCart,
          onUpdateStock: handleUpdateStock,
          isLoading: isLoading
        })
      ),
      // Recetas Tab
      activeTab === 'recetas' && React.createElement('div', { className: 'tab-content' },
        React.createElement(RecipeGenerator, { productos: productos, user: user })
      ),
      // Configuración Tab
      activeTab === 'configuracion' && React.createElement('div', { className: 'tab-content' },
        React.createElement('div', { className: 'content-header' },
          React.createElement('h2', null, 'Configuración')
        ),
        React.createElement('div', { className: 'config-sections' },
          React.createElement('div', { className: 'config-section' },
            React.createElement('h3', null, 'Apariencia'),
            React.createElement('div', { className: 'config-item' },
              React.createElement('label', null, 'Modo oscuro'),
              React.createElement('button', {
                onClick: toggleTheme,
                className: `toggle-btn ${isDarkMode ? 'active' : ''}`
              }, React.createElement('span', { className: 'toggle-slider' }))
            )
          ),
          React.createElement('div', { className: 'config-section' },
            React.createElement('h3', null, 'Datos'),
            React.createElement('div', { className: 'config-actions' },
              React.createElement('button', {
                onClick: handleExportData,
                className: 'btn-secondary'
              }, '📤 Exportar todos los datos'),
              React.createElement('label', { className: 'btn-secondary' },
                '📥 Importar datos',
                React.createElement('input', {
                  type: 'file',
                  accept: '.json',
                  onChange: handleImportData,
                  style: { display: 'none' }
                })
              ),
              React.createElement('button', {
                onClick: handleForceInitialize,
                className: user ? 'btn-secondary' : 'btn-secondary btn-disabled',
                disabled: isLoading || !user,
                title: !user ? 'Inicia sesión para reinicializar productos' : 'Reinicializar productos'
              }, isLoading ? '⏳ Reinicializando...' : '🔄 Reinicializar Productos'),
              React.createElement('button', {
                onClick: handleCleanAndInitialize,
                className: user ? 'btn-primary' : 'btn-primary btn-disabled',
                disabled: isLoading || !user,
                title: !user ? 'Inicia sesión para limpiar la base de datos' : 'Limpiar base de datos'
              }, isLoading ? '⏳ Limpiando...' : '🧹 Limpiar Base de Datos')
            )
          ),
          React.createElement('div', { className: 'config-section' },
            React.createElement('h3', null, 'Información'),
            React.createElement('div', { className: 'info-grid' },
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Productos totales:'),
                React.createElement('span', null, productos.length)
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Lista de compras:'),
                React.createElement('span', null, shoppingList.length)
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Versión:'),
                React.createElement('span', null, '2.0.0')
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Almacenamiento:'),
                React.createElement('span', null, 'Firebase Realtime DB')
              )
            )
          ),
          dbStats && React.createElement('div', { className: 'config-section' },
            React.createElement('h3', null, 'Estadísticas de Base de Datos'),
            React.createElement('div', { className: 'info-grid' },
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Productos en DB:'),
                React.createElement('span', null, dbStats.productos)
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Configuraciones:'),
                React.createElement('span', null, dbStats.config)
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Items en lista:'),
                React.createElement('span', null, dbStats.shoppingList)
              ),
              React.createElement('div', { className: 'info-item' },
                React.createElement('strong', null, 'Total items:'),
                React.createElement('span', null, dbStats.totalItems)
              )
            ),
            React.createElement('div', { className: 'db-info' },
              React.createElement('p', null, '📊 Uso gratuito de Firebase: 1GB almacenamiento, 10GB transferencia/mes')
            )
          )
        )
      )
    ),
    
    // Modal para agregar/editar producto
    showForm && React.createElement('div', { className: 'modal-overlay' },
      React.createElement('div', { className: 'modal' },
        React.createElement(ProductForm, {
          onSubmit: editingProduct ? handleEditProduct : handleAddProduct,
          onCancel: handleCancelForm,
          initialData: editingProduct,
          isLoading: isLoading
        })
      )
    ),
    
    // Footer
    React.createElement('footer', { className: 'app-footer' },
      React.createElement('p', null, '🍽️ Inventario Refri v2.0 - Gestiona tu refrigerador con IA')
    )
  );
}

// Renderizar la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App)); 