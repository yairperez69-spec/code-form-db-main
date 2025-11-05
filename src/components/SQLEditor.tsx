import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Database, Play, Trash2, Flame } from 'lucide-react';
import { tokenize, Token } from '@/utils/sqlLexer';
import { parse, ParseResult } from '@/utils/sqlParser';
import { firebirdDB, QueryResult } from '@/utils/firebirdSimulator';
import { toast } from 'sonner';

interface SQLEditorProps {
  onExecute?: (sql: string, result: QueryResult) => void;
}

export const SQLEditor = ({ onExecute }: SQLEditorProps) => {
  const [sql, setSql] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleSqlChange = (value: string) => {
    setSql(value);
    const newTokens = tokenize(value);
    setTokens(newTokens);
    const result = parse(newTokens);
    setParseResult(result);
  };

  const executeFirebirdQuery = (query: string): QueryResult => {
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

  const handleExecute = () => {
    if (!sql.trim()) {
      toast.error('Por favor escribe una consulta SQL');
      return;
    }
    
    // Execute query
    const result = executeFirebirdQuery(sql);
    
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

  const quickCommands = [
    { 
      label: '1. Crea tu base de datos (CREATE DATABASE)', 
      command: "CREATE DATABASE 'mi_base_datos.fdb' PAGE_SIZE 8192;" 
    },
    { 
      label: '2. Conéctate a tu base de datos (CONNECT TO)', 
      command: "CONNECT TO 'mi_base_datos.fdb' USER 'SYSDBA' PASSWORD 'masterkey';" 
    },
    { 
      label: '3. Crea una tabla en tu base de datos (CREATE TABLE)', 
      command: 'CREATE TABLE usuarios (\n  id INTEGER PRIMARY KEY,\n  nombre VARCHAR(50) NOT NULL,\n  email VARCHAR(100),\n  fecha_registro DATE\n);' 
    },
    { 
      label: '4. Añade entradas a tu base de datos (INSERT INTO)', 
      command: "INSERT INTO usuarios VALUES (1, 'Juan Pérez', 'juan@email.com', '2025-01-15');" 
    },
    { 
      label: '5. Consulta, modifica o elimina entradas', 
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
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <Database className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-editor-text">Editor Firebird SQL</h2>
        </div>
        
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
