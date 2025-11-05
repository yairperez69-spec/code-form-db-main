import { Card } from '@/components/ui/card';
import { Database, Table as TableIcon, Columns } from 'lucide-react';
import { firebirdDB } from '@/utils/firebirdSimulator';

export const DatabaseViewer = () => {
  const currentDB = firebirdDB.getCurrentDatabase();
  const databases = firebirdDB.listDatabases();

  if (!currentDB) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Estado de la Base de Datos</h3>
        </div>
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No hay una base de datos conectada
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {databases.length > 0 
              ? `Bases de datos disponibles: ${databases.join(', ')}`
              : 'Crea y conéctate a una base de datos para comenzar'
            }
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-success" />
        <h3 className="text-lg font-semibold text-foreground">Base de Datos Actual</h3>
      </div>

      <div className="space-y-4">
        {/* Database Info */}
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-medium text-success">Conectado a: {currentDB.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentDB.tables.length} tabla(s)
          </p>
        </div>

        {/* Tables List */}
        {currentDB.tables.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm text-foreground">Tablas</h4>
            </div>
            
            {currentDB.tables.map((table, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-foreground">{table.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {table.data.length} registro(s)
                  </span>
                </div>
                
                <div className="flex items-start gap-2 mt-2">
                  <Columns className="w-3 h-3 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1">
                      {table.columns.map((col, colIdx) => (
                        <span 
                          key={colIdx}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
                        >
                          {col.name}: {col.type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Show data if exists */}
                {table.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          {table.columns.map((col, colIdx) => (
                            <th key={colIdx} className="text-left py-1 px-2 text-muted-foreground font-medium">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.data.slice(0, 3).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-border/50">
                            {table.columns.map((col, colIdx) => (
                              <td key={colIdx} className="py-1 px-2 text-foreground">
                                {row[col.name]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {table.data.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        ... y {table.data.length - 3} registro(s) más
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <TableIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No hay tablas en esta base de datos
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
