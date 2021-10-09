import { Token } from './lexer';
enum Op {
  Lit,
  Word,
  EOF,
  Sum,
  Drop,
  Mem,
  Load,
  Store,
  SysCall3,
  Loop,
  For,
  End,
  I,
  DivMod,
  Less,
  If,
  Dup,
  Leave,
  Sub,
}

enum OpType {
  Lit,
  UserDefinedWord,
  Word,
  EOF,
  Flow,
}

enum DataType {
  int,
  word,
  any,
  ptr,
  i8,
}

interface WordType {
  input: DataType[];
  output: DataType[];
}

class WomaSymbol {
  public readonly ln: number;
  public readonly col: number;
  public readonly op: Op;
  public readonly opType: OpType;
  public readonly token: string;
  public readonly dataType?: DataType;
  public value?: string | number;
  public wordType?: WordType;

  constructor(token: Token, ln: number, col: number, isLiteral: boolean) {
    this.col = col;
    this.ln = ln;
    this.token = token;
    if (isLiteral) {
      this.op = Op.Lit;
      this.opType = OpType.Lit;
      this.value = token
      this.dataType = DataType.int;
      return;
    }
    switch (token) {
      case 'EOF': {
        this.op = Op.EOF;
        this.opType = OpType.EOF;
        break;
      }
      case '+': {
        this.op = Op.Sum
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          input: [DataType.int, DataType.int],
          output: [DataType.int],
        }
        break;
      }
      case 'drop': {
        this.op = Op.Drop;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          input: [DataType.any],
          output: [],
        }
        break;
      }
      case 'mem': {
        this.op = Op.Mem;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          input: [],
          output: [DataType.ptr]
        }
        break;
      }
      case '@': {
        this.op = Op.Load;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          input: [DataType.ptr],
          // TODO: change in to i8
          output: [DataType.int],
        }
        break;
      }
      case '!': {
        this.op = Op.Store;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          // TODO: change in to i8
          input: [DataType.int, DataType.ptr],
          output: [],
        }
        break;
      }
      case 'syscall3': {
        this.op = Op.SysCall3;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = {
          input: [DataType.any, DataType.any, DataType.any, DataType.int],
          output: [],
        }
        break;
      }
      case 'loop': {
        this.op = Op.Loop;
        this.opType = OpType.Flow;
        break;
      }
      case 'for': {
        this.op = Op.For;
        this.opType = OpType.Flow;
        break;
      }
      case 'end': {
        this.op = Op.End;
        this.opType = OpType.Flow;
        break;
      }
      case 'i': {
        this.op = Op.I;
        this.opType = OpType.Word;
        break;
      }
      case '/mod': {
        this.op = Op.DivMod;
        this.opType = OpType.Word;
        break;
      }
      case '<': {
        this.op = Op.Less;
        this.opType = OpType.Word;
        break;
      }
      case 'if': {
        this.op = Op.If;
        this.opType = OpType.Flow;
        break;
      }
      case 'dup': {
        this.op = Op.Dup;
        this.opType = OpType.Word;
        break;
      }
      case 'leave': {
        this.op = Op.Leave;
        this.opType = OpType.Flow;
        break;
      }
      case '-': {
        this.op = Op.Sub;
        this.opType = OpType.Word;
        break;
      }
      default: {
        throw new Error(`UNKNOWN TOKEN ${token}`);
        this.op = Op.Word;
        this.opType = OpType.UserDefinedWord;
      }
    }
  }
}

export {
  WomaSymbol,
  Op,
  OpType,
  WordType,
  DataType,
}