# Backend MySQL para Proyecto React

Backend con Node.js + Express + MySQL para tu proyecto de gestión de bases de datos.

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior) instalado y corriendo
- npm o yarn

## 🚀 Instalación

### 1. Instalar MySQL (si no lo tienes)

**Windows:**
- Descarga desde: https://dev.mysql.com/downloads/installer/
- Instala y configura el usuario root con contraseña

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2. Configurar el Backend

```bash
# Navegar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Edita el archivo .env con tus credenciales de MySQL
```

### 3. Configurar archivo .env

Edita el archivo `.env` con tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=
PORT=3001
```

**Nota:** Deja `DB_NAME` vacío inicialmente. Podrás crear y conectar bases de datos desde la API.

## ▶️ Ejecutar el Backend

```bash
# Modo producción
npm start

# Modo desarrollo (con nodemon, auto-recarga)
npm run dev
```

El servidor se iniciará en: **http://localhost:3001**

## 📡 API Endpoints

### Estado y Conexión

#### Verificar estado del servidor
```http
GET /api/health
```

#### Probar conexión con MySQL
```http
GET /api/test-connection
```

### Bases de Datos

#### Crear base de datos
```http
POST /api/database/create
Content-Type: application/json

{
  "name": "mi_base_datos"
}
```

#### Conectar a una base de datos
```http
POST /api/database/connect
Content-Type: application/json

{
  "name": "mi_base_datos"
}
```

#### Listar bases de datos
```http
GET /api/database/list
```

### Tablas

#### Crear tabla
```http
POST /api/table/create
Content-Type: application/json

{
  "tableName": "usuarios",
  "columns": [
    {
      "name": "id",
      "type": "INT",
      "constraints": ["AUTO_INCREMENT", "PRIMARY KEY"]
    },
    {
      "name": "nombre",
      "type": "VARCHAR(100)",
      "constraints": ["NOT NULL"]
    },
    {
      "name": "email",
      "type": "VARCHAR(100)",
      "constraints": ["UNIQUE"]
    },
    {
      "name": "edad",
      "type": "INT"
    }
  ]
}
```

#### Listar tablas
```http
GET /api/table/list
```

#### Obtener estructura de tabla
```http
GET /api/table/structure/usuarios
```

### Datos

#### Insertar datos
```http
POST /api/data/insert
Content-Type: application/json

{
  "table": "usuarios",
  "data": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "edad": 25
  }
}
```

#### Obtener datos (SELECT)
```http
GET /api/data/select/usuarios?columns=*&limit=10

# Con filtro WHERE
GET /api/data/select/usuarios?where=edad>18&limit=10
```

#### Actualizar datos
```http
PUT /api/data/update/usuarios
Content-Type: application/json

{
  "data": {
    "edad": 26
  },
  "where": "id=1"
}
```

#### Eliminar datos
```http
DELETE /api/data/delete/usuarios?where=id=1
```

**Nota de seguridad:** Por protección, no se permite DELETE sin condición WHERE.

#### Ejecutar consulta SQL personalizada
```http
POST /api/query/execute
Content-Type: application/json

{
  "sql": "SELECT * FROM usuarios WHERE edad > 18"
}
```

## 🔧 Uso con tu Frontend React

Puedes crear un archivo de servicios en tu proyecto React para consumir la API:

```javascript
// src/services/mysqlApi.js
const API_URL = 'http://localhost:3001/api';

export const mysqlApi = {
  // Probar conexión
  testConnection: async () => {
    const response = await fetch(`${API_URL}/test-connection`);
    return response.json();
  },

  // Crear base de datos
  createDatabase: async (name) => {
    const response = await fetch(`${API_URL}/database/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  // Conectar a base de datos
  connectDatabase: async (name) => {
    const response = await fetch(`${API_URL}/database/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  // Crear tabla
  createTable: async (tableName, columns) => {
    const response = await fetch(`${API_URL}/table/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, columns })
    });
    return response.json();
  },

  // Insertar datos
  insertData: async (table, data) => {
    const response = await fetch(`${API_URL}/data/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, data })
    });
    return response.json();
  },

  // Obtener datos
  getData: async (table, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await fetch(`${API_URL}/data/select/${table}?${params}`);
    return response.json();
  },

  // Ejecutar SQL personalizado
  executeSQL: async (sql) => {
    const response = await fetch(`${API_URL}/query/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    return response.json();
  }
};
```

## 🧪 Ejemplos de Prueba con cURL

```bash
# Probar conexión
curl http://localhost:3001/api/health

# Crear base de datos
curl -X POST http://localhost:3001/api/database/create \
  -H "Content-Type: application/json" \
  -d '{"name":"test_db"}'

# Conectar a base de datos
curl -X POST http://localhost:3001/api/database/connect \
  -H "Content-Type: application/json" \
  -d '{"name":"test_db"}'

# Crear tabla
curl -X POST http://localhost:3001/api/table/create \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "usuarios",
    "columns": [
      {"name": "id", "type": "INT", "constraints": ["AUTO_INCREMENT", "PRIMARY KEY"]},
      {"name": "nombre", "type": "VARCHAR(100)", "constraints": ["NOT NULL"]},
      {"name": "email", "type": "VARCHAR(100)"}
    ]
  }'

# Insertar datos
curl -X POST http://localhost:3001/api/data/insert \
  -H "Content-Type: application/json" \
  -d '{
    "table": "usuarios",
    "data": {"nombre": "Juan", "email": "juan@example.com"}
  }'

# Obtener datos
curl http://localhost:3001/api/data/select/usuarios
```

## 🛠️ Solución de Problemas

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo: `mysql --version`
- Confirma las credenciales en el archivo `.env`
- Prueba conectarte manualmente: `mysql -u root -p`

### Error: "Port 3001 already in use"
- Cambia el puerto en el archivo `.env`
- O detén el proceso que usa ese puerto

### Error: "Access denied for user"
- Verifica el usuario y contraseña de MySQL
- Asegúrate que el usuario tenga permisos necesarios

## 📝 Estructura del Proyecto

```
backend/
├── server.js          # Servidor Express principal
├── package.json       # Dependencias del proyecto
├── .env              # Variables de entorno (no incluir en git)
├── .gitignore        # Archivos a ignorar en git
└── README.md         # Esta documentación
```

## 🔐 Seguridad

- Las variables de entorno están en `.env` (no se sube a git)
- Se usa prepared statements para prevenir SQL injection
- DELETE requiere condición WHERE por defecto
- CORS configurado para desarrollo (ajustar en producción)

## 📚 Recursos Adicionales

- [Documentación de MySQL](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/es/)
- [Node.js MySQL2](https://github.com/sidorares/node-mysql2)

## 💡 Próximos Pasos

1. Ejecuta el backend con `npm start`
2. Prueba los endpoints con Postman o cURL
3. Integra las llamadas en tu frontend React
4. ¡Disfruta de tu aplicación con MySQL real!
