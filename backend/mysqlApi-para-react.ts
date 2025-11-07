// Servicio para conectar React con el backend MySQL
// Coloca este archivo en: src/services/mysqlApi.ts (en tu proyecto React)

const API_URL = 'http://localhost:3001/api';

export interface MySQLResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  affectedRows?: number;
  insertId?: number;
  error?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  constraints?: string[];
}

export const mysqlApi = {
  /**
   * Verificar estado del servidor
   */
  health: async (): Promise<MySQLResponse> => {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  /**
   * Probar conexión con MySQL
   */
  testConnection: async (): Promise<MySQLResponse> => {
    const response = await fetch(`${API_URL}/test-connection`);
    return response.json();
  },

  /**
   * BASES DE DATOS
   */
  database: {
    /**
     * Crear una nueva base de datos
     */
    create: async (name: string): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/database/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return response.json();
    },

    /**
     * Conectar a una base de datos existente
     */
    connect: async (name: string): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return response.json();
    },

    /**
     * Listar todas las bases de datos
     */
    list: async (): Promise<MySQLResponse<string[]>> => {
      const response = await fetch(`${API_URL}/database/list`);
      return response.json();
    }
  },

  /**
   * TABLAS
   */
  table: {
    /**
     * Crear una nueva tabla
     */
    create: async (tableName: string, columns: TableColumn[]): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/table/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns })
      });
      return response.json();
    },

    /**
     * Listar todas las tablas de la base de datos actual
     */
    list: async (): Promise<MySQLResponse<string[]>> => {
      const response = await fetch(`${API_URL}/table/list`);
      return response.json();
    },

    /**
     * Obtener la estructura de una tabla
     */
    structure: async (tableName: string): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/table/structure/${tableName}`);
      return response.json();
    }
  },

  /**
   * DATOS
   */
  data: {
    /**
     * Insertar datos en una tabla
     */
    insert: async (table: string, data: Record<string, any>): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/data/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data })
      });
      return response.json();
    },

    /**
     * Obtener datos de una tabla
     */
    select: async (
      table: string, 
      options?: {
        columns?: string;
        where?: string;
        limit?: number;
      }
    ): Promise<MySQLResponse<any[]>> => {
      const params = new URLSearchParams();
      if (options?.columns) params.append('columns', options.columns);
      if (options?.where) params.append('where', options.where);
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `${API_URL}/data/select/${table}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      return response.json();
    },

    /**
     * Actualizar datos en una tabla
     */
    update: async (
      table: string, 
      data: Record<string, any>, 
      where?: string
    ): Promise<MySQLResponse> => {
      const response = await fetch(`${API_URL}/data/update/${table}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, where })
      });
      return response.json();
    },

    /**
     * Eliminar datos de una tabla
     */
    delete: async (table: string, where: string): Promise<MySQLResponse> => {
      const response = await fetch(
        `${API_URL}/data/delete/${table}?where=${encodeURIComponent(where)}`,
        { method: 'DELETE' }
      );
      return response.json();
    }
  },

  /**
   * CONSULTAS PERSONALIZADAS
   */
  /**
   * Ejecutar una consulta SQL personalizada
   */
  executeSQL: async (sql: string): Promise<MySQLResponse> => {
    const response = await fetch(`${API_URL}/query/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    return response.json();
  }
};

// Ejemplo de uso en un componente React:
/*
import { mysqlApi } from '@/services/mysqlApi';

// En tu componente
const handleCreateDatabase = async () => {
  try {
    const result = await mysqlApi.database.create('mi_base_datos');
    if (result.success) {
      console.log('Base de datos creada:', result.message);
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error al crear base de datos:', error);
  }
};

const handleCreateTable = async () => {
  const result = await mysqlApi.table.create('usuarios', [
    { name: 'id', type: 'INT', constraints: ['AUTO_INCREMENT', 'PRIMARY KEY'] },
    { name: 'nombre', type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
    { name: 'email', type: 'VARCHAR(100)', constraints: ['UNIQUE'] },
    { name: 'edad', type: 'INT' }
  ]);
  console.log(result);
};

const handleInsertData = async () => {
  const result = await mysqlApi.data.insert('usuarios', {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    edad: 25
  });
  console.log(result);
};

const handleGetData = async () => {
  const result = await mysqlApi.data.select('usuarios', {
    columns: '*',
    where: 'edad > 18',
    limit: 10
  });
  console.log(result.data);
};
*/
