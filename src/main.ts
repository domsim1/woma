import fs from 'fs/promises';
import { Compiler } from './compiler';
import { Lexer } from './lexer';
import {Parser} from './parser';
import { nasmCompileAndLinkMacOSX } from './tools';

(async () => {
  const code = await fs.readFile('./src/test.w', 'utf-8');
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  new Compiler(parser.getAST());
  await nasmCompileAndLinkMacOSX('test.S');
})()
.catch((err) => {
  console.log(err.message);
});
