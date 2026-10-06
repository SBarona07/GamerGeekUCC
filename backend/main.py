import requests
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SBarona707UCC API - Supabase Producción Real",
    description="Backend gamer conectado a una base de datos PostgreSQL real en la nube.",
    version="3.0.0"
)

# Configurar permisos de CORS indispensables para el Live Server (Puerto 5500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🌐 DATOS REALES DE TU NUBE DE SUPABASE (Corregidos)
SUPABASE_URL = "https://gwmevyxyjicalwzhsajh.supabase.co"
SUPABASE_KEY = "sb_secret_nK3jiyjom_xbSAcv3VSX9Q_75T8q-1t"
                

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}


# ==================== RUTA GET: LECTURA EN TIEMPO REAL DESDE LA NUBE ====================
@app.get("/videojuegos")
def obtener_videojuegos():
    try:
        
        respuesta = requests.get(f"{SUPABASE_URL}/rest/v1/videojuegos?select=*", headers=HEADERS, timeout=8)
        
        if respuesta.status_code == 200:
            datos_nube = respuesta.json()
            videojuegos = []
            
            # Recorremos y mapeamos los 5 juegos que insertaste con el SQL Editor
            for item in datos_nube:
                videojuegos.append({
                "id": item.get("id_videojuego"),
                "titulo": item.get("titulo"),
                "descripcion": item.get("descripcion") or "Sin descripción disponible.",
                "precio": float(item.get("precio") or 0),
                "categoria": item.get("categoria") or "Videojuegos",
                "plataforma": item.get("plataforma") or "PC",  # 🚀 ¡ESTA ES LA LÍNEA NUEVA QUE DEBES AGREGAR!
                "imagen_url": item.get("imagen_url") or "https://unsplash.com",
                "stock": item.get("stock_keys") or 0
            })
            
            print(f"📊 ¡CONEXIÓN EXITOSA! Se cargaron {len(videojuegos)} juegos reales directamente desde Supabase Cloud.")
            return videojuegos
        else:
            print(f"❌ Supabase rechazó la petición. Código: {respuesta.status_code} - {respuesta.text}")
            raise HTTPException(status_code=respuesta.status_code, detail="La nube rechazó la consulta.")
            
    except Exception as e:
        print(f"❌ Error de comunicación con la nube: {e}")
        raise HTTPException(status_code=500, detail=f"Error al conectar con la base de datos externa: {str(e)}")

# ==================== RUTA POST: INSERCIÓN AUTOMÁTICA EN LA NUBE ====================
@app.post("/videojuegos")
def crear_videojuego(juego: dict):
    try:
        datos_para_nube = {
            "titulo": juego.get("titulo"),
            "descripcion": juego.get("descripcion"),
            "precio": float(juego.get("precio") or 0),
            "categoria": juego.get("categoria") or "Videojuegos",
            "plataforma": juego.get("plataforma") or "PC",
            "imagen_url": juego.get("imagen_url"),
            "stock_keys": int(juego.get("stock_keys") or 0)
        }
        
        respuesta = requests.post(f"{SUPABASE_URL}/rest/v1/videojuegos", json=datos_para_nube, headers=HEADERS, timeout=8)
        
        if respuesta.status_code in [200, 201]:
            return {"status": "success", "mensaje": f"¡{juego.get('titulo')} se guardó automáticamente en la nube de Supabase!"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo insertar en la base de datos externa.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo de comunicación con Supabase: {e}")

    # ==================== 🗑️ RUTA DELETE: ELIMINACIÓN REAL EN LA NUBE ====================
@app.delete("/videojuegos/{id_juego}")
def eliminar_videojuego(id_juego: int):
    try:
        # Enviamos la petición DELETE a la API REST de Supabase filtrando por el ID exacto
        respuesta = requests.delete(
            f"{SUPABASE_URL}/rest/v1/videojuegos?id_videojuego=eq.{id_juego}", 
            headers=HEADERS, 
            timeout=8
        )
        
        # Supabase devuelve el código 204 o 200 cuando borra una fila con éxito
        if respuesta.status_code in [200, 204]:
            return {"status": "success", "mensaje": "¡Videojuego eliminado físicamente de la nube de Supabase!"}
        else:
            raise HTTPException(status_code=400, detail="No se pudo eliminar el registro en la base de datos externa.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de comunicación al eliminar: {e}")


# ==================== RUTA POST: REGISTRO REAL EN LA NUBE ====================
@app.post("/registro")
def registrar_usuario(datos: dict):
    try:
        # Preparamos el paquete de datos exacto para la tabla de Supabase
        datos_para_nube = {
            "username": datos.get("usuario"),
            "correo": datos.get("correo"),
            "contrasena": datos.get("contrasena"),
            "rol": "cliente"  # Por defecto todas las cuentas web se crean como clientes
        }
        
        # Hacemos la inserción física por HTTP POST en la API de Supabase
        respuesta = requests.post(f"{SUPABASE_URL}/rest/v1/usuarios", json=datos_para_nube, headers=HEADERS, timeout=8)
        
        if respuesta.status_code in [200, 201]:
            return {"status": "success", "mensaje": "¡Tu cuenta gamer ha sido creada de forma dinámica en la nube!"}
        elif respuesta.status_code == 409 or "duplicate" in respuesta.text.lower():
            contenido_error = respuesta.text.lower()
            print(f"📊 DETALLE DE DUPLICADO EN NUBE: {contenido_error}") # Esto te ayuda a auditar en la terminal
            
            # Buscamos de forma flexible cualquier variante que use Supabase para el correo duplicado
            if "correo" in contenido_error or "unique_correo" in contenido_error or "correo_unique" in contenido_error:
                raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado por otro jugador.")
            else:
                raise HTTPException(status_code=400, detail="El nombre de usuario (Gamertag) ya está en uso.")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error en el proceso de registro: {e}")
        raise HTTPException(status_code=500, detail="Error de comunicación con el servidor de registros.")

# ==================== 🔐 MÓDULO: LOGIN REAL DESDE LA NUBE ====================
@app.post("/login")
def login(datos: dict):
    try:
        usuario = datos.get("usuario")
        contrasena = datos.get("contrasena")
        
        # Consultamos a Supabase si existe un registro que coincida con ese username y contrasena
        respuesta = requests.get(
            f"{SUPABASE_URL}/rest/v1/usuarios?username=eq.{usuario}&contrasena=eq.{contrasena}", 
            headers=HEADERS, 
            timeout=8
        )
        
        if respuesta.status_code == 200:
            usuarios_encontrados = respuesta.json()
            
            # Si la lista contiene al menos un elemento, las credenciales son correctas y extraemos su rol
            if len(usuarios_encontrados) > 0:
                usuario_real = usuarios_encontrados[0]
                return {
                    "status": "success", 
                    "rol": usuario_real.get("rol", "cliente"), 
                    "mensaje": f"¡Bienvenido de vuelta, {usuario}!"
                }
            else:
                raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
        else:
            raise HTTPException(status_code=400, detail="Error de validación en la nube externa.")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en el sistema de autenticación: {e}")

# ==================== 🚀 MÓDULO ACTUALIZADO: PROCESAR COMPRA Y DETALLE RELACIONADO ====================
@app.post("/pedidos")
def procesar_pedido_gamer_completo(datos_compra: dict):
    try:
        usuario = datos_compra.get("usuario") or "Gamer_Invitado"
        carrito = datos_compra.get("carrito", [])
        
        if not carrito:
            raise HTTPException(status_code=400, detail="El carrito de compras está vacío.")
            
        total_pagar = 0
        productos_verificados = []
        
        # ---------------------------------------------------------------------
        # 1. VALIDACIÓN PREVENTIVA DE INVENTARIO Y PRECIOS
        # ---------------------------------------------------------------------
        for item in carrito:
            id_juego = item.get("id")
            cantidad_comprada = int(item.get("cantidad", 1))
            
            res_juego = requests.get(
                f"{SUPABASE_URL}/rest/v1/videojuegos?id_videojuego=eq.{id_juego}", 
                headers=HEADERS, 
                timeout=8
            )
            
            if res_juego.status_code == 200 and res_juego.json():
                juego_nube = res_juego.json()[0]  # Tomamos el primer registro encontrado
                stock_actual = int(juego_nube.get("stock_keys") or 0)
                precio_real = float(juego_nube.get("precio") or 0)
                
                if stock_actual < cantidad_comprada:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Stock insuficiente para '{juego_nube.get('titulo')}'. Quedan {stock_actual} unidades."
                    )
                
                total_pagar += precio_real * cantidad_comprada
                productos_verificados.append({
                    "id": id_juego,
                    "cantidad": cantidad_comprada,
                    "precio": precio_real,
                    "nuevo_stock": stock_actual - cantidad_comprada
                })
            else:
                raise HTTPException(status_code=404, detail=f"El videojuego con ID {id_juego} no existe en inventario.")

        # ---------------------------------------------------------------------
        # 2. INSERTAR EN LA TABLA DE PEDIDOS (CABECERA)
        # ---------------------------------------------------------------------
        datos_pedido = {
            "usuario_comprador": usuario,
            "total_pagado": total_pagar
        }
        
        # Le pedimos a Supabase que nos devuelva la fila insertada para extraer el id_pedido generado automáticamente
        headers_con_retorno = {**HEADERS, "Prefer": "return=representation"}
        
        res_pedido = requests.post(
            f"{SUPABASE_URL}/rest/v1/pedidos", 
            json=datos_pedido, 
            headers=headers_con_retorno, 
            timeout=8
        )
        
        if res_pedido.status_code not in [200, 201]:
            raise HTTPException(status_code=400, detail="Error de base de datos al registrar la cabecera del pedido.")
            
        id_pedido_nuevo = res_pedido.json()[0].get("id_pedido")

        # ---------------------------------------------------------------------
        # 3. INSERTAR EL DESGLOSE EN DETALLE_PEDIDOS Y ACTUALIZAR STOCK
        # ---------------------------------------------------------------------
        for prod in productos_verificados:
            
            # 🚀 ¡AQUÍ NACE LA LLAVE ALEATORIA!: Tomamos las 3 primeras letras del juego y un número al azar
            prefijo = prod.get("titulo", "GAM")[:3].upper().replace(" ", "X")
            key_generada = f"PV-{prefijo}-{random.randint(1000, 9999)}-UCC26"

            # A. Insertar el renglón correspondiente en detalle_pedidos
            datos_detalle = {
                "id_pedido": id_pedido_nuevo,
                "id_videojuego": prod["id"],
                "cantidad": prod["cantidad"],
                "precio_unitario": prod["precio"],  
                "clave_digital": key_generada,  # 🔑
                "imagen_aux": prod.get("imagen_url")
            }
            
            res_det = requests.post(f"{SUPABASE_URL}/rest/v1/detalle_pedidos", json=datos_detalle, headers=HEADERS, timeout=8)
            if res_det.status_code not in [200, 201]:
                raise HTTPException(status_code=400, detail="Error crítico al almacenar el desglose de artículos comprados.")
            
            # B. Actualizar (PATCH) el nuevo inventario reducido en la tabla de videojuegos
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/videojuegos?id_videojuego=eq.{prod['id']}",
                json={"stock_keys": prod["nuevo_stock"]},
                headers=HEADERS,
                timeout=8
            )

        print(f"✅ ¡VENTA CONSOLIDADA CON ÉXITO! ID Pedido: {id_pedido_nuevo} - Usuario: {usuario}")
        return {
            "status": "success",
            "mensaje": f"¡Licencias procesadas! Compra #{id_pedido_nuevo} guardada con éxito y stock actualizado en la nube."
        }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Fallo crítico en el módulo transaccional: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al procesar la orden: {str(e)}")



# ==================== 🔑 MÓDULO ACTUALIZADO: BIBLIOTECA Y REPORTE DE AUDITORÍA (UNIFICADO) ====================
@app.get("/biblioteca/{gamertag}/{rol}")
def obtener_biblioteca_gamer_relacional(gamertag: str, rol: str):
    try:
        # 1. Si es administrador, descargamos el historial técnico global de Supabase
        if rol == "administrador":
            url_detalles = f"{SUPABASE_URL}/rest/v1/detalle_pedidos?select=*"
        else:
            # Si es cliente, buscamos sus cabeceras de pedidos primero
            res_pedidos = requests.get(f"{SUPABASE_URL}/rest/v1/pedidos?usuario_comprador=eq.{gamertag}", headers=HEADERS, timeout=8)
            if res_pedidos.status_code != 200 or not res_pedidos.json():
                return []
                
            lista_ids_pedidos = [str(p.get("id_pedido")) for p in res_pedidos.json()]
            if not lista_ids_pedidos:
                return []
                
            cadena_ids = ",".join(lista_ids_pedidos)
            url_detalles = f"{SUPABASE_URL}/rest/v1/detalle_pedidos?id_pedido=in.({cadena_ids})"

        # 2. Descargamos las líneas físicas de detalles desde Supabase
        res_detalles = requests.get(url_detalles, headers=HEADERS, timeout=8)
        if res_detalles.status_code != 200:
            return []
            
        lineas_detalles = res_detalles.json()
        coleccion_gamer_limpia = []

        # 3. Cruzamos los datos relacionales para inyectar títulos, portadas y compradores
        for det in lineas_detalles:
            id_juego = det.get("id_videojuego")
            id_pedido_origen = det.get("id_pedido")
            
            # 🚀 TRUCO DE AUDITORÍA: Buscamos en internet quién fue el dueño de este pedido específico
            comprador_final = "Desconocido"
            res_pedido_dueno = requests.get(f"{SUPABASE_URL}/rest/v1/pedidos?id_pedido=eq.{id_pedido_origen}", headers=HEADERS, timeout=8)
            if res_pedido_dueno.status_code == 200 and res_pedido_dueno.json():
                # Sacamos el nombre original guardado en tu columna 'usuario_comprador'
                comprador_final = res_pedido_dueno.json()[0].get("usuario_comprador") or "Gamer"

            # Consultamos los metadatos del juego a Supabase
            res_juego = requests.get(f"{SUPABASE_URL}/rest/v1/videojuegos?id_videojuego=eq.{id_juego}", headers=HEADERS, timeout=8)
            if res_juego.status_code != 200 or not res_juego.json():
                res_juego = requests.get(f"{SUPABASE_URL}/rest/v1/videojuegos?id=eq.{id_juego}", headers=HEADERS, timeout=8)

            titulo_final = "🎮 Título Descatalogado"
            imagen_final = det.get("imagen_aux") or "https://unsplash.com"

            if res_juego.status_code == 200 and res_juego.json():
                juego_nube = res_juego.json() if isinstance(res_juego.json(), list) else res_juego.json()
                # Si llega un arreglo por el extractor de Supabase, tomamos la posición cero de forma segura
                if isinstance(juego_nube, list) and len(juego_nube) > 0:
                    juego_nube = juego_nube[0]
                titulo_final = juego_nube.get("titulo", titulo_final)
                if not det.get("imagen_aux"):
                    imagen_final = juego_nube.get("imagen_url", imagen_final)

            clave_fisica = det.get("clave_digital") or det.get("clave_real") or "PV-CORREGIDA-UCC26"

            coleccion_gamer_limpia.append({
                "id_videojuego": id_juego,
                "titulo": titulo_final,
                "imagen_url": imagen_final,
                "clave_real": clave_fisica,
                "usuario_comprador": comprador_final  # 🚀 ¡LÍNEA CLAVE! Le despachamos el nombre real al JavaScript
            })

        return coleccion_gamer_limpia

    except Exception as e:
        print(f"❌ Error en endpoint biblioteca backend: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fallo en servidor de licencias: {str(e)}")