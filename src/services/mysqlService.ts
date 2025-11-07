// Servicio para conectar React con el backend MySQL
const API_URL = 'http://localhost:3002/api';

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

export interface QueryResult {
  success: boolean;
  message: string;
  data?: any[];
  affectedRows?: number;
}

class MySQLService {
  /**
   * Verificar si el backend está disponible
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // timeout de 2 segundos
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Crear base de datos
   */
  async createDatabase(name: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/database/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Conectar a base de datos
   */
  async connectDatabase(name: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/database/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Listar bases de datos
   */
  async listDatabases(): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/database/list`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Crear tabla
   */
  async createTable(tableName: string, columns: TableColumn[]): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/table/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Listar tablas
   */
  async listTables(): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/table/list`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Obtener estructura de tabla
   */
  async getTableStructure(tableName: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/table/structure/${tableName}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Insertar datos
   */
  async insertData(table: string, data: Record<string, any>): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/data/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Obtener datos de una tabla
   */
  async selectData(table: string, options?: { columns?: string; where?: string; limit?: number }): Promise<QueryResult> {
    try {
      const params = new URLSearchParams();
      if (options?.columns) params.append('columns', options.columns);
      if (options?.where) params.append('where', options.where);
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `${API_URL}/data/select/${table}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        data: []
      };
    }
  }

  /**
   * Actualizar datos
   */
  async updateData(table: string, data: Record<string, any>, where?: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/data/update/${table}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, where })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Eliminar datos
   */
  async deleteData(table: string, where: string): Promise<QueryResult> {
    try {
      const response = await fetch(
        `${API_URL}/data/delete/${table}?where=${encodeURIComponent(where)}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Ejecutar consulta SQL personalizada
   */
  async executeSQL(sql: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_URL}/query/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Error al conectar con el backend: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}

export const mysqlService = new MySQLService();
