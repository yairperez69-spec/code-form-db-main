export interface Database {
  name: string;
  tables: Table[];
  connected: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
  data: Record<string, any>[];
}

export interface Column {
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

class FirebirdSimulator {
  private databases: Map<string, Database> = new Map();
  private currentDatabase: string | null = null;

  createDatabase(name: string, pageSize?: number): QueryResult {
    if (this.databases.has(name)) {
      return {
        success: false,
        message: `La base de datos '${name}' ya existe`
      };
    }

    this.databases.set(name, {
      name,
      tables: [],
      connected: false
    });

    return {
      success: true,
      message: `Base de datos '${name}' creada exitosamente${pageSize ? ` con PAGE_SIZE=${pageSize}` : ''}`
    };
  }

  connectDatabase(name: string, user?: string, password?: string): QueryResult {
    const db = this.databases.get(name);
    if (!db) {
      return {
        success: false,
        message: `La base de datos '${name}' no existe`
      };
    }

    db.connected = true;
    this.currentDatabase = name;

    return {
      success: true,
      message: `Conectado a la base de datos '${name}'${user ? ` como usuario '${user}'` : ''}`
    };
  }

  createTable(tableName: string, columns: Column[]): QueryResult {
    if (!this.currentDatabase) {
      return {
        success: false,
        message: 'No hay una base de datos conectada. Use CONNECT TO primero'
      };
    }

    const db = this.databases.get(this.currentDatabase);
    if (!db) {
      return {
        success: false,
        message: 'Base de datos no encontrada'
      };
    }

    const existingTable = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (existingTable) {
      return {
        success: false,
        message: `La tabla '${tableName}' ya existe`
      };
    }

    db.tables.push({
      name: tableName,
      columns,
      data: []
    });

    return {
      success: true,
      message: `Tabla '${tableName}' creada con ${columns.length} columna(s)`
    };
  }

  insertInto(tableName: string, values: any[]): QueryResult {
    if (!this.currentDatabase) {
      return {
        success: false,
        message: 'No hay una base de datos conectada'
      };
    }

    const db = this.databases.get(this.currentDatabase);
    if (!db) {
      return {
        success: false,
        message: 'Base de datos no encontrada'
      };
    }

    const table = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      return {
        success: false,
        message: `La tabla '${tableName}' no existe`
      };
    }

    const row: Record<string, any> = {};
    table.columns.forEach((col, idx) => {
      row[col.name] = values[idx] !== undefined ? values[idx] : null;
    });

    table.data.push(row);

    return {
      success: true,
      message: `1 registro insertado en '${tableName}'`,
      affectedRows: 1
    };
  }

  select(tableName: string, columns: string[] = ['*']): QueryResult {
    if (!this.currentDatabase) {
      return {
        success: false,
        message: 'No hay una base de datos conectada'
      };
    }

    const db = this.databases.get(this.currentDatabase);
    if (!db) {
      return {
        success: false,
        message: 'Base de datos no encontrada'
      };
    }

    const table = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      return {
        success: false,
        message: `La tabla '${tableName}' no existe`
      };
    }

    let data = table.data;
    if (columns[0] !== '*') {
      data = table.data.map(row => {
        const filteredRow: Record<string, any> = {};
        columns.forEach(col => {
          if (row[col] !== undefined) {
            filteredRow[col] = row[col];
          }
        });
        return filteredRow;
      });
    }

    return {
      success: true,
      message: `${data.length} registro(s) encontrado(s)`,
      data
    };
  }

  update(tableName: string, updates: Record<string, any>, where?: string): QueryResult {
    if (!this.currentDatabase) {
      return {
        success: false,
        message: 'No hay una base de datos conectada'
      };
    }

    const db = this.databases.get(this.currentDatabase);
    if (!db) {
      return {
        success: false,
        message: 'Base de datos no encontrada'
      };
    }

    const table = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      return {
        success: false,
        message: `La tabla '${tableName}' no existe`
      };
    }

    let affectedRows = 0;
    table.data.forEach(row => {
      Object.keys(updates).forEach(key => {
        if (row[key] !== undefined) {
          row[key] = updates[key];
          affectedRows++;
        }
      });
    });

    return {
      success: true,
      message: `${affectedRows} registro(s) actualizado(s)`,
      affectedRows
    };
  }

  delete(tableName: string, where?: string): QueryResult {
    if (!this.currentDatabase) {
      return {
        success: false,
        message: 'No hay una base de datos conectada'
      };
    }

    const db = this.databases.get(this.currentDatabase);
    if (!db) {
      return {
        success: false,
        message: 'Base de datos no encontrada'
      };
    }

    const table = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      return {
        success: false,
        message: `La tabla '${tableName}' no existe`
      };
    }

    const beforeCount = table.data.length;
    table.data = [];
    const affectedRows = beforeCount;

    return {
      success: true,
      message: `${affectedRows} registro(s) eliminado(s)`,
      affectedRows
    };
  }

  getCurrentDatabase(): Database | null {
    if (!this.currentDatabase) return null;
    return this.databases.get(this.currentDatabase) || null;
  }

  listDatabases(): string[] {
    return Array.from(this.databases.keys());
  }

  listTables(): string[] {
    if (!this.currentDatabase) return [];
    const db = this.databases.get(this.currentDatabase);
    return db ? db.tables.map(t => t.name) : [];
  }
}

export const firebirdDB = new FirebirdSimulator();
