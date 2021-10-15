import fs from 'fs/promises';
import { argv } from 'process';
import { Compiler } from './compiler';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { nasmCompileAndLinkLinux } from './tools';

(async () => {
  const file = argv[2];
  const code = await fs.readFile(file, 'utf-8');
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const fileName = file.replace('.w', '');
  const compiler = new Compiler(parser.getAST(), fileName);
  await compiler.writeStreamEnd();
  await nasmCompileAndLinkLinux(fileName);
})()
.catch((err) => {
  console.log(err);
});
