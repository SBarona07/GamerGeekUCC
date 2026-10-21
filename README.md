**# 🎮 GamerGeekUCC — Plataforma Full-Stack de Licencias Digitales

GamerGeekUCC es una aplicación web moderna orientada al comercio de videojuegos y la autogeneración transaccional de licencias digitales. Cuenta con una arquitectura robusta e interactiva que conecta un entorno de desarrollo local con persistencia relacional en la nube.

---

## 🛠️ Arquitectura del Sistema

El ecosistema opera bajo un modelo distribuido de tres capas en la misma aplicación:
1. **Frontend (Capa de Interfaz):** Maquetado limpio con HTML5, estilos CSS3 con estética Cyberpunk Neón y lógica de interacción asíncrona mediante JavaScript (Manipulación del DOM, Fetch API y persistencia en LocalStorage).
2. **Backend (Capa de Lógica):** API REST robusta e independiente construida sobre **FastAPI en Python**, gestionada de forma síncrona local mediante el servidor **Uvicorn**.
3. **Base de Datos (Capa de Persistencia):** Motor de base de datos PostgreSQL real alojado en internet dentro de la nube de **Supabase Cloud**.

---

## 🛢️ Modelo Relacional y Normalización

La base de datos se encuentra estructurada bajo los lineamientos estrictos de la **Tercera Forma Normal (3FN)**, garantizando la atomicidad, eliminando dependencias transitivas y la redundancia de datos en disco.

### Entidades y Cardinalidad
* **`usuarios`**: Entidad principal de cuentas (id_usuario [PK], username, correo, contrasena, rol).
* **`videojuegos`**: Entidad principal de inventario (id_videojuego [PK], titulo, descripcion, precio, categoria, plataforma, imagen_url, stock_keys).
* **`pedidos`**: Tabla de cabeceras de transacciones. Conectada de **1 a Muchos (1:N)** con `detalle_pedidos` mediante `id_pedido` [FK].
* **`detalle_pedidos`**: Tabla asociativa intermedia o de quiebre. Rompe la relación compleja de Muchos a Muchos entre Usuarios y Videojuegos, transformándola en dos relaciones simples de **Uno a Muchos (1:N)**. Almacena las unidades y la **`clave_digital`** única aleatoria por cada artículo vendido.

---

## 📡 Documentación Técnica de Endpoints (FastAPI)

Nuestra API expone **endpoints RESTful** nativos programados en Python que transfieren metadatos estructurados en formato JSON de forma asíncrona, operando en estados estándar de red `200 OK`, `201 Created` y control de excepciones `400/401/500`.

### 🎮 Catálogo e Inventario
* **`GET /videojuegos`**: Realiza peticiones HTTP remotas a Supabase para descargar y mapear los videojuegos activos en la tienda de forma dinámica.
* **`POST /videojuegos`**: Registra un nuevo título e inyecta sus atributos físicos directamente en el inventario de la nube.
* **`DELETE /videojuegos/{id}`**: Borra físicamente un juego del inventario web filtrando por su identificador único.

### 🔐 Control de Sesiones y Permisos
* **`POST /registro`**: Registra cuentas nuevas en la nube. Cuenta con restricciones lógicas que bloquean el proceso con códigos `400` si el correo o Gamertag ya existen.
* **`POST /login`**: Valida credenciales contra Supabase. Retorna las llaves de acceso cruzado y lee el perfil para definir privilegios de sesión (`cliente` o `administrador`).

### 🚀 Módulo Transaccional
* **`POST /pedidos`**: El procesador del carrito. Ejecuta una validación analítica preventiva de inventarios, calcula subtotales, inyecta la cabecera, actualiza el stock con celdas de tipo `PATCH` y gatilla el algoritmo que genera la licencia digital única (`PV-PREFIJO-RANDOM-UCC26`).

### 🔑 Licencias y Auditoría
* **`GET /biblioteca/{gamertag}/{rol}`**: Endpoint polimórfico. Si el rol es cliente, filtra e imprime únicamente las Keys del jugador activo. Si el rol es administrador, remueve los filtros de usuario y ejecuta un `JOIN` global que se transforma en un **Historial Técnico de Auditoría** de todas las Keys emitidas.

### 📊 Telemetría y Monitoreo Interno
* **`GET /noticias`**: Endpoint nativo de nuestra aplicación. Realiza consultas agregadas en milisegundos sobre las tablas de Supabase y lee la velocidad de red de la máquina. Provee la información que alimenta de forma asíncrona al **Live Analytics Widget** del Frontend (equipado con funciones interactivas de expansión mediante "Leer más").
**
