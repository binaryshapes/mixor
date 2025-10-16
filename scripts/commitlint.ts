#!/usr/bin/env

const msgFile = Deno.args[0];
if (!msgFile) {
  console.error('Missing argument with the commit message file path.');
  Deno.exit(1);
}

const args = [
  'run',
  '--allow-read',
  '--allow-net',
  '--allow-env',
  '--allow-sys',
  '--allow-run',
  'npm:@commitlint/cli',
  '--edit',
  msgFile,
  '--config',
  './commitlint.config.ts',
];

const cmd = new Deno.Command('deno', { args });
const { code, stdout, stderr } = await cmd.output();

if (stdout.length > 0) {
  console.log(new TextDecoder().decode(stdout));
}
if (stderr.length > 0) {
  console.error(new TextDecoder().decode(stderr));
}

Deno.exit(code);
