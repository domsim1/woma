import { Lexer } from "./lexer";
import { DataType, Op, OpType, WomaSymbol } from "./symbol";

interface ReturnStackItem {
  pc: number;
  rws: WomaSymbol
}

class Parser {
  private ast: WomaSymbol[];
  private rs: ReturnStackItem[];
  private pc: number;
  private ts: DataType[];
  private lexer: Lexer;
  private currentSymbol: WomaSymbol;

  constructor(lexer: Lexer) {
    this.ast = [];
    this.rs = [];
    this.pc = 0;
    this.ts = [];
    this.lexer = lexer;
    this.currentSymbol = this.lexer.nextSymbol();
    while (this.currentSymbol.op !== Op.EOF) {
      this.parseWomaSymbol();
    }
    this.checkStackIsEmpty();
  }

  public getAST(): WomaSymbol[] {
    return this.ast;
  }

  private genErrorMessage(issue: string): string {
    return `Error: ln: ${this.currentSymbol.ln}, col: ${this.currentSymbol.col}, token: ${this.currentSymbol.token}\nIssue: ${issue}`
  }

  private parseWomaSymbol(): void {
    switch (this.currentSymbol.opType) {
      case OpType.Lit: {
        if (this.currentSymbol.dataType === undefined) {
          throw new Error(this.genErrorMessage('missing type'))
        }
        // this.ts.push(this.currentSymbol.dataType);
        this.ast.push(this.currentSymbol);
        break;
      }
      case OpType.Word: {
        // this.handleWordType();
        switch (this.currentSymbol.op) {
          default: {
            this.ast.push(this.currentSymbol);
          }
        }
        break;
      }
      case OpType.Flow: {
        switch (this.currentSymbol.op) {
          case Op.Loop: {
            this.currentSymbol.value = this.pc;
            this.rs.push({
              pc: this.pc,
              rws: this.currentSymbol,
            });
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.For: {
            const rtn = this.rs.pop();
            if (rtn === undefined || rtn.rws.op !== Op.Loop) {
              throw new Error(this.genErrorMessage('Do must be used within a loop'));
            }
            this.rs.push({
              rws: this.currentSymbol,
              pc: this.pc,
            });
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.If: {
            this.rs.push({
              rws: this.currentSymbol,
              pc: this.pc,
            });
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.End: {
            const rtn = this.rs.pop();
            if (rtn === undefined) {
              throw new Error(this.genErrorMessage('Nothing to end'));
            }
            if (rtn.rws.op !== Op.If) {
              this.currentSymbol.value = rtn.pc;
            }
            rtn.rws.value = this.pc;
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.Leave: {
            let i = this.rs.length - 1;
            let x: ReturnStackItem = this.rs[i];
            while (![Op.For].includes(x.rws.op) && i > -1) {
              x = this.rs[i];
              i -= 1;
            }
            if (i === -2) {
              throw new Error('Could not find outer loop');
            }
            this.currentSymbol.value = x.pc;
            this.ast.push(this.currentSymbol);
            break;
          }
        }
      }
    }
    this.currentSymbol = this.lexer.nextSymbol();
    this.pc = this.ast.length;
  }

  private handleWordType(): void {
    const wordType = this.currentSymbol.wordType;
    if (!wordType) {
      throw new Error(this.genErrorMessage('word is missing type'))
    }
    if (wordType.input.length) {
      while (wordType.input.length > 0) {
        const idt = wordType.input.pop();
        if (idt === undefined) {
          throw new Error(this.genErrorMessage('Something has gone wrong!'));
        }
        const a = this.ts.pop()
        if (a === undefined) {
          throw new Error(this.genErrorMessage('Stack underflow!'));
        }
        if (a !== idt && idt !== DataType.any) {
          throw new Error(this.genErrorMessage(`Expected input: ${DataType[a]}, got: ${DataType[idt]}`));
        } 
      }
    }

    if (wordType.output.length) {
      for (const odt of wordType.output) {
        this.ts.push(odt);
      }
    }
  }

  private checkStackIsEmpty(): void {
    if (this.ts.length) {
      const a = this.ts.map((el) => DataType[el]).join(', ')
      throw new Error(this.genErrorMessage(`Program terminates with items still on stack.\nStack: [${a}]`));
    }
  }

}

export {
  Parser
}
