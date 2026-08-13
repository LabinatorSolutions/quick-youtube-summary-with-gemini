// web-ext has no .webextignore support; packaging exclusions live here.
// Applied in addition to web-ext's defaults (.git, node_modules, artifacts).
export default {
  ignoreFiles: [
    '*.md',
    '.github/**',
    'biome.json',
    'bun.lock',
    'bun.lockb',
    'package.json',
    'package-lock.json',
    'web-ext-config.mjs',
  ],
  build: {
    overwriteDest: true,
  },
};
