import { exec } from 'child_process';

function nasmCompileAndLinkMacOSX (asmFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`nasm -f macho64 ${asmFilePath} && ld ${asmFilePath.replace('.S', '.o')} -lSystem -L$(xcode-select -p)/SDKs/MacOSX.sdk/usr/lib`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
      }
      console.log(stdout);
      resolve();
    });
  });
}

export {
  nasmCompileAndLinkMacOSX
}
