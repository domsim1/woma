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
  Grt,
  If,
  Else,
  Dup,
  Leave,
  Sub,
  Def,
  TypeStart,
  TypeEnd,
  TypeMid,
  Exit,
  Type,
  Swap,
  Neg,
}

enum OpType {
  Lit,
  UserDefinedWord,
  Word,
  EOF,
  Flow,
  Type,
}

enum DataType {
  int,
  word,
  any,
  ptr,
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
  public wordType?: WordType[];

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
        this.wordType = [
          {
            input: [DataType.int, DataType.int],
            output: [DataType.int],
          },
          {
            input: [DataType.ptr, DataType.int],
            output: [DataType.ptr],
          },
          {
            input: [DataType.int, DataType.ptr],
            output: [DataType.ptr],
          },
        ];
        break;
      }
      case 'neg': {
        this.op = Op.Neg;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [DataType.int],
            output: [DataType.int],
          }
        ]
        break;
      }
      case 'drop': {
        this.op = Op.Drop;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = [
          {
          input: [DataType.int],
          output: [],
          },
          {
            input: [DataType.ptr],
            output: []
          },
        ];
        break;
      }
      case 'mem': {
        this.op = Op.Mem;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = [{
          input: [],
          output: [DataType.ptr]
        }];
        break;
      }
      case '@': {
        this.op = Op.Load;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = [{
          input: [DataType.ptr],
          output: [DataType.int],
        }];
        break;
      }
      case '!': {
        this.op = Op.Store;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = [{
          input: [DataType.int, DataType.ptr],
          output: [],
        }];
        break;
      }
      case 'syscall3': {
        this.op = Op.SysCall3;
        this.opType = OpType.Word;
        this.dataType = DataType.word;
        this.wordType = [{
          input: [DataType.any, DataType.any, DataType.any, DataType.int],
          output: [],
        }];
        break;
      }
      case 'loop': {
        this.op = Op.Loop;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [],
            output: [],
          }
        ];
        break;
      }
      case 'for': {
        this.op = Op.For;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [DataType.int, DataType.int],
            output: [],
          }
        ];
        break;
      }
      case 'end': {
        this.op = Op.End;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [],
            output: [],
          }
        ];
        break;
      }
      case 'i': {
        this.op = Op.I;
        this.opType = OpType.Word;
        this.wordType = [{
          input: [],
          output: [DataType.int]
        }];
        break;
      }
      case '/mod': {
        this.op = Op.DivMod;
        this.opType = OpType.Word;
        this.wordType = [{
          input: [DataType.int, DataType.int],
          output: [DataType.int, DataType.int]
        }];
        break;
      }
      case '<': {
        this.op = Op.Less;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [DataType.int, DataType.int],
            output: [DataType.int],
          }
        ];
        break;
      }
      case '>': {
        this.op = Op.Grt;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [DataType.int, DataType.int],
            output: [DataType.int],
          }
        ];
        break;
      }
      case 'if': {
        this.op = Op.If;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [DataType.int],
            output: [],
          },
        ];
        break;
      }
      case 'dup': {
        this.op = Op.Dup;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [DataType.int],
            output: [DataType.int, DataType.int],
          },
          {
            input: [DataType.ptr],
            output: [DataType.ptr, DataType.ptr],
          },
        ];
        break;
      }
      case 'leave': {
        this.op = Op.Leave;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [],
            output: [],
          }
        ]
        break;
      }
      case '-': {
        this.op = Op.Sub;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [DataType.int, DataType.int],
            output: [DataType.int],
          },
          {
            input: [DataType.int, DataType.ptr],
            output: [DataType.ptr],
          },
          {
            input: [DataType.ptr, DataType.int],
            output: [DataType.ptr],
          },
          {
            input: [DataType.ptr, DataType.ptr],
            output: [DataType.ptr],
          }
        ];
        break;
      }
      case 'def': {
        this.op = Op.Def;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [],
            output: [],
          }
        ]
        break;
      }
      case '(': {
        this.op = Op.TypeStart;
        this.opType = OpType.Type;
        break;
      }
      case 'int': {
        this.op = Op.Type;
        this.opType = OpType.Type;
        this.dataType = DataType.int;
        break;
      }
      case 'ptr': {
        this.op = Op.Type;
        this.opType = OpType.Type;
        this.dataType = DataType.ptr;
        break;
      }
      case 'bool': {
        this.op = Op.Type;
        this.opType = OpType.Type;
        this.dataType = DataType.int;
        break;
      }
      case '--': {
        this.op = Op.TypeMid;
        this.opType = OpType.Type;
        break;
      }
      case ')': {
        this.op = Op.TypeEnd;
        this.opType = OpType.Type;
        break;
      }
      case 'else': {
        this.op = Op.Else;
        this.opType = OpType.Flow;
        this.wordType = [
          {
            input: [],
            output: [],
          }
        ]
        break;
      }
      case 'swap': {
        this.op = Op.Swap;
        this.opType = OpType.Word;
        this.wordType = [
          {
            input: [ DataType.int, DataType.int ],
            output: [ DataType.int, DataType.int ],
          },
          {
            input: [ DataType.ptr, DataType.ptr ],
            output: [ DataType.ptr, DataType.ptr ],
          },
          {
            input: [ DataType.int, DataType.ptr ],
            output: [ DataType.ptr, DataType.int ],
          },
          {
            input: [ DataType.ptr, DataType.int ],
            output: [ DataType.int, DataType.ptr ],
          },
        ]
        break;
      }
      case 'exit': {
        this.op = Op.Exit;
        this.opType = OpType.Flow;
        break;
      }
      default: {
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