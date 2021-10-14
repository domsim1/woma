import fs from 'fs/promises';
import { Compiler } from './compiler';
import { Lexer } from './lexer';
import {Parser} from './parser';
import { nasmCompileAndLinkLinux } from './tools';

(async () => {
  const code = await fs.readFile('./src/test.w', 'utf-8');
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const compiler = new Compiler(parser.getAST());
  await compiler.writeStreamEnd();
  await nasmCompileAndLinkLinux('test.S');
  console.log('Job Done!');
})()
.catch((err) => {
  console.log(err);
});
