-- 📊 SCRIPTS DE CREACIÓN DE TABLAS - GAMERGEEKUCC
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente'
);

CREATE TABLE videojuegos (
    id_videojuego SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    categoria VARCHAR(50),
    plataforma VARCHAR(50),
    imagen_url TEXT,
    stock_keys INT DEFAULT 0
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    usuario_comprador VARCHAR(50),
    total_pagado NUMERIC(10,2),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido),
    id_videojuego INT REFERENCES videojuegos(id_videojuego),
    cantidad INT DEFAULT 1,
    precio_unitario NUMERIC(10,2),
    clave_digital VARCHAR(100) UNIQUE,
    imagen_aux TEXT
);
