export interface Token {
  type: 'KEYWORD' | 'IDENTIFIER' | 'OPERATOR' | 'STRING' | 'NUMBER' | 'DELIMITER' | 'WHITESPACE' | 'COMMENT' | 'UNKNOWN';
  value: string;
  position: number;
}

const SQL_KEYWORDS = [
  'CREATE', 'DATABASE', 'TABLE', 'USE', 'INSERT', 'INTO', 'VALUES',
  'SELECT', 'FROM', 'WHERE', 'UPDATE', 'SET', 'DELETE', 'DROP',
  'ALTER', 'ADD', 'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'NOT', 'NULL', 'UNIQUE', 'INDEX', 'ON', 'AND', 'OR', 'ORDER', 'BY',
  'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'VARCHAR', 'INT', 'INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'DATE',
  'DATETIME', 'TIMESTAMP', 'TEXT', 'BOOLEAN', 'CHAR', 'AS', 'DISTINCT',
  // Firebird specific keywords
  'CONNECT', 'USER', 'PASSWORD', 'ROLE', 'DOMAIN', 'GENERATOR', 'SEQUENCE',
  'PROCEDURE', 'TRIGGER', 'EXCEPTION', 'BLOB', 'SMALLINT', 'BIGINT',
  'NUMERIC', 'TIME', 'AUTOINCREMENT', 'COMPUTED', 'CHECK', 'DEFAULT',
  'CONSTRAINT', 'CASCADE', 'RESTRICT', 'NO', 'ACTION', 'RETURNING',
  'EXECUTE', 'BLOCK', 'BEGIN', 'END', 'FOR', 'SUSPEND', 'RETURNS',
  'RECREATE', 'PAGE_SIZE', 'LENGTH', 'CHARACTER', 'COLLATE'
];

const OPERATORS = ['=', '>', '<', '>=', '<=', '!=', '<>', '+', '-', '*', '/', '%'];
const DELIMITERS = ['(', ')', ',', ';', '.'];

export function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  
  while (position < sql.length) {
    const char = sql[position];
    
    // Whitespace
    if (/\s/.test(char)) {
      const start = position;
      while (position < sql.length && /\s/.test(sql[position])) {
        position++;
      }
      tokens.push({
        type: 'WHITESPACE',
        value: sql.substring(start, position),
        position: start
      });
      continue;
    }
    
    // Comments
    if (char === '-' && sql[position + 1] === '-') {
      const start = position;
      while (position < sql.length && sql[position] !== '\n') {
        position++;
      }
      tokens.push({
        type: 'COMMENT',
        value: sql.substring(start, position),
        position: start
      });
      continue;
    }
    
    // String literals
    if (char === "'" || char === '"') {
      const start = position;
      const quote = char;
      position++;
      while (position < sql.length && sql[position] !== quote) {
        if (sql[position] === '\\') position++; // Skip escaped characters
        position++;
      }
      position++; // Include closing quote
      tokens.push({
        type: 'STRING',
        value: sql.substring(start, position),
        position: start
      });
      continue;
    }
    
    // Numbers
    if (/\d/.test(char)) {
      const start = position;
      while (position < sql.length && /[\d.]/.test(sql[position])) {
        position++;
      }
      tokens.push({
        type: 'NUMBER',
        value: sql.substring(start, position),
        position: start
      });
      continue;
    }
    
    // Operators
    const twoCharOp = sql.substring(position, position + 2);
    if (OPERATORS.includes(twoCharOp)) {
      tokens.push({
        type: 'OPERATOR',
        value: twoCharOp,
        position
      });
      position += 2;
      continue;
    }
    
    if (OPERATORS.includes(char)) {
      tokens.push({
        type: 'OPERATOR',
        value: char,
        position
      });
      position++;
      continue;
    }
    
    // Delimiters
    if (DELIMITERS.includes(char)) {
      tokens.push({
        type: 'DELIMITER',
        value: char,
        position
      });
      position++;
      continue;
    }
    
    // Keywords and Identifiers
    if (/[a-zA-Z_]/.test(char)) {
      const start = position;
      while (position < sql.length && /[a-zA-Z0-9_]/.test(sql[position])) {
        position++;
      }
      const value = sql.substring(start, position);
      const upperValue = value.toUpperCase();
      
      tokens.push({
        type: SQL_KEYWORDS.includes(upperValue) ? 'KEYWORD' : 'IDENTIFIER',
        value,
        position: start
      });
      continue;
    }
    
    // Unknown character
    tokens.push({
      type: 'UNKNOWN',
      value: char,
      position
    });
    position++;
  }
  
  return tokens;
}
