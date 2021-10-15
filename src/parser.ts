import { Lexer } from "./lexer";
import { DataType, Op, OpType, WomaSymbol, WordType } from "./symbol";

interface ReturnStackItem {
  pc: number;
  rws: WomaSymbol
}

interface DictionaryItem {
  pc: number;
  type: WordType;
}

class Parser {
  private ast: WomaSymbol[];
  private rs: ReturnStackItem[];
  private pc: number;
  private ts: DataType[];
  private lexer: Lexer;
  private currentSymbol: WomaSymbol;
  private dictionary: Map<string, DictionaryItem>;
  private currentDefinitionToken?: string;
  private tsSnapshots: DataType[][];

  constructor(lexer: Lexer) {
    this.ast = [];
    this.rs = [];
    this.pc = 0;
    this.ts = [];
    this.lexer = lexer;
    this.currentSymbol = this.lexer.nextSymbol();
    this.dictionary = new Map();
    this.tsSnapshots = [];
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
    // console.log('stack: ', this.ts.map((x) => DataType[x]));
    // console.log('symbol: ', this.currentSymbol.token);
    switch (this.currentSymbol.opType) {
      case OpType.Lit: {
        if (this.currentSymbol.dataType === undefined) {
          throw new Error(this.genErrorMessage('missing type'))
        }
        if (this.currentSymbol.dataType === DataType.string) {
          this.ts.push(DataType.int);
          this.ts.push(DataType.ptr);
          this.ast.push(this.currentSymbol);
          break;
        }
        this.ts.push(this.currentSymbol.dataType);
        this.ast.push(this.currentSymbol);
        break;
      }
      case OpType.UserDefinedWord: {
        const word = this.dictionary.get(this.currentSymbol.token);
        if (word === undefined) {
          throw new Error(this.genErrorMessage('could not find defined word with matching name'));
        }
        this.currentSymbol.value = word.pc;
        this.currentSymbol.wordType = [word.type]; 
        this.handleWordType();
        this.ast.push(this.currentSymbol);
        break;
      }
      case OpType.Word: {
        this.handleWordType();
        switch (this.currentSymbol.op) {
          case Op.I: {
            let i = this.rs.length - 1;
            if (i < 0) {
              throw new Error(this.genErrorMessage('The word "i" must be used within a loop'));
            }
            let x: ReturnStackItem = this.rs[i];
            while (![Op.For].includes(x.rws.op) && i > -1) {
              x = this.rs[i];
              i -= 1;
            }
            if (i === -2) {
              throw new Error(this.genErrorMessage('The word "i" must be used within a loop'));
            }
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.Def: {
            this.rs.push({
              pc: this.pc,
              rws: this.currentSymbol
            });
            const def = this.currentSymbol;
            this.currentSymbol = this.lexer.nextSymbol();
            if (this.currentSymbol.opType !== OpType.UserDefinedWord) {
              throw new Error(this.genErrorMessage('Expected definition name'));
            }
            const token = this.currentSymbol.token;
            if (this.dictionary.has(token)) {
              throw new Error(this.genErrorMessage('Word is already defined'));
            }
            this.tsSnapshots.push([...this.ts]);
            this.tsSnapshots.push([...this.ts]);
            this.currentSymbol = this.lexer.nextSymbol();
            if (this.currentSymbol.op !== Op.TypeStart) {
              throw new Error(this.genErrorMessage('Expected type start "("'));
            }
            const wordType: WordType = {
              input: [],
              output: [],
            };
            this.currentSymbol = this.lexer.nextSymbol();
            while (this.currentSymbol.op === Op.Type) {
              const dataType = this.currentSymbol.dataType;
              if (dataType === undefined) {
                throw new Error(this.genErrorMessage('Type is missing metadata'));
              }
              wordType.input.push(dataType);
              this.ts.push(dataType);
              this.currentSymbol = this.lexer.nextSymbol();
            }
            if (this.currentSymbol.op !== Op.TypeMid) {
              throw new Error(this.genErrorMessage('Expected "--"'));
            }
            const expectedRturnStack = this.tsSnapshots[this.tsSnapshots.length - 1];
            this.currentSymbol = this.lexer.nextSymbol();
            while (this.currentSymbol.op === Op.Type) {
              const dataType = this.currentSymbol.dataType;
              if (dataType === undefined) {
                throw new Error(this.genErrorMessage('Type is missing metadata'));
              }
              expectedRturnStack.push(dataType);
              wordType.output.push(dataType);
              this.currentSymbol = this.lexer.nextSymbol();
            }
            if (this.currentSymbol.op !== Op.TypeEnd) {
              throw new Error(this.genErrorMessage('Expected type ending: ")"'));
            }
            this.dictionary.set(token, {
              pc: this.pc,
              type: wordType,
            });
            def.value = this.pc;
            this.currentDefinitionToken = token;
            this.ast.push(def);
            break;
          }
          default: {
            this.ast.push(this.currentSymbol);
          }
        }
        break;
      }
      case OpType.Flow: {
        this.handleWordType();
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
            this.tsSnapshots.push([...this.ts]);
            break;
          }
          case Op.If: {
            this.rs.push({
              rws: this.currentSymbol,
              pc: this.pc,
            });
            this.ast.push(this.currentSymbol);
            this.tsSnapshots.push([...this.ts]);
            break;
          }
          case Op.Else: {
            const rtn = this.rs.pop();
            if (rtn === undefined) {
              throw new Error(this.genErrorMessage('Else must be used within if block'));
            }
            rtn.rws.value = this.pc;
            this.rs.push({
              pc: this.pc,
              rws: this.currentSymbol,
            });
            const tsElse = this.tsSnapshots.pop();
            if (tsElse === undefined) {
              throw new Error(this.genErrorMessage('Stack snapshot missing'));
            }
            this.tsSnapshots.push([...this.ts]);
            this.ts = tsElse;
            this.ast.push(this.currentSymbol);
            break;
          }
          case Op.End: {
            const rtn = this.rs.pop();
            if (rtn === undefined) {
              throw new Error(this.genErrorMessage('Nothing to end'));
            }
            const snapshot = this.tsSnapshots.pop();
            if (snapshot === undefined) {
              throw new Error(this.genErrorMessage('cant find stack snapshot'));
            }
            if (rtn.rws.op === Op.Def) {
              if (!this.currentDefinitionToken) {
                throw new Error(this.genErrorMessage('Missing definition scope'));
              }
              if (this.ts.join() !== snapshot.join()) {
                throw new Error(this.genErrorMessage(
                  `returning stack does not match return type\n` +
                  `Got: [ ${this.ts.map((x) => DataType[x]).join(', ')} ]\n` +
                  `Expected: [ ${snapshot.map((x) => DataType[x]).join(', ')} ]`
                ));
              }
              const backupstack = this.tsSnapshots.pop();
              if (backupstack === undefined) {
                throw new Error(`Missing backup stack!`);
              }
              this.ts = backupstack;
              this.currentSymbol = new WomaSymbol('exit', this.currentSymbol.ln, this.currentSymbol.col, false);
              this.currentDefinitionToken = undefined;
              this.ast.push(this.currentSymbol);
              break;
            }
            if (rtn.rws.op !== Op.If && rtn.rws.op !== Op.Else) {
              this.currentSymbol.value = rtn.pc;
            }
            rtn.rws.value = this.pc;
            this.ast.push(this.currentSymbol);
            if (rtn.rws.op === Op.Else) {
              if (this.ts.join('') !== snapshot.join(''))  {
                throw new Error(this.genErrorMessage('If and else must both end with same elements in stack'));
              }
              break;
            }
            if (this.ts.join('') !== snapshot.join(''))  {
              throw new Error(this.genErrorMessage('If must end with same stack size and types that it started with'));
            }
            break;
          }
          case Op.Leave: {
            let i = this.rs.length - 1;
            if (i < 0) {
              throw new Error(this.genErrorMessage('The word "leave" must be used within a loop'));
            }
            let x: ReturnStackItem = this.rs[i];
            while (![Op.For].includes(x.rws.op) && i > -1) {
              x = this.rs[i];
              i -= 1;
            }
            if (i === -2) {
              throw new Error(this.genErrorMessage('The word "leave" must be used within a loop'));
            }

            const snapshot = this.tsSnapshots.pop();
            if (snapshot === undefined) {
              throw new Error(this.genErrorMessage('Missing stack snapshot!'));
            }
            if (snapshot.join() !== this.ts.join()) {
              throw new Error(this.genErrorMessage(
                `returning stack does not match return type\n` +
                `Got: [ ${this.ts.map((x) => DataType[x]).join(', ')} ]\n` +
                `Expected: [ ${snapshot.map((x) => DataType[x]).join(', ')} ]`
              ));
            }
            this.tsSnapshots.push(snapshot);

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
    const currentWordType = this.currentSymbol.wordType;
    if (!currentWordType) {
      throw new Error(this.genErrorMessage('Does not have a word type.'));
    }
    const generics = this.currentSymbol.generic;
    if (generics !== undefined) {
      const genericDictionary: {[key: string]: DataType} = {};
      for (const gkey of [...generics.input].reverse()) {
        const dataType = this.ts.pop();
        if (dataType === undefined) {
          throw new Error(this.genErrorMessage('Stack underflow!'));
        }
        genericDictionary[gkey] = dataType;
      }
      for (const gkey of generics.output) {
        this.ts.push(genericDictionary[gkey]);
      }
      return;
    }
    let typeToCheckLength = 0;
    let matchFound = false;
    let matchingWordType;
    for (const typesToCheck of currentWordType) {
      let idxOfTypeToFind = this.ts.length - 1;
      matchingWordType = typesToCheck;
      typeToCheckLength = typesToCheck.input.length
      if (typeToCheckLength === 0) {
        matchFound = true;
        break;
      }
      
      if (idxOfTypeToFind - (typesToCheck.input.length - 1) < 0) {
        throw new Error('Stack underflow');
      }
      const matchesToMake = typesToCheck.input.length;
      let matchesFound = 0;

      for (const typeToCheck of typesToCheck.input) {
        const typeToFind = this.ts[idxOfTypeToFind-matchesToMake+1];
        // console.log('typeToFind: ', DataType[typeToFind]);
        // console.log('typeToCheck: ', DataType[typeToCheck]);
        if (typeToCheck === typeToFind || typeToCheck === DataType.any) {
          matchesFound += 1;
          idxOfTypeToFind += 1;
        } else {
          break;
        }
      }
      // console.log('--------------------');
      if (matchesFound === matchesToMake) {
        this.ts.length -= typesToCheck.input.length;
        matchFound = true;
        break;
      }
    }
    if (!matchFound || !matchingWordType) {
      const gotTypes = [];
      for (let i = 0; i < typeToCheckLength; i++) {
        gotTypes.push(DataType[this.ts[(this.ts.length-typeToCheckLength) + i]]);
      }
      const expectedTypes: string[] = [];
      for (const wordType of currentWordType) {
        expectedTypes.push(wordType.input.map((dataType) => DataType[dataType]).join(', '));
      }
      throw new Error(this.genErrorMessage(
        `Could not match type:\n` +
        `Got: [ ${gotTypes.join(', ')} ]\n` +
        `Expected: [ ${expectedTypes.join(' | ')} ]`
      ));
    }

    for (const typeToPush of matchingWordType.output) {
      this.ts.push(typeToPush)
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
