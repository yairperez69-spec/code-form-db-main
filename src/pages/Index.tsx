import { useState } from 'react';
import { SQLEditor } from '@/components/SQLEditor';
import { DatabaseViewer } from '@/components/DatabaseViewer';
import { Card } from '@/components/ui/card';
import { Flame, Database } from 'lucide-react';
import { QueryResult } from '@/utils/firebirdSimulator';

interface ExecutionLog {
  sql: string;
  result: QueryResult;
  timestamp: Date;
}

const Index = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const handleExecute = (sql: string, result: QueryResult) => {
    setLogs([{ sql, result, timestamp: new Date() }, ...logs]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-card via-orange-500/5 to-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Flame className="w-10 h-10 text-orange-500 animate-pulse-glow" />
              <Database className="w-6 h-6 text-secondary absolute -bottom-1 -right-1 animate-spin-slow group-hover:animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Firebird SQL Analyzer</h1>
              <p className="text-sm text-muted-foreground">Editor con análisis léxico y sintáctico + Simulador Firebird</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Section - 2 columns */}
          <div className="lg:col-span-2">
            <SQLEditor onExecute={handleExecute} />
          </div>

          {/* Info Section - 1 column */}
          <div className="space-y-6">
            <DatabaseViewer />

            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Historial de Ejecución</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Los resultados de las consultas aparecerán aquí
                  </p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      log.result.success 
                        ? 'bg-success/10 border-success/20' 
                        : 'bg-destructive/10 border-destructive/20'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <code className="text-xs font-mono text-foreground flex-1">
                          {log.sql.length > 50 ? log.sql.substring(0, 50) + '...' : log.sql}
                        </code>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        log.result.success ? 'text-success' : 'text-destructive'
                      }`}>
                        {log.result.message}
                      </p>
                      {log.result.data && log.result.data.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">
                            {log.result.data.length} fila(s) retornada(s)
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-primary/10 border-border">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">Sobre Firebird SQL</h3>
              </div>
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  <strong className="text-primary">Analizador Léxico:</strong> Tokeniza código SQL incluyendo sintaxis específica de Firebird
                </p>
                <p>
                  <strong className="text-secondary">Analizador Sintáctico:</strong> Valida estructura con soporte para comandos Firebird
                </p>
                <p>
                  <strong className="text-orange-500">Simulador:</strong> Base de datos funcional en memoria
                </p>
                <p className="text-muted-foreground mt-4 text-xs">
                  Soporta: CREATE DATABASE, CONNECT TO, CREATE TABLE, INSERT, SELECT, UPDATE, DELETE
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
