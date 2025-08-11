import { open, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const message = 'Hello from JS!';

const combine = (a, b) => ((a & 0xff) << 8) | (b & 0xff);

const rev = val => {
  const a = val & 0xff;
  const b = (val & 0xff00) >> 8;

  return String.fromCharCode(a) + String.fromCharCode(b);
};

const ctors = {
  copy2ax: val => "\xb8" + rev(val),
  copy2bx: val => "\xbb" + rev(val),
  copy2cx: val => "\xb9" + rev(val),
  copy2sp: () => "\x89\xc4",
  biosinterrupt: () => "\xcd\x10",
  interruptoff: () => "\xfa",
  halt: () => "\x90\xf4",
  jmp: () => "\xeb\xfc",
  padding: amt => "\x90".repeat(amt),
  magic: () => rev(0xaa55),
  print: str =>
    (str + '\r\n')
      .split('')
      .map(ch => ctors.copy2ax(combine(0x0e, ch.charCodeAt(0))) + ctors.biosinterrupt())
      .join('')
};

const part1 = msg =>
  ctors.copy2ax(0xfbff) +
  ctors.copy2sp() +
  ctors.copy2bx(0x0000) +
  ctors.print(msg) +
  ctors.halt() +
  ctors.jmp();

const part2 = amt => ctors.padding(amt) + ctors.magic();

const mkos = msg => {
  const code = part1(msg);

  return code + part2(510 - code.length);
};

async function saveToFile(msg, filename) {
  const filepath = join('./build', filename);
  const buf = mkos(msg);
  const fd = await open(filepath, 'w', 0o644);
  await writeFile(fd, buf, { encoding: 'binary' });
  await fd.close();

  console.log(buf.length, "bytes were written to", filepath)

  return true;
}

(async () => {
  const file = process.argv[2] || 'os.bin';

  await saveToFile(message, file);
})();