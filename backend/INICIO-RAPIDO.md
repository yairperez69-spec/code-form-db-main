# 🚀 Guía Rápida de Inicio

## Pasos para Poner en Marcha el Backend MySQL

### 1️⃣ Instalar Dependencias
```bash
cd backend
npm install
```

### 2️⃣ Configurar MySQL
Edita el archivo `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=
PORT=3001
```

### 3️⃣ Iniciar el Servidor
```bash
npm start
```

### 4️⃣ Probar la Conexión
Abre tu navegador en: http://localhost:3001/api/health

O usa curl:
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/test-connection
```

---

## 🎯 Ejemplo Completo de Uso

### Paso 1: Crear base de datos
```bash
curl -X POST http://localhost:3001/api/database/create \
  -H "Content-Type: application/json" \
  -d '{"name":"mi_proyecto"}'
```

### Paso 2: Conectar a la base de datos
```bash
curl -X POST http://localhost:3001/api/database/connect \
  -H "Content-Type: application/json" \
  -d '{"name":"mi_proyecto"}'
```

### Paso 3: Crear tabla
```bash
curl -X POST http://localhost:3001/api/table/create \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "productos",
    "columns": [
      {"name": "id", "type": "INT", "constraints": ["AUTO_INCREMENT", "PRIMARY KEY"]},
      {"name": "nombre", "type": "VARCHAR(200)", "constraints": ["NOT NULL"]},
      {"name": "precio", "type": "DECIMAL(10,2)"},
      {"name": "stock", "type": "INT", "constraints": ["DEFAULT 0"]}
    ]
  }'
```

### Paso 4: Insertar datos
```bash
curl -X POST http://localhost:3001/api/data/insert \
  -H "Content-Type: application/json" \
  -d '{
    "table": "productos",
    "data": {"nombre": "Laptop", "precio": 999.99, "stock": 10}
  }'
```

### Paso 5: Consultar datos
```bash
curl http://localhost:3001/api/data/select/productos
```

---

## 🔗 Integración con React (Opcional)

Cuando quieras conectar tu frontend React con este backend:

1. Copia el archivo `mysqlApi-para-react.ts` a tu proyecto React:
   ```
   src/services/mysqlApi.ts
   ```

2. Usa el servicio en tus componentes:
   ```typescript
   import { mysqlApi } from '@/services/mysqlApi';

   // Crear base de datos
   const result = await mysqlApi.database.create('mi_bd');
   
   // Crear tabla
   await mysqlApi.table.create('usuarios', [
     { name: 'id', type: 'INT', constraints: ['AUTO_INCREMENT', 'PRIMARY KEY'] },
     { name: 'nombre', type: 'VARCHAR(100)' }
   ]);

   // Insertar datos
   await mysqlApi.data.insert('usuarios', {
     nombre: 'Juan Pérez'
   });

   // Obtener datos
   const { data } = await mysqlApi.data.select('usuarios');
   ```

---

## 📊 Herramientas Recomendadas

Para probar y visualizar tus APIs:
- **Postman**: https://www.postman.com/
- **Thunder Client** (extensión de VS Code)
- **MySQL Workbench** para ver la base de datos

---

## ❓ Problemas Comunes

**MySQL no está corriendo:**
```bash
# Windows
net start mysql

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

**Error de conexión:**
- Verifica que el puerto 3306 de MySQL esté disponible
- Confirma usuario y contraseña en `.env`

**Puerto 3001 ocupado:**
- Cambia el puerto en `.env` a otro (ej: 3002)

---

## 📝 Siguiente Paso

Lee el archivo **README.md** completo para más detalles sobre todos los endpoints disponibles.
