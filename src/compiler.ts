import { createWriteStream, WriteStream } from 'fs';
import { Op, OpType, WomaSymbol } from './symbol';

class Compiler {
  private ast: WomaSymbol[];
  private currentSymbol: WomaSymbol;
  private pc: number;
  private writeStream: WriteStream;

  constructor(ast: WomaSymbol[]) {
    this.writeStream = createWriteStream('./test.S', 'utf-8');
    this.pc = 0;
    this.ast = ast;
    this.currentSymbol = this.ast[this.pc];
    this.writeHead();
    while (this.pc < this.ast.length) {
      this.compile();
    }
    this.writeTail();
  }

  private genErrorMessage(issue: string): string {
    return `Error: ln: ${this.currentSymbol.ln}, col: ${this.currentSymbol.col}, token: ${this.currentSymbol.token}\n Issue: ${issue}`
  }

  private compile(): void {
    const cs = this.currentSymbol;
    this.asma(`; -- ${cs.token} --`);
    switch (cs.opType) {
      case OpType.Lit: {
        switch (cs.op) {
          case Op.Lit: {
            const a = cs.value
            if (a === undefined) {
              throw new Error(this.genErrorMessage('unable to find value for literal'));
            }
            this.asm(`push ${a}`);
            break;
          }
        }
        break;
      }
      case OpType.Word: {
        switch (cs.op) {
          case Op.Sum: {
            this.asm(`pop rax`);
            this.asm(`add [rsp], rax`)
            break;
          }
          case Op.Drop: {
            this.asm(`pop rax`);
            break;
          }
          case Op.Mem: {
            this.asm(`mov rax, mem`);
            this.asm(`push rax`);
            break;
          }
          case Op.Load: {
            this.asm(`pop rax`);
            this.asm(`xor rbx, rbx`);
            this.asm(`mov bl, [rax]`);
            this.asm(`push rbx`);
            break;
          }
          case Op.Store: {
            this.asm(`pop rax`);
            this.asm(`pop rbx`);
            this.asm(`mov [rax], bl`);
            break;
          }
          case Op.SysCall3: {
            this.asm(`pop rax`);
            this.asm(`pop rdi`);
            this.asm(`pop rsi`);
            this.asm(`pop rdx`);
            this.asm(`syscall`);
            break;
          }
          case Op.I: {
            this.asm(`mov rax, [rbp]`);
            this.asm(`push rax`)
            break;
          }
          case Op.DivMod: {
            this.asm(`xor rdx, rdx`);
            this.asm(`pop rbx`);
            this.asm(`pop rax`);
            this.asm(`div rbx`);
            this.asm(`push rax`);
            this.asm(`push rdx`);
            break;
          }
          case Op.Less: {
            this.asm(`pop rbx`);
            this.asm(`pop rcx`);
            this.asm(`xor rax, rax`)
            this.asm(`cmp rcx, rbx`);
            this.asm(`setl al`);
            this.asm(`neg rax`);
            this.asm(`push rax`);
            break;
          }
          case Op.Dup: {
            this.asm(`mov rax, qword [rsp]`);
            this.asm(`push rax`);
            break;
          }
          case Op.Sub: {
            this.asm(`pop rax`);
            this.asm(`sub qword [rsp], rax`);
            break;
          }
        }
        break;
      }
      case OpType.Flow: {
        switch (cs.op) {
          case Op.Loop: {
            this.asma(`tag_${cs.value}:`);
            break;
          }
          case Op.For: {
            this.asm(`pop rax`);
            this.asm(`pop rbx`);
            this.asm(`pushrs rbx`);
            this.asm(`pushrs rax`);
            this.asma(`tag_${this.pc}:`);
            this.asm(`poprs rax`);
            this.asm(`poprs rbx`);
            this.asm(`cmp rax, rbx`);
            this.asm(`je tag_${cs.value}`);
            this.asm(`pushrs rbx`);
            this.asm(`pushrs rax`);
            break;
          }
          case Op.If: {
            this.asm(`pop rax`);
            this.asm(`test rax, rax`);
            this.asm(`jz tag_${cs.value}`);
            break;
          }
          case Op.End: {
            if (cs.value) {
              this.asm(`add qword [rbp], 1`);
              this.asm(`jmp tag_${cs.value}`);
            }
            this.asma(`tag_${this.pc}:`);
            break;
          }
          case Op.Leave: {
            this.asm(`poprs rax`);
            this.asm(`poprs rax`);
            this.asm(`jmp tag_${cs.value}`);
            break;
          }
        }
      }
    }
    this.pc += 1;
    this.currentSymbol = this.ast[this.pc];
  }

  private asm(x: string): void {
    this.writeStream.write(`  ${x}\n`);
  }

  private asma(x: string): void {
    this.writeStream.write(`${x}\n`);
  }

  private writeHead(): void {
    this.asma(`%macro pushrs 1`);
    this.asm(`add rbp, 8`);
    this.asm(`mov [rbp], %1`);
    this.asma(`%endmacro`);
    this.asm(`%macro poprs 1`);
    this.asm(`mov %1, qword [rbp]`);
    this.asm(`sub rbp, 8`);
    this.asm(`%endmacro`);
    this.asm(`global _main`);
    this.asm(`section .text`);
    this.asma(`_main:`);
    this.asm(`mov rbp, return_stack_base - 8`)
  }

  private writeTail(): void {
    this.asm(`mov rax, 0x02000001`);
    this.asm(`mov rdi, 0`);
    this.asm(`syscall`);
    this.asm(`segment .bss`);
    this.asma(`mem: resb 200000`)
    this.asma(`return_stack_base: resq 256`)
  }
}

export {
  Compiler
}