import { Token } from './sqlLexer';

export interface SyntaxNode {
  type: string;
  value?: string;
  children?: SyntaxNode[];
  valid: boolean;
  error?: string;
}

export interface ParseResult {
  tree: SyntaxNode;
  errors: string[];
  isValid: boolean;
}

export function parse(tokens: Token[]): ParseResult {
  const errors: string[] = [];
  const filteredTokens = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT');
  
  if (filteredTokens.length === 0) {
    return {
      tree: { type: 'EMPTY', valid: true },
      errors: [],
      isValid: true
    };
  }
  
  let position = 0;
  
  const peek = () => filteredTokens[position];
  const consume = () => filteredTokens[position++];
  const expect = (type: string, value?: string): Token | null => {
    const token = peek();
    if (!token) {
      errors.push(`Se esperaba ${value || type} pero se encontró el final del comando`);
      return null;
    }
    if (token.type !== type || (value && token.value.toUpperCase() !== value.toUpperCase())) {
      errors.push(`Se esperaba ${value || type} pero se encontró ${token.value}`);
      return null;
    }
    return consume();
  };
  
  const parseCreateDatabase = (): SyntaxNode => {
    const node: SyntaxNode = {
      type: 'CREATE_DATABASE',
      children: [],
      valid: true
    };
    
    consume(); // CREATE
    const dbKeyword = expect('KEYWORD', 'DATABASE');
    if (!dbKeyword) {
      node.valid = false;
      return node;
    }
    
    const dbName = expect('IDENTIFIER');
    if (!dbName) {
      node.valid = false;
      return node;
    }
    
    node.children = [
      { type: 'KEYWORD', value: 'CREATE DATABASE', valid: true },
      { type: 'DATABASE_NAME', value: dbName.value, valid: true }
    ];
    
    return node;
  };
  
  const parseUse = (): SyntaxNode => {
    const node: SyntaxNode = {
      type: 'USE_DATABASE',
      children: [],
      valid: true
    };
    
    consume(); // USE
    const dbName = expect('IDENTIFIER');
    if (!dbName) {
      node.valid = false;
      return node;
    }
    
    node.children = [
      { type: 'KEYWORD', value: 'USE', valid: true },
      { type: 'DATABASE_NAME', value: dbName.value, valid: true }
    ];
    
    return node;
  };
  
  const parseCreateTable = (): SyntaxNode => {
    const node: SyntaxNode = {
      type: 'CREATE_TABLE',
      children: [],
      valid: true
    };
    
    consume(); // CREATE
    const tableKeyword = expect('KEYWORD', 'TABLE');
    if (!tableKeyword) {
      node.valid = false;
      return node;
    }
    
    const tableName = expect('IDENTIFIER');
    if (!tableName) {
      node.valid = false;
      return node;
    }
    
    const openParen = expect('DELIMITER', '(');
    if (!openParen) {
      node.valid = false;
      return node;
    }
    
    const columns: SyntaxNode[] = [];
    while (peek() && peek().value !== ')') {
      const colName = expect('IDENTIFIER');
      if (!colName) {
        node.valid = false;
        break;
      }
      
      const colType = expect('KEYWORD');
      if (!colType) {
        node.valid = false;
        break;
      }
      
      columns.push({
        type: 'COLUMN',
        value: `${colName.value} ${colType.value}`,
        valid: true
      });
      
      if (peek()?.value === ',') {
        consume();
      }
    }
    
    const closeParen = expect('DELIMITER', ')');
    if (!closeParen) {
      node.valid = false;
      return node;
    }
    
    node.children = [
      { type: 'KEYWORD', value: 'CREATE TABLE', valid: true },
      { type: 'TABLE_NAME', value: tableName.value, valid: true },
      { type: 'COLUMNS', children: columns, valid: true }
    ];
    
    return node;
  };
  
  const parseInsert = (): SyntaxNode => {
    const node: SyntaxNode = {
      type: 'INSERT',
      children: [],
      valid: true
    };
    
    consume(); // INSERT
    const intoKeyword = expect('KEYWORD', 'INTO');
    if (!intoKeyword) {
      node.valid = false;
      return node;
    }
    
    const tableName = expect('IDENTIFIER');
    if (!tableName) {
      node.valid = false;
      return node;
    }
    
    node.children = [
      { type: 'KEYWORD', value: 'INSERT INTO', valid: true },
      { type: 'TABLE_NAME', value: tableName.value, valid: true }
    ];
    
    return node;
  };
  
  const parseSelect = (): SyntaxNode => {
    const node: SyntaxNode = {
      type: 'SELECT',
      children: [],
      valid: true
    };
    
    consume(); // SELECT
    
    const columns: SyntaxNode[] = [];
    while (peek() && peek().value.toUpperCase() !== 'FROM') {
      if (peek().type === 'OPERATOR' && peek().value === '*') {
        columns.push({ type: 'ALL_COLUMNS', value: '*', valid: true });
        consume();
      } else if (peek().type === 'IDENTIFIER') {
        columns.push({ type: 'COLUMN', value: peek().value, valid: true });
        consume();
      }
      
      if (peek()?.value === ',') {
        consume();
      }
    }
    
    const fromKeyword = expect('KEYWORD', 'FROM');
    if (!fromKeyword) {
      node.valid = false;
      return node;
    }
    
    const tableName = expect('IDENTIFIER');
    if (!tableName) {
      node.valid = false;
      return node;
    }
    
    node.children = [
      { type: 'KEYWORD', value: 'SELECT', valid: true },
      { type: 'COLUMNS', children: columns, valid: true },
      { type: 'KEYWORD', value: 'FROM', valid: true },
      { type: 'TABLE_NAME', value: tableName.value, valid: true }
    ];
    
    return node;
  };
  
  // Parse main statement
  let tree: SyntaxNode;
  const firstToken = peek();
  
  if (!firstToken || firstToken.type !== 'KEYWORD') {
    tree = {
      type: 'ERROR',
      error: 'Se esperaba una palabra clave SQL',
      valid: false
    };
    errors.push('Se esperaba una palabra clave SQL');
  } else {
    const keyword = firstToken.value.toUpperCase();
    
    switch (keyword) {
      case 'CREATE':
        const nextToken = filteredTokens[position + 1];
        if (nextToken?.value.toUpperCase() === 'DATABASE') {
          tree = parseCreateDatabase();
        } else if (nextToken?.value.toUpperCase() === 'TABLE') {
          tree = parseCreateTable();
        } else {
          tree = { type: 'ERROR', error: 'CREATE debe ir seguido de DATABASE o TABLE', valid: false };
          errors.push('CREATE debe ir seguido de DATABASE o TABLE');
        }
        break;
      case 'USE':
        tree = parseUse();
        break;
      case 'INSERT':
        tree = parseInsert();
        break;
      case 'SELECT':
        tree = parseSelect();
        break;
      default:
        tree = { type: 'UNSUPPORTED', value: keyword, valid: true };
    }
  }
  
  return {
    tree,
    errors,
    isValid: errors.length === 0 && tree.valid
  };
}
