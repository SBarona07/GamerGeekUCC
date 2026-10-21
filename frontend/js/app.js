const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    // 🛡️ GUARDIÁN VISUAL: Controla si la pestaña "Panel Admin" se esconde o se muestra
    verificarVisibilidadMenu();

    // 1. CONTROLADOR DE LA TIENDA PRINCIPAL
    if (path.includes("index.html") || path === "/" || path.endsWith("/frontend/")) {
        cargarVideojuegos();
    }

    // 2. CONTROLADOR DEL FORMULARIO DE LOGIN
    if (path.includes("login.html")) {
        configurarLogin();
    }

    // 3. CONTROLADOR DEL FORMULARIO DE REGISTRO
    if (path.includes("registro.html")) {
        configurarRegistro();
    }

    // 4. CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
    if (path.includes("admin.html")) {
        const rol = localStorage.getItem("user_rol");
        if (rol !== "administrador") {
            alert("❌ Acceso denegado. Esta es una zona exclusiva del equipo técnico.");
            window.location.href = "login.html";
            return;
        }
        configurarAdmin();
    }

    // 5. CONTROLADOR DE LA BIBLIOTECA DE USUARIO
    if (path.includes("biblioteca.html")) {
        cargarBibliotecaGamer();
    }
});

// === 🎮 FUNCIÓN 1: RECOLECTAR Y PINTAR EL CATÁLOGO DE LA TIENDA ===
async function cargarVideojuegos() {
    const container = document.getElementById("games-container");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/videojuegos`);
        if (!response.ok) throw new Error("No se pudo conectar con el backend");
        
        const juegos = await response.json();
        container.innerHTML = ""; 
        
        if (juegos.length === 0) {
            container.innerHTML = `<p class="error-msg">No hay videojuegos disponibles en este momento.</p>`;
            return;
        }

        // Guardamos los juegos globalmente en la ventana para que el carrito los encuentre por ID fácilmente
        window.catalogoJuegosGlobal = juegos;

        juegos.forEach(juego => {
            const card = document.createElement("div");
            card.className = "game-card";
            const imagenFondo = juego.imagen_url || 'https://unsplash.com';
            
            const rolActual = localStorage.getItem("user_rol");
            let botonEliminarHTML = "";
            
            if (rolActual === "administrador") {
                botonEliminarHTML = `<button class="delete-btn" onclick="eliminarVideojuegoReal(${juego.id})" style="background-color: #ff4d4d; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-left: 10px; transition: 0.3s;">🗑️ Borrar</button>`;
            }
            
             card.innerHTML = `
                <div class="game-img" style="background-image: url('${imagenFondo}')"></div>
                <div class="game-info">
                    <!-- Contenedor flexible para alinear las dos etiquetas gamer -->
                    <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
                        <span class="category-badge">${juego.categoria || 'Gamer'}</span>
                        
                        <!-- 🚀 ¡ESTA ES LA ETIQUETA NEÓN DE LA PLATAFORMA! -->
                        <span class="platform-badge" style="
                            background: rgba(69, 243, 255, 0.1); 
                            border: 1px solid #45f3ff; 
                            color: #45f3ff; 
                            font-size: 11px; 
                            padding: 3px 10px; 
                            border-radius: 4px; 
                            font-weight: 800; 
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            box-shadow: 0 0 8px rgba(69, 243, 255, 0.2);
                        ">🎮 ${juego.plataforma || 'PC'}</span>
                    </div>

                    <h3>${juego.titulo}</h3>
                    <p class="description">${juego.descripcion}</p>
                    <div class="card-footer">
                        <span class="price">$${parseFloat(juego.precio).toFixed(2)}</span>
                        <button class="buy-btn" onclick="agregarAlCarritoReal(${juego.id})">Añadir</button>
                        ${botonEliminarHTML}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error en frontend:", error);
        container.innerHTML = `<p class="error-msg">⚠️ Error al cargar el catálogo de juegos. Verifica la conexión con el servidor.</p>`;
    }
}


// === 🔐 FUNCIÓN 2: CONTROL DEL FORMULARIO DE LOGIN POR ROLES ===
function configurarLogin() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const usuarioInput = document.getElementById("usuario");
        const contrasenaInput = document.getElementById("contrasena");
        const errorMsg = document.getElementById("error-message");

        if (!usuarioInput || !contrasenaInput) {
            alert("❌ Error interno: No se localizaron los campos de texto en el HTML.");
            return;
        }

        const usuario = usuarioInput.value;
        const contrasena = contrasenaInput.value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, contrasena })
            });
            
            const resultado = await response.json();

            if (response.ok && resultado.status === "success") {
                alert(resultado.mensaje);
                
                // 🚀 ¡TRUCO DE PERSISTENCIA 1!: Respaldamos el carrito en memoria antes de tocar la sesión
                const carritoRespaldado = localStorage.getItem("carrito_gamer");
                
                // Borramos las variables viejas de sesión pero NO borramos todo para no destruir el carrito
                localStorage.removeItem("user_rol");
                localStorage.removeItem("user_gamertag");
                
                // Guardamos los nuevos datos de sesión de forma transparente
                localStorage.setItem("user_rol", resultado.rol);
                localStorage.setItem("user_gamertag", usuario); 
                
                // Si el carrito existía, lo devolvemos intacto al sistema gamer
                if (carritoRespaldado) {
                    localStorage.setItem("carrito_gamer", carritoRespaldado);
                }
                
                // 🚀 ¡TRUCO DE REDIRECCIÓN INTERACTIVA 2!: 
                // Revisamos si en la URL venía una orden de redirección (ej: de carrito.html)
                const parametrosUrl = new URLSearchParams(window.location.search);
                const destinoRedirect = parametrosUrl.get("redirect");

                if (resultado.rol === "administrador") {
                    window.location.href = "index.html";
                } else if (destinoRedirect) {
                    // Si el cliente venía rebotado del carrito, lo regresamos directo al carrito
                    window.location.href = destinoRedirect;
                } else {
                    // Si entró por su cuenta, va al catálogo principal
                    window.location.href = "index.html";
                }
            } else {
                const textoError = resultado.detail || "Credenciales incorrectas. Verifica tu Gamertag y contraseña.";
                if (errorMsg) {
                    errorMsg.innerText = textoError;
                } else {
                    alert("❌ " + textoError);
                }
            }
        } catch (error) {
            console.error("Error en petición de login:", error);
            alert("⚠️ No se pudo establecer conexión con el backend.");
        }
    });
}

// === 📝 FUNCIÓN 3: CONTROL DEL FORMULARIO DE REGISTRO EN LA NUBE ===
function configurarRegistro() {
    const form = document.getElementById("registro-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usuario = document.getElementById("reg-username").value;
        const correo = document.getElementById("reg-email").value;
        const contrasena = document.getElementById("reg-password").value;

        try {
            const response = await fetch(`${API_URL}/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, correo, contrasena })
            });
            const resultado = await response.json();

            if (response.ok && resultado.status === "success") {
                alert(resultado.mensaje);
                window.location.href = "login.html"; 
            } else {
                alert(resultado.detail || "Error al intentar crear la cuenta.");
            }
        } catch (error) {
            alert("⚠️ No se pudo conectar con el servidor de registro.");
        }
    });
}

// === 💾 FUNCIÓN 4: GESTIÓN DE NUEVOS JUEGOS DESDE PANEL ADMIN (CRUD) ===
function configurarAdmin() {
    const form = document.getElementById("admin-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nuevoJuego = {
            titulo: document.getElementById("admin-titulo").value,
            descripcion: document.getElementById("admin-descripcion").value,
            precio: parseFloat(document.getElementById("admin-precio").value),
            categoria: document.getElementById("admin-categoria").value,
            plataforma: document.getElementById("admin-plataforma").value,
            imagen_url: document.getElementById("admin-imagen").value,
            stock_keys: parseInt(document.getElementById("admin-stock").value)
        };

        try {
            const response = await fetch(`${API_URL}/videojuegos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevoJuego)
            });
            
            const resultado = await response.json();
            if (response.ok) {
                alert(resultado.mensaje);
                form.reset();
            } else {
                alert("⚠️ " + (resultado.detail || "No se pudo registrar el juego en la nube."));
            }
        } catch (error) {
            alert("⚠️ Error al comunicarse con el servidor al guardar el videojuego.");
        }
    });
}


// === 🔑 FUNCIÓN 5: CONSULTAR JUEGOS COMPRADOS REALES EN SUPABASE ===
async function cargarBibliotecaGamer() {
    const container = document.getElementById("library-games-container");
    if (!container) return;

    const gamertagActual = localStorage.getItem("user_gamertag");
    // 🚀 DECLARACIÓN REPARADA: Sacamos el rol de la sesión local para evitar URLs mochas
    const rolActual = localStorage.getItem("user_rol");

    if (!gamertagActual || !rolActual) {
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="error-msg" style="color: #ff4d4d; font-weight: bold; font-size: 18px;">🔒 Biblioteca Restringida</p>
                <p class="text-muted">Por favor, inicia sesión con tu cuenta de PixelVault para ver tus videojuegos adquiridos.</p>
                <a href="login.html" class="btn btn-outline-info mt-2">🔑 Iniciar Sesión</a>
            </div>`;
        return;
    }

    const tituloSeccion = document.querySelector("h1, h2"); 
    const subtituloSeccion = document.querySelector("p"); 
    if (rolActual === "administrador") {
        if (tituloSeccion) tituloSeccion.innerText = "🛠️ Historial Técnico de Claves";
        if (subtituloSeccion) subtituloSeccion.innerText = "Control global y auditoría de licencias de activación emitidas en Supabase.";
    }

    try {
        const response = await fetch(`${API_URL}/biblioteca/${gamertagActual}/${rolActual}`);
        if (!response.ok) throw new Error("Error en el servidor de licencias relacionales");
        
        const juegosComprados = await response.json();
        container.innerHTML = ""; 
        
        if (juegosComprados.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <p class="fs-5">🎮 Tu colección digital está vacía, ${gamertagActual}.</p>
                    <p>Adquiere tus títulos favoritos desde el catálogo para activar tus licencias globales.</p>
                    <a href="index.html" class="btn mt-2" style="background-color: #bc13fe; color: white; font-weight: bold;">🛒 Ir a la Tienda</a>
                </div>`;
            return;
        }

        juegosComprados.forEach(juego => {
            const card = document.createElement("div");
            card.className = "library-card";
            const imagenFondo = juego.imagen_url || 'https://unsplash.com';
            
            // Sincronizamos la lectura flexible de tus Keys reales de Supabase
            const claveFisicaDeBaseDatos = juego.clave_real || juego.clave_digital || "PV-GENERANDO-UCC26";

            // 🚀 AUTOMÁTICO PARA AUDITORÍA: Revisa si el backend mandó el dueño del pedido (ej: desde tu tabla de compras)
            // Si el backend no mapea el campo directo, toma el gamertag de la sesión o lo marca como Auditoría Global
            const compradorReal = juego.usuario_comprador || juego.usuario || "Auditoría Global";

            // 👑 LÓGICA DE PRIVILEGIOS: Si el rol es administrador, fabricamos la etiqueta brillante del cliente
            let etiquetaClienteAdminHTML = "";
            if (rolActual === "administrador") {
                etiquetaClienteAdminHTML = `
                    <div style="margin-bottom: 12px; background: rgba(69, 243, 255, 0.1); border: 1px solid #45f3ff; color: #45f3ff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase;">
                        👤 Cliente: ${compradorReal}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-img" style="background-image: url('${imagenFondo}')"></div>
                <div class="card-content" style="padding: 15px;">
                    
                    <!-- 🚀 INYECCIÓN DE AUDITORÍA: Aparecerá únicamente en la pantalla del Administrador técnico -->
                    ${etiquetaClienteAdminHTML}

                    <h3 style="font-size: 18px; margin-bottom: 10px; color: #ffffff; font-weight: 700;">${juego.titulo}</h3>
                    <div class="key-box" style="background: rgba(69, 243, 255, 0.1); border: 1px solid #45f3ff; color: #45f3ff; padding: 8px; border-radius: 4px; font-family: monospace; font-weight: bold; text-align: center; font-size: 14px; box-shadow: 0 0 10px rgba(69, 243, 255, 0.2);">🔑 KEY: ${claveFisicaDeBaseDatos}</div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error en render de biblioteca relacional:", error);
        container.innerHTML = `<p class="error-msg">⚠️ Error de sincronización al conectar con el servidor de activaciones de Supabase.</p>`;
    }
}


// === 🛡️ FUNCIÓN GLOBAL
function verificarVisibilidadMenu() {
    const headerElement = document.querySelector("header") || document.querySelector(".navbar");
    if (!headerElement) return;

    const rol = localStorage.getItem("user_rol");
    const gamertag = localStorage.getItem("user_gamertag") || "Gamer";
    const carritoActual = JSON.parse(localStorage.getItem("carrito_gamer")) || [];
    
    // 🚀 CORRECCIÓN CRÍTICA: Ambas variables se llaman exactamente 'acumulador' para evitar el ReferenceError
    const totalItems = carritoActual.reduce((acumulador, item) => acumulador + item.cantidad, 0);

    const estiloBotonGamer = `
        border: none;
        outline: none;
        text-decoration: none; 
        color: #ffffff; 
        font-weight: 700; 
        font-size: 14px;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
        padding: 8px 18px;
        border-radius: 6px;
        transition: all 0.2s ease;
        cursor: pointer;
    `;

    let botonesCentralesHTML = `
        <a href="index.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Tienda
        </a>
    `;

    if (rol && rol !== "undefined" && rol !== "null") {
        botonesCentralesHTML += `
            <a href="biblioteca.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Mi Biblioteca
            </a>
        `;
    }

    if (rol === "administrador") {
        botonesCentralesHTML += `
            <a href="admin.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Panel Admin
            </a>
        `;
    }

    let bloqueDerechoHTML = "";
    if (rol && rol !== "undefined" && rol !== "null") {
        bloqueDerechoHTML = `
            <a href="carrito.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Carrito (${totalItems})
            </a>
            <span style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: 14px; color: #45f3ff; text-transform: none;">
                👤 Gamer: ${gamertag}
            </span>
            <a href="#" onclick="cerrarSesionGamer()" style="
                color: #ff4d4d; 
                text-decoration: none; 
                font-weight: bold; 
                background: rgba(255,77,77,0.05); 
                padding: 6px 14px; 
                border-radius: 4px; 
                font-size: 13px; 
                border: 1px solid #ff4d4d;
                transition: all 0.2s;
            " onmouseover="this.style.background='#ff4d4d'; this.style.color='#ffffff';" onmouseout="this.style.background='rgba(255,77,77,0.05)'; this.style.color='#ff4d4d';">
                Cerrar Sesión
            </a>
        `;
    } else {
        bloqueDerechoHTML = `
            <a href="carrito.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Carrito (${totalItems})
            </a>
            <a href="login.html" style="${estiloBotonGamer}" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Iniciar Sesión
            </a>
        `;
    }

    headerElement.style = "background-color: #110b29; border-bottom: 2px solid #bc13fe; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); box-sizing: border-box;";
    
    headerElement.innerHTML = `
        <div class="navbar-left">
            <a href="index.html" style="text-decoration: none; font-size: 24px; font-weight: 900; letter-spacing: 1px; background: linear-gradient(135deg, #bc13fe 0%, #45f3ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block;">GamerGeekUCC</a>
        </div>
        <div class="navbar-center" style="display: flex; align-items: center; gap: 15px;">
            ${botonesCentralesHTML}
        </div>
        <div class="navbar-right" style="display: flex; align-items: center; gap: 15px;">
            ${bloqueDerechoHTML}
        </div>
    `;
}


// === 🚪 FUNCIÓN GLOBAL: CERRAR SESIÓN DE FORMA SEGURA ===
window.cerrarSesionGamer = function() {
    localStorage.removeItem("user_rol"); // Borra el rol del usuario actual
    localStorage.removeItem("carrito_gamer"); // 🚀 ¡NUEVO! Limpia el carrito para que no lo herede el siguiente
    alert("¡Sesión cerrada con éxito! Tu carrito ha sido vaciado. Volviendo al catálogo.");
    window.location.href = "index.html";
};


// === 🛒 FUNCIÓN GLOBAL: AGREGAR AL CARRITO BUSCANDO POR ID ===
window.agregarAlCarritoReal = function(idJuego) {
    // 1. Buscar el juego completo en la lista que descargamos en la tienda
    if (!window.catalogoJuegosGlobal) return;
    const juegoEncontrado = window.catalogoJuegosGlobal.find(j => j.id === idJuego);
    
    if (!juegoEncontrado) {
        alert("❌ Error: No se encontraron los datos de este videojuego.");
        return;
    }

    // 2. Recuperar el carrito actual del almacenamiento del navegador
    let carrito = JSON.parse(localStorage.getItem("carrito_gamer")) || [];

    // 3. Verificar si ya estaba en el carrito
    const existe = carrito.find(item => item.id === idJuego);

    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({
            id: juegoEncontrado.id,
            titulo: juegoEncontrado.titulo,
            precio: juegoEncontrado.precio,
            imagen_url: juegoEncontrado.imagen_url,
            cantidad: 1
        });
    }

    // 4. Guardar de vuelta en el navegador
    localStorage.setItem("carrito_gamer", JSON.stringify(carrito));

    // 5. Alerta de éxito y actualización del contador superior (0)
    alert(`🎮 ¡${juegoEncontrado.titulo} agregado al carrito de GamerGekk UCC`);
    actualizarContadorCarritoVisual();
};

// === 🗑️ FUNCIÓN SISTEMA: ENVIAR PETICIÓN DE BORRADO A FASTAPI ===
window.eliminarVideojuegoReal = async function(idJuego) {
    if (!confirm("⚠️ ¿Estás completamente seguro de que deseas eliminar este videojuego de Supabase?")) return;

    try {
        const response = await fetch(`${API_URL}/videojuegos/${idJuego}`, {
            method: "DELETE"
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            alert(resultado.mensaje);
            cargarVideojuegos(); // Recarga instantáneamente el catálogo para refrescar la pantalla
        } else {
            alert("❌ " + (resultado.detail || "Error al intentar eliminar el juego."));
        }
    } catch (error) {
        alert("⚠️ No se pudo establecer conexión con el servidor para eliminar el juego.");
    }
};


// =========================================================================
// 🛒 MANEJADOR DINÁMICO DE LA VISTA DEL CARRITO (HTML INTERACTIVO)
// =========================================================================

// Escuchar cuando se carga la página para verificar si estamos en carrito.html
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("carrito.html")) {
        renderizarTablaCarrito();
    }
});

// === 🎨 FUNCIÓN PARA DIBUJAR LOS JUEGOS EN LA TABLA ===
function renderizarTablaCarrito() {
    const tablaCuerpo = document.getElementById("lista-carrito-cuerpo");
    const totalContador = document.getElementById("cart-total-usd");
    if (!tablaCuerpo || !totalContador) return;

    let carrito = JSON.parse(localStorage.getItem("carrito_gamer")) || [];
    tablaCuerpo.innerHTML = "";
    let totalAcumulado = 0;

    // 🚀 ¡AQUÍ ESTÁ EL TRUCO DEL USUARIO!: Recuperamos el Gamertag de la sesión activa
    const usuarioLogueado = localStorage.getItem("user_gamertag") || "Invitado";
    
    // Buscamos el encabezado h2 de tu carrito.html para inyectarle el nombre al lado de forma elegante
    const contenedorTitulo = document.querySelector(".cart-container h2");
    if (contenedorTitulo) {
        contenedorTitulo.innerHTML = `
            📋 Tu Carrito Gamer 
            <span style="color: #45f3ff; font-size: 14px; margin-left: 15px; background: rgba(69, 243, 255, 0.1); border: 1px solid #45f3ff; padding: 4px 12px; border-radius: 6px; font-weight: bold; text-transform: none;">
                👤 COMPRADOR: ${usuarioLogueado}
            </span>
        `;
    }

    if (carrito.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted" style="font-size: 16px; color: #aaaaaa;">🎮 Tu carrito de PixelVault está vacío. ¡Regresa a la tienda a buscar juegos!</td></tr>`;
        totalContador.innerText = "\$0.00";
        return;
    }

    carrito.forEach((juego, index) => {
        const subtotal = juego.precio * juego.cantidad;
        totalAcumulado += subtotal;

        const fila = document.createElement("tr");
        fila.style.borderBottom = "1px solid rgba(188, 19, 254, 0.1)";
        
        const fotoMiniatura = juego.imagen_url || 'https://unsplash.com';

        fila.innerHTML = `
            <td style="padding: 12px 8px; vertical-align: middle;">
                <div style="width: 45px; height: 55px; background-image: url('${fotoMiniatura}'); background-size: cover; background-position: center; border-radius: 4px; border: 1px solid rgba(69, 243, 255, 0.3);"></div>
            </td>
            <td style="padding: 12px 8px; vertical-align: middle;"><strong style="color: #ffffff; font-size: 15px;">${juego.titulo}</strong></td>
            <td style="padding: 12px 8px; vertical-align: middle; color: #aaaaaa;">$${parseFloat(juego.precio).toFixed(2)}</td>
            <td style="padding: 12px 8px; vertical-align: middle;">
                <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 14px; border: 1px solid rgba(255,255,255,0.15);">${juego.cantidad} unds</span>
            </td>
            <td style="padding: 12px 8px; vertical-align: middle; color: #45f3ff; font-weight: bold; font-size: 15px;">$${subtotal.toFixed(2)}</td>
            <td style="padding: 12px 8px; vertical-align: middle;">
                <button onclick="eliminarItemDelCarrito(${index})" style="background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid #ff4d4d; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px; transition: all 0.2s;" onmouseover="this.style.background='#ff4d4d'; this.style.color='#ffffff';" onmouseout="this.style.background='rgba(255, 77, 77, 0.1)'; this.style.color='#ff4d4d';">❌ Quitar</button>
            </td>
        `;
        tablaCuerpo.appendChild(fila);
    });

    totalContador.innerText = `$${totalAcumulado.toFixed(2)}`;
}

// === ❌ FUNCIÓN PARA ELIMINAR UN JUEGO ESPECÍFICO ===
window.eliminarItemDelCarrito = function(index) {
    let carrito = JSON.parse(localStorage.getItem("carrito_gamer")) || [];
    carrito.splice(index, 1); // Borramos el elemento del arreglo usando su posición
    localStorage.setItem("carrito_gamer", JSON.stringify(carrito));
    renderizarTablaCarrito(); // Refrescamos la tabla en pantalla
    if (typeof actualizarContadorCarritoVisual === "function") actualizarContadorCarritoVisual();
};

// === 🧹 FUNCIÓN PARA VACIAR TODO EL CARRITO ===
window.vaciarTodoElCarrito = function() {
    if (confirm("¿Deseas quitar todos los videojuegos de tu carrito?")) {
        localStorage.removeItem("carrito_gamer");
        renderizarTablaCarrito();
        if (typeof actualizarContadorCarritoVisual === "function") actualizarContadorCarritoVisual();
    }
};


// === 🚀 CONFIRMAR COMPRA REAL CON FILTRO DE SEGURIDAD
window.procesarCompraFinal = async function() {
    let carrito = JSON.parse(localStorage.getItem("carrito_gamer")) || [];
    if (carrito.length === 0) {
        alert("⚠️ Tu carrito está vacío. Agrega juegos en la tienda antes de confirmar.");
        return;
    }

    // 🔐 FILTRO DE SEGURIDAD ULTRA ESTRICTO
    // Recuperamos el gamertag y el rol guardados en el navegador
    const usuarioActual = localStorage.getItem("user_gamertag");
    const rolActual = localStorage.getItem("user_rol");

    // Si NO hay un gamertag guardado en el navegador, bloqueamos la compra inmediatamente
    if (!usuarioActual || usuarioActual === "undefined" || usuarioActual === "null" || !rolActual) {
        alert("🔒 ¡Alto ahí, Gamer! Para procesar tu compra y asignar tus licencias digitales debes iniciar sesión primero.");
        // Cambia la línea de redirección dentro del bloqueo por esta:
        window.location.href = "login.html?redirect=carrito.html";
 // Redirección inmediata al formulario de login
        return; // Detiene la ejecución del código por completo para que no llame a FastAPI
    }

    // Si pasa el filtro de arriba, significa que sí está logueado de verdad
    if (!confirm(`🚀 ¿Estás listo para confirmar tu compra gamer, ${usuarioActual}? Esto actualizará el stock en la nube.`)) return;

    try {
        const response = await fetch(`${API_URL}/pedidos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario: usuarioActual, // Mandamos el Gamertag real a Supabase
                carrito: carrito
            })
        });

        const resultado = await response.json();

        if (response.ok && resultado.status === "success") {
            alert(resultado.mensaje);
            
            // Destruimos el carrito local para que vuelva a (0)
            localStorage.removeItem("carrito_gamer");
            
            window.location.href = "index.html";
        } else {
            alert("❌ Error en la transacción: " + (resultado.detail || "No se pudo procesar la orden."));
        }
    } catch (error) {
        console.error("Error en pago:", error);
        alert("⚠️ No se pudo conectar con el backend. Verifica que FastAPI esté corriendo.");
    }
};



// === 📊 FUNCIÓN PARA ACTUALIZAR EL CONTADOR (0) EN LA NAV BAR SUPERIOR (ESTILO BOTÓN MORADO) ===
function actualizarContadorCarritoVisual() {
    // Buscamos todas las etiquetas de la cabecera superior
    const elementosNavbar = document.querySelectorAll("a, span, button, li");
    
    // Filtramos cuál de ellas contiene la palabra "Carrito" de tu diseño
    const botonCarritoReal = Array.from(elementosNavbar).find(el => el.textContent.includes("Carrito"));

    if (botonCarritoReal) {
        const carritoActual = JSON.parse(localStorage.getItem("carrito_gamer")) || [];
        const totalItems = carritoActual.reduce((acumulador, item) => acumulador + item.cantidad, 0);
        
        // 🚀 RESETEO CRÍTICO: Quitamos bordes tridimensionales, iconos nativos y fondos del navegador
        botonCarritoReal.style.border = "none";
        botonCarritoReal.style.outline = "none";
        botonCarritoReal.style.webkitAppearance = "none";
        botonCarritoReal.style.mozAppearance = "none";
        botonCarritoReal.style.appearance = "none";
        
        // 🎨 ESTILOS IDÉNTICOS AL BOTÓN DE INICIAR SESIÓN
        botonCarritoReal.style.textDecoration = "none";
        botonCarritoReal.style.color = "#ffffff";
        botonCarritoReal.style.marginLeft = "20px";
        botonCarritoReal.style.fontWeight = "700";
        botonCarritoReal.style.fontSize = "16px"; // Sincronizado con el tamaño de Iniciar Sesión
        botonCarritoReal.style.fontFamily = "inherit";
        botonCarritoReal.style.transition = "all 0.3s ease";
        botonCarritoReal.style.cursor = "pointer";
        
        // Configuración de la estructura de la cápsula
        botonCarritoReal.style.display = "inline-flex";
        botonCarritoReal.style.alignItems = "center";
        botonCarritoReal.style.justifyContent = "center";
        botonCarritoReal.style.background = "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)";
        botonCarritoReal.style.padding = "10px 20px";
        botonCarritoReal.style.borderRadius = "8px";
        botonCarritoReal.style.boxShadow = "none"; // Quitamos sombras raras para emparejar

        // Efectos dinámicos limpios al pasar el mouse por encima
        botonCarritoReal.onmouseover = function() {
            this.style.opacity = "0.9";
        };
        botonCarritoReal.onmouseout = function() {
            this.style.opacity = "1";
        };
        
        // 🚀 TEXTO LIMPIO: Quitamos cualquier icono viejo o imagen gris del HTML y dejamos solo el texto puro
        botonCarritoReal.innerHTML = `Carrito (${totalItems})`;
    }
}



// Dejar el contador activo de manera preventiva apenas cargue cualquier página
setTimeout(actualizarContadorCarritoVisual, 150);

// ==================== 🎛️ MOTOR DE FILTRADO PARA TU NUEVA BARRA ESTILIZADA ====================

// 1. 🚀 Conectamos la barra de búsqueda para que escuche en tiempo real cada letra
document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "search-input") {
        ejecutarFiltroGamerCombinado();
    }
});

// 2. 🏷️ Conectamos los botones ovalados de categorías para filtrar por clic
window.filtrarCatalogoGamer = function(categoria) {
    window.CATEGORIA_ACTIVA_GAMER = categoria;

    // Cambiamos los colores de los botones para que se note cuál está seleccionado
    const botones = document.querySelectorAll(".categories-wrapper button");
    botones.forEach(btn => {
        // Normalizamos el texto quitando espacios o mayúsculas para comparar
        const textoBoton = btn.innerText.trim().toUpperCase();
        const textoCategoria = categoria.trim().toUpperCase();

        if (textoBoton === textoCategoria) {
            btn.style.background = "#bc13fe";
            btn.style.color = "white";
            btn.style.borderColor = "#bc13fe";
        } else {
            btn.style.background = "rgba(69, 243, 255, 0.05)";
            btn.style.color = "#45f3ff";
            btn.style.borderColor = "rgba(69, 243, 255, 0.4)";
        }
    });

    ejecutarFiltroGamerCombinado();
};

// 3. 🎛️ El cerebro del motor: Revisa el texto + la categoría y oculta/muestra las tarjetas
function ejecutarFiltroGamerCombinado() {
    const container = document.getElementById("games-container");
    if (!container) return;

    // Capturamos el texto escrito en la barra ovalada
    const inputElement = document.getElementById("search-input");
    const textoBuscar = inputElement ? inputElement.value.toLowerCase().trim() : "";
    
    // Recuperamos la categoría seleccionada (por defecto es "Todos")
    const categoriaFiltro = window.CATEGORIA_ACTIVA_GAMER || "Todos";

    // Buscamos todas las tarjetas físicas de videojuegos dibujadas en tu pantalla
    const tarjetas = container.getElementsByClassName("game-card");

    Array.from(tarjetas).forEach(tarjeta => {
        // Extraemos el título del juego y la categoría desde las etiquetas de la misma tarjeta
        const tituloJuego = tarjeta.querySelector("h3") ? tarjeta.querySelector("h3").innerText.toLowerCase() : "";
        const textoBadge = tarjeta.querySelector(".category-badge") ? tarjeta.querySelector(".category-badge").innerText.toUpperCase() : "";

        // Validaciones lógicas en milisegundos
        const coincideTexto = tituloJuego.includes(textoBuscar);
        const coincideCategoria = (categoriaFiltro === "Todos" || textoBadge.includes(categoriaFiltro.toUpperCase()));

        // 🪄 ¡LA MAGIA ACCESIBLE!: Si cumple ambas condiciones se muestra ("block"), si no, se oculta ("none")
        if (coincideTexto && coincideCategoria) {
            tarjeta.style.display = "block";
        } else {
            tarjeta.style.display = "none";
        }
    });
}


async function cargarNoticiasGamer() {
    const contenedorNoticias = document.getElementById("noticias-container");
    if (!contenedorNoticias) return;

    try {
        const response = await fetch(`${API_URL}/noticias`);
        if (!response.ok) throw new Error("Fallo al conectar con el endpoint de noticias");
        const noticias = await response.json();
        
        contenedorNoticias.innerHTML = "";
        
        noticias.forEach(nota => {
            const bloque = document.createElement("div");
            // Diseño limpio sin imagen, enfocado en tipografía cyberpunk neón
            bloque.style = "background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(69, 243, 255, 0.15); padding: 12px; border-radius: 8px; color: white; margin-bottom: 10px; text-align: left;";
            
            bloque.innerHTML = `
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0 0 6px 0; color: #45f3ff; font-size: 13px; font-weight: 700; line-height: 1.2;">${nota.titulo}</h4>
                    
                    <!-- Contenedor del texto controlado por CSS para ocultar el exceso -->
                    <p id="texto-${nota.id}" style="margin: 0 0 6px 0; font-size: 11.5px; color: #aaaaaa; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${nota.resumen}
                    </p>
                    
                    <!-- Botón interactivo de Leer Más -->
                    <span id="btn-${nota.id}" onclick="conmutarTextoGamer('${nota.id}')" style="color: #bc13fe; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-block; transition: 0.2s;" onmouseover="this.style.color='#45f3ff'" onmouseout="this.style.color='#bc13fe'">
                        Leer más ➔
                    </span>
                </div>
            `;
            contenedorNoticias.appendChild(bloque);
        });
    } catch (error) {
        console.error("Error en el render del widget de analíticas:", error);
        contenedorNoticias.innerHTML = `<p style="color: #ff4d4d; font-size: 11px; text-align: center; padding: 10px;">⚠️ Error de sincronización con FastAPI.</p>`;
    }
}

// 🎯 FUNCIÓN MAESTRA: Expande o colapsa el texto largo al darle un clic
function conmutarTextoGamer(id) {
    const parrafo = document.getElementById(`texto-${id}`);
    const boton = document.getElementById(`btn-${id}`);
    
    if (parrafo && boton) {
        if (parrafo.style.display === "-webkit-box") {
            // EXPANSIÓN: Quitamos el límite de 2 líneas para mostrar todo el texto completo
            parrafo.style.display = "block";
            parrafo.style.overflow = "visible";
            boton.innerHTML = "Ocultar texto ↩";
            boton.style.color = "#45f3ff";
        } else {
            // COLAPSAR: Volvemos a ocultar el texto largo a solo 2 líneas
            parrafo.style.display = "-webkit-box";
            parrafo.style.overflow = "hidden";
            boton.innerHTML = "Leer más ➔";
            boton.style.color = "#bc13fe";
        }
    }
}

// Escuchador automático para inyectar el widget al iniciar la tienda
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    if (path.includes("index.html") || path === "/" || path.endsWith("/frontend/")) {
        setTimeout(cargarNoticiasGamer, 300);
    }
});
