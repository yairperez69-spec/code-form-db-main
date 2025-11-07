
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Pool de conexiones MySQL
let pool;
let currentDB = process.env.DB_NAME || '';

// Función para crear o re-crear el pool de conexiones
const createPool = (database = currentDB) => {
  console.log(`[MySQL] Conectando a DB: ${database || '(sin base de datos inicial)'}`);
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: database, // Usamos la base de datos actual (puede ser vacía)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  currentDB = database;
};

// Inicializa el pool
createPool();

// Función de middleware para verificar conexión antes de cada ruta de datos
const checkConnection = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    next(); // Continuar si la conexión es válida
  } catch (error) {
    // Si hay un error, el pool se reinicia sin base de datos específica
    // para permitir operaciones a nivel de servidor (como crear una DB).
    if (currentDB) {
      console.warn(`[MySQL Error] Conexión fallida. Reiniciando pool sin DB.`);
      createPool('');
    }
    
    // Permite que las rutas de health y test-connection manejen su propio error
    if (req.path.includes('/health') || req.path.includes('/test-connection')) {
      next();
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: '¡No hay una base de datos conectada o la conexión falló!',
      error: error.message 
    });
  }
};

// ==================== RUTAS PÚBLICAS ====================

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Backend MySQL funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Probar conexión a MySQL
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    res.json({ 
      success: true, 
      message: 'Conexión a MySQL exitosa',
      currentDatabase: currentDB || 'Ninguna seleccionada'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al conectar con MySQL. Revisa tu contraseña y servidor.',
      error: error.message 
    });
  }
});

// ==================== RUTAS DE BASES DE DATOS ====================

// Crear base de datos
app.post('/api/database/create', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'El nombre de la base de datos es requerido' 
    });
  }

  try {
    // Esta operación se hace sin especificar una base de datos inicial.
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
    res.json({ 
      success: true, 
      message: `Base de datos '${name}' creada exitosamente` 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear la base de datos',
      error: error.message 
    });
  }
});

// Conectar a una base de datos específica
app.post('/api/database/connect', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'El nombre de la base de datos es requerido' 
    });
  }

  try {
    // Crear un nuevo pool conectado a la DB especificada
    createPool(name); 

    // Probar la nueva conexión
    const connection = await pool.getConnection();
    connection.release();
    currentDB = name;

    res.json({ 
      success: true, 
      message: `Conectado a la base de datos '${name}'` 
    });
  } catch (error) {
    // Si falla, volvemos a un pool sin DB
    createPool(''); 
    res.status(500).json({ 
      success: false, 
      message: 'Error al conectar con la base de datos (quizás no existe)',
      error: error.message 
    });
  }
});

// Listar bases de datos
app.get('/api/database/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW DATABASES');
    const databases = rows.map(row => row.Database);
    res.json({ 
      success: true, 
      data: databases 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al listar bases de datos. ¿Está el servidor MySQL encendido?',
      error: error.message 
    });
  }
});

// ==================== RUTAS DE TABLAS Y DATOS (Requieren DB conectada) ====================

// Aplica el middleware para asegurar que haya una conexión de DB antes de estas rutas
app.use('/api/table', checkConnection);
app.use('/api/data', checkConnection);
app.use('/api/query', checkConnection);


// Crear tabla
app.post('/api/table/create', async (req, res) => {
  const { tableName, columns } = req.body;
  
  if (!tableName || !columns || !Array.isArray(columns)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nombre de tabla y columnas son requeridos' 
    });
  }

  try {
    const columnDefinitions = columns.map(col => {
      const constraints = col.constraints ? col.constraints.join(' ') : '';
      return `\`${col.name}\` ${col.type} ${constraints}`.trim();
    }).join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (${columnDefinitions})`;
    await pool.query(sql);
    
    res.json({ 
      success: true, 
      message: `Tabla '${tableName}' creada exitosamente en DB: ${currentDB}` 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear la tabla',
      error: error.message 
    });
  }
});

// Listar tablas
app.get('/api/table/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);
    res.json({ 
      success: true, 
      data: tables 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al listar tablas',
      error: error.message 
    });
  }
});

// Obtener estructura de tabla
app.get('/api/table/structure/:tableName', async (req, res) => {
  const { tableName } = req.params;
  
  try {
    const [rows] = await pool.query(`DESCRIBE \`${tableName}\``);
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estructura de la tabla',
      error: error.message 
    });
  }
});

// Insertar datos
app.post('/api/data/insert', async (req, res) => {
  const { table, data } = req.body;
  
  if (!table || !data) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tabla y datos son requeridos' 
    });
  }

  try {
    const columns = Object.keys(data).map(k => `\`${k}\``).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    
    res.json({ 
      success: true, 
      message: 'Datos insertados exitosamente',
      insertId: result.insertId,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al insertar datos',
      error: error.message 
    });
  }
});

// Seleccionar datos
app.get('/api/data/select/:table', async (req, res) => {
  const { table } = req.params;
  const { columns = '*', where, limit } = req.query;
  
  try {
    let sql = `SELECT ${columns} FROM \`${table}\``;
    
    if (where) {
      sql += ` WHERE ${where}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    const [rows] = await pool.query(sql);
    
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos',
      error: error.message 
    });
  }
});

// Ejecutar consulta SQL personalizada
app.post('/api/query/execute', async (req, res) => {
  const { sql } = req.body;
  
  if (!sql) {
    return res.status(400).json({ 
      success: false, 
      message: 'Consulta SQL es requerida' 
    });
  }

  try {
    const [rows] = await pool.query(sql);
    
    res.json({ 
      success: true, 
      message: 'Consulta ejecutada exitosamente',
      data: rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al ejecutar consulta',
      error: error.message 
    });
  }
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API MySQL disponible en http://localhost:${PORT}/api`);
});