import { open, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const message: string = 'Hello from TS!';

const combine = (a: number, b: number): number => ((a & 0xff) << 8) | (b & 0xff);

const rev = (val: number): string => {
  const a = val & 0xff;
  const b = (val & 0xff00) >> 8;

  return String.fromCharCode(a) + String.fromCharCode(b);
};

type Ctors = {
  copy2ax: (val: number) => string;
  copy2bx: (val: number) => string;
  copy2cx: (val: number) => string;
  copy2sp: () => string;
  biosinterrupt: () => string;
  interruptoff: () => string;
  halt: () => string;
  jmp: () => string;
  padding: (amt: number) => string;
  magic: () => string;
  print: (str: string) => string;
};

const ctors: Ctors = {
  copy2ax: (val) => "\xb8" + rev(val),
  copy2bx: (val) => "\xbb" + rev(val),
  copy2cx: (val) => "\xb9" + rev(val),
  copy2sp: () => "\x89\xc4",
  biosinterrupt: () => "\xcd\x10",
  interruptoff: () => "\xfa",
  halt: () => "\x90\xf4",
  jmp: () => "\xeb\xfc",
  padding: (amt) => "\x90".repeat(amt),
  magic: () => rev(0xaa55),
  print: (str) =>
    (str + '\r\n')
      .split('')
      .map(ch =>
        ctors.copy2ax(combine(0x0e, ch.charCodeAt(0))) +
        ctors.biosinterrupt()
      )
      .join('')
};

const part1 = (msg: string): string =>
  ctors.copy2ax(0xfbff) +
  ctors.copy2sp() +
  ctors.copy2bx(0x0000) +
  ctors.print(msg) +
  ctors.halt() +
  ctors.jmp();

const part2 = (amt: number): string => ctors.padding(amt) + ctors.magic();

const mkos = (msg: string): Buffer => {
  const code = part1(msg);
  const full = code + part2(510 - code.length);

  return Buffer.from(full, 'binary');
};

async function saveToFile(msg: string, filename: string): Promise<boolean> {
  const filepath = join('./build', filename);
  const buf = mkos(msg);
  const fd = await open(filepath, 'w', 0o644);
  await writeFile(fd, buf);
  await fd.close();

  console.log(buf.length, "bytes were written to", filepath)

  return true;
}

(async () => {
  const file: string = process.argv[2] || 'os.bin';

  await saveToFile(message, file);
})();