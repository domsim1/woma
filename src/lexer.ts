import { WomaSymbol } from './symbol';
type Char = string;
type Token = string;

const literals = '1,2,3,4,5,6,7,8,9,0'.split(',');
const literalStarts = '-,"'.split(',');

class Lexer { 
  private readonly code: string;
  private pc: number;
  private col: number;
  private ln: number;
  private currentTokenCol: number;
  private currentTokenLn: number;
  private currentTokenIsLiteral: boolean;


  constructor(code: string) {
    this.code = code;
    this.pc = -1;
    this.col = 0;
    this.ln = 1;
    this.currentTokenCol = 0;
    this.currentTokenLn = 0;
    this.currentTokenIsLiteral = false;
  }

  private next(): Char {
    this.pc += 1;
    this.col += 1;
    if (this.pc < this.code.length) {
      return this.code[this.pc];
    }
    return 'EOF';
  }

  private peek(howFar = 1): Char {
    if (this.pc + howFar < this.code.length) {
      return this.code[this.pc + howFar];
    }
    return 'EOF';
  }

  private nextLn(): void {
    this.ln += 1
    this.col = 0;
  }

  private nextToken(): Token {
    let char = this.next();
    let token = '';
    if (char === '\\') {
      while (char !== '\n') {
        char = this.next();
      }
    }
    if (char === ' ') {
      return this.nextToken();
    }
    if (char === '\n') {
      this.nextLn();
      return this.nextToken();
    }
    if (char === 'EOF') {
      return char;
    }
    this.currentTokenCol = this.col;
    this.currentTokenLn = this.ln;
    this.currentTokenIsLiteral = true;
    if (literalStarts.includes(char)) {
      if (char === '"') {
        token += char;
        char = this.next();
        while (!['EOF', '\n', '"'].includes(char)) {
          token += char;
          char = this.next();
          if (char === '\n') {
            this.nextLn();
          }
        }
        return token;
      }
      token += char;
      char = this.next();
      if (char === ' ') {
        this.currentTokenIsLiteral = false;
      }
      if (char === '\n') {
        this.nextLn();
      }
    }
    while (!['EOF', '\n', ' '].includes(char)) {
      if (this.currentTokenIsLiteral && !literals.includes(char)) {
        this.currentTokenIsLiteral = false;
      }
      token += char;
      char = this.next();
    }
    if (char === '\n') {
      this.nextLn();
    }
    return token;
  }

  public nextSymbol(): WomaSymbol {
    const token = this.nextToken();
    return new WomaSymbol(token, this.currentTokenLn, this.currentTokenCol, this.currentTokenIsLiteral);
  }
}

export {
  Lexer,
  Token
}