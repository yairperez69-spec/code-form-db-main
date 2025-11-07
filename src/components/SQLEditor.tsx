import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Database, Play, Trash2, Flame, AlertCircle } from 'lucide-react';
import { tokenize, Token } from '@/utils/sqlLexer';
import { parse, ParseResult } from '@/utils/sqlParser';
import { firebirdDB, QueryResult } from '@/utils/firebirdSimulator';
import { mysqlService } from '@/services/mysqlService';
import { toast } from 'sonner';

interface SQLEditorProps {
  onExecute?: (sql: string, result: QueryResult) => void;
}

export const SQLEditor = ({ onExecute }: SQLEditorProps) => {
  const [sql, setSql] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [useMysql, setUseMysql] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Verificar disponibilidad del backend al montar el componente
  useEffect(() => {
    const checkBackend = async () => {
      const available = await mysqlService.isBackendAvailable();
      setBackendAvailable(available);
      setUseMysql(available);
    };
    checkBackend();
  }, []);

  const handleSqlChange = (value: string) => {
    setSql(value);
    const newTokens = tokenize(value);
    setTokens(newTokens);
    const result = parse(newTokens);
    setParseResult(result);
  };

  const executeFirebirdQuery = async (query: string): Promise<QueryResult> => {
    const originalQuery = query.trim();
    
    // Si MySQL está disponible, usar el backend real
    if (useMysql && backendAvailable) {
      return await executeMySQLQuery(originalQuery);
    }
    
    // De lo contrario, usar el simulador en memoria
    return executeInMemoryQuery(originalQuery);
  };

  const executeMySQLQuery = async (query: string): Promise<QueryResult> => {
    const trimmedQuery = query.trim().toUpperCase();
    
    // MODIFICACIÓN 1: CREATE DATABASE - Sintaxis MySQL
    if (trimmedQuery.startsWith('CREATE DATABASE')) {
      // Captura el nombre después de CREATE DATABASE, con o sin comillas
      const match = query.match(/CREATE\s+DATABASE\s+['"`]?(\w+)['"`]?/i);
      if (match && match[1]) {
        return await mysqlService.createDatabase(match[1]);
      }
    }
    
    // MODIFICACIÓN 2: CONNECT TO / USE - Añade soporte para USE de MySQL
    if (trimmedQuery.startsWith('CONNECT') || trimmedQuery.startsWith('USE')) {
      // Captura el nombre después de CONNECT TO o USE
      const match = query.match(/(?:CONNECT\s+(?:TO\s+)?|USE\s+)['"]?(\w+)['"]?/i);
      if (match && match[1]) {
        return await mysqlService.connectDatabase(match[1]);
      }
    }
    
    // CREATE TABLE
    if (trimmedQuery.startsWith('CREATE TABLE')) {
      const match = query.match(/CREATE\s+TABLE\s+(\w+)\s*\((.*)\)/is);
      if (match) {
        const tableName = match[1];
        const columnsStr = match[2];
        const columns = columnsStr.split(',').map(col => {
          const parts = col.trim().split(/\s+/);
          return {
            name: parts[0].replace(/[`'"]/g, ''), // Limpia comillas inversas/simples
            type: parts.slice(1).join(' ') || 'VARCHAR(255)',
            constraints: []
          };
        });
        return await mysqlService.createTable(tableName, columns);
      }
    }
      // INSERT INTO
    // INSERT INTO
    if (trimmedQuery.startsWith('INSERT INTO')) {
      const match = query.match(/INSERT\s+INTO\s+(\w+)\s*(?:\((.*?)\))?\s*VALUES\s*\((.*)\)/is);
      if (match) {
        const tableName = match[1];
        const columns = match[2] ? match[2].split(',').map(c => c.trim().replace(/[`'"]/g, '')) : null;
        const valuesStr = match[3];
        const values = valuesStr.split(',').map(v => {
          const trimmed = v.trim();
          if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
            return trimmed.slice(1, -1);
          }
          return trimmed;
        });
        
        // Si no hay columnas especificadas, obtener estructura de la tabla
        if (!columns) {
          const structure = await mysqlService.getTableStructure(tableName);
          const data: Record<string, any> = {};
          structure.forEach((col: any, idx: number) => {
            data[col.Field] = values[idx] !== undefined ? values[idx] : null;
          });
          return await mysqlService.insertData(tableName, data);
        } else {
          const data: Record<string, any> = {};
          columns.forEach((col, idx) => {
            data[col] = values[idx] !== undefined ? values[idx] : null;
          });
          return await mysqlService.insertData(tableName, data);
        }
      }
    }
    
    // SELECT
    if (trimmedQuery.startsWith('SELECT')) {
      const match = query.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/is);
      if (match) {
        const columnsStr = match[1].trim();
        const tableName = match[2];
        const where = match[3];
        return await mysqlService.selectData(tableName, {
          columns: columnsStr,
          where: where
        });
      }
    }
    
    // UPDATE
    if (trimmedQuery.startsWith('UPDATE')) {
      const match = query.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*))?$/is);
      if (match) {
        const tableName = match[1];
        const updates: Record<string, any> = {};
        const setClause = match[2];
        setClause.split(',').forEach(part => {
          const [key, value] = part.split('=').map(s => s.trim());
          updates[key] = value.replace(/['"]/g, '');
        });
        return await mysqlService.updateData(tableName, updates, match[3]);
      }
    }
    
    // DELETE
    if (trimmedQuery.startsWith('DELETE')) {
      const match = query.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/is);
      if (match) {
        const where = match[2] || 'id > 0'; // MySQL requiere WHERE por seguridad
        return await mysqlService.deleteData(match[1], where);
      }
    }
    
    // Para cualquier otra consulta, intentar ejecutarla directamente
    return await mysqlService.executeSQL(query);
  };

  const executeInMemoryQuery = (query: string): QueryResult => {
    const trimmedQuery = query.trim().toUpperCase();
    const originalQuery = query.trim();
    
    // CREATE DATABASE
    if (trimmedQuery.startsWith('CREATE DATABASE')) {
      const match = originalQuery.match(/CREATE\s+DATABASE\s+['"]?(\w+)['"]?/i);
      if (match) {
        return firebirdDB.createDatabase(match[1]);
      }
    }
    
    // CONNECT TO
    if (trimmedQuery.startsWith('CONNECT')) {
      const match = originalQuery.match(/CONNECT\s+(?:TO\s+)?['"]?(\w+)['"]?(?:\s+USER\s+['"]?(\w+)['"]?)?(?:\s+PASSWORD\s+['"]?([^'"]+)['"]?)?/i);
      if (match) {
        return firebirdDB.connectDatabase(match[1], match[2], match[3]);
      }
    }
    
    // CREATE TABLE
    if (trimmedQuery.startsWith('CREATE TABLE')) {
      const match = originalQuery.match(/CREATE\s+TABLE\s+(\w+)\s*\((.*)\)/is);
      if (match) {
        const tableName = match[1];
        const columnsStr = match[2];
        const columns = columnsStr.split(',').map(col => {
          const parts = col.trim().split(/\s+/);
          return {
            name: parts[0],
            type: parts[1] || 'VARCHAR',
            constraints: parts.slice(2)
          };
        });
        return firebirdDB.createTable(tableName, columns);
      }
    }
    
    // INSERT INTO
    if (trimmedQuery.startsWith('INSERT INTO')) {
      const match = originalQuery.match(/INSERT\s+INTO\s+(\w+).*VALUES\s*\((.*)\)/is);
      if (match) {
        const tableName = match[1];
        const valuesStr = match[2];
        const values = valuesStr.split(',').map(v => {
          const trimmed = v.trim();
          if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
            return trimmed.slice(1, -1);
          }
          return trimmed;
        });
        return firebirdDB.insertInto(tableName, values);
      }
    }
    
    // SELECT
    if (trimmedQuery.startsWith('SELECT')) {
      const match = originalQuery.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)/is);
      if (match) {
        const columnsStr = match[1].trim();
        const tableName = match[2];
        const columns = columnsStr === '*' ? ['*'] : columnsStr.split(',').map(c => c.trim());
        return firebirdDB.select(tableName, columns);
      }
    }
    
    // UPDATE
    if (trimmedQuery.startsWith('UPDATE')) {
      const match = originalQuery.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*))?$/is);
      if (match) {
        const tableName = match[1];
        const updates: Record<string, any> = {};
        const setClause = match[2];
        setClause.split(',').forEach(part => {
          const [key, value] = part.split('=').map(s => s.trim());
          updates[key] = value.replace(/['"]/g, '');
        });
        return firebirdDB.update(tableName, updates, match[3]);
      }
    }
          
    // DELETE
    if (trimmedQuery.startsWith('DELETE')) {
      const match = originalQuery.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/is);
      if (match) {
        return firebirdDB.delete(match[1], match[2]);
      }
    }
    
    return {
      success: false,
      message: 'Consulta no soportada o sintaxis incorrecta'
    };
  };

  const handleExecute = async () => {
    if (!sql.trim()) {
      toast.error('Por favor escribe una consulta SQL');
      return;
    }
    
    // Execute query
    const result = await executeFirebirdQuery(sql);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    
    onExecute?.(sql, result);
  };

  const handleClear = () => {
    setSql('');
    setTokens([]);
    setParseResult(null);
  };

  // MODIFICACIÓN CLAVE: Comandos Rápidos con sintaxis MySQL
  const quickCommands = [
    { 
      label: '1. Crea tu base de datos (CREATE DATABASE)', 
      command: "CREATE DATABASE mi_nueva_db;" 
    },
    { 
      label: '2. Conéctate a tu base de datos (USE)', 
      command: "USE mi_nueva_db;" 
    },
    { 
      label: '3. Crea una tabla (CREATE TABLE)', 
      command: 'CREATE TABLE usuarios (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  nombre VARCHAR(50) NOT NULL,\n  email VARCHAR(100),\n  fecha_registro DATE\n);' 
    },
    { 
      label: '4. Añade entradas (INSERT INTO)', 
      command: "INSERT INTO usuarios (nombre, email, fecha_registro) VALUES ('Juan Pérez', 'juan@email.com', '2025-01-15');" 
    },
    { 
      label: '5. Consulta entradas (SELECT)', 
      command: 'SELECT * FROM usuarios;' 
    }
  ];

  return (
    <div className="space-y-4">
      {/* Quick Commands */}
      <Card className="p-4 bg-card border-border">
        <div className="space-y-3">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSqlChange(cmd.command)}
              className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm text-foreground"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </Card>

      {/* SQL Editor */}
      <Card className="p-6 bg-editor-bg border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <Database className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold text-editor-text">Editor Firebird SQL</h2>
            {/* El nombre del editor puede permanecer para compatibilidad visual con el simulador */}
          </div>
          
          {/* Indicador de conexión MySQL */}
          {backendAvailable !== null && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              backendAvailable 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendAvailable ? 'bg-success animate-pulse' : 'bg-yellow-500'
              }`} />
              {backendAvailable ? 'MySQL Conectado' : 'Modo Simulación'}
            </div>
          )}
        </div>

        {/* Alerta si el backend no está disponible */}
        {backendAvailable === false && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-600">
              <p className="font-medium">Backend MySQL no disponible</p>
              <p className="text-xs mt-1">
                Los datos se guardarán solo en memoria. Inicia el backend con <code className="bg-yellow-500/20 px-1 rounded">npm start</code> en la carpeta backend.
              </p>
            </div>
          </div>
        )}
        
        <Textarea
          value={sql}
          onChange={(e) => handleSqlChange(e.target.value)}
          placeholder="Escribe tu consulta SQL aquí..."
          className="min-h-[200px] font-mono text-sm bg-editor-bg text-editor-text border-border focus:ring-primary"
          spellCheck={false}
        />
        
        <div className="flex gap-3 mt-4">
          <Button 
            onClick={handleExecute}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Play className="w-4 h-4 mr-2" />
            Ejecutar
          </Button>
          
          <Button 
            onClick={handleClear}
            variant="outline"
            className="border-border"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </Card>

      {/* Lexical Analysis */}
      {tokens.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Análisis Léxico (Tokens)</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tokens.filter(t => t.type !== 'WHITESPACE').map((token, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted"
              >
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  token.type === 'KEYWORD' ? 'bg-token-keyword text-white' :
                  token.type === 'STRING' ? 'bg-token-string text-white' :
                  token.type === 'NUMBER' ? 'bg-token-number text-white' :
                  token.type === 'OPERATOR' ? 'bg-token-operator text-white' :
                  'bg-muted-foreground text-white'
                }`}>
                  {token.type}
                </span>
                <code className="flex-1 text-sm font-mono text-foreground">{token.value}</code>
                <span className="text-xs text-muted-foreground">Pos: {token.position}</span>
              </div>
            ))}
        </div>
        </Card>
      )}

      {/* Syntax Analysis */}
      {parseResult && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Análisis Sintáctico</h3>
          
          <div className={`p-4 rounded-lg mb-4 ${
            parseResult.isValid 
              ? 'bg-success/10 border border-success/20' 
              : 'bg-destructive/10 border border-destructive/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                parseResult.isValid ? 'bg-success' : 'bg-destructive'
              }`} />
              <span className={`font-medium ${
                parseResult.isValid ? 'text-success' : 'text-destructive'
              }`}>
                {parseResult.isValid ? '✓ Sintaxis válida' : '✗ Errores de sintaxis'}
              </span>
            </div>
          </div>

          {parseResult.errors.length > 0 && (
            <div className="space-y-2 mb-4">
              {parseResult.errors.map((error, idx) => (
                <div key={idx} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm text-foreground">Árbol Sintáctico:</h4>
            <pre className="text-xs font-mono overflow-x-auto text-foreground">
              {JSON.stringify(parseResult.tree, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};