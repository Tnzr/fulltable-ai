// Demo build: runs the app with no Archie backend. Sign-in/registration are local to the browser
// and every repository reads the in-memory fixtures. Not a security boundary; never deploy it as production.
import { defineConfig, mergeConfig, type Plugin } from "vite";
import { fileURLToPath, URL } from "node:url";
import baseConfig from "./vite.config";

const src = (p: string): string => fileURLToPath(new URL(`./src/${p}`, import.meta.url));
const VIRTUAL = "\0demo-adapter:";

function pascal(entity: string): string {
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

function fixtureConst(entity: string): string {
  return `${entity.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}_FIXTURE`;
}

/** Swaps each Archie repository the composition root builds for the in-memory one, seeded from its fixture. */
function memoryRepositories(): Plugin {
  const adapter = /^\.\.\/infrastructure\/archie\/(\w+)\.adapter$/;
  return {
    name: "fulltable-demo-memory-repositories",
    enforce: "pre",
    resolveId(id, importer) {
      if (!importer?.replace(/\\/g, "/").endsWith("src/app/composition-root.tsx")) return null;
      const m = adapter.exec(id);
      if (m === null || m[1] === "auth") return null;
      return VIRTUAL + m[1];
    },
    load(id) {
      if (!id.startsWith(VIRTUAL)) return null;
      const entity = id.slice(VIRTUAL.length);
      const name = pascal(entity);
      return [
        `import { Memory${name}Repository } from ${JSON.stringify(src(`infrastructure/memory/${entity}.adapter.ts`))};`,
        `import { ${fixtureConst(entity)} as SEED } from ${JSON.stringify(src(`infrastructure/memory/fixtures/${entity}.fixture.ts`))};`,
        `import { MemoryTable } from ${JSON.stringify(src("infrastructure/memory/store.ts"))};`,
        `const table = new MemoryTable(SEED);`,
        `export class Archie${name}Repository extends Memory${name}Repository {`,
        `  constructor(_gql) { super(table); }`,
        `}`,
      ].join("\n");
    },
  };
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [memoryRepositories()],
    resolve: {
      alias: [
        { find: /^@archie\/react-sdk$/, replacement: src("client/demo/react-sdk.tsx") },
        {
          find: /^@archie-real\/react-sdk$/,
          replacement: fileURLToPath(new URL("./node_modules/@archie/react-sdk/dist/index.js", import.meta.url)),
        },
      ],
    },
    define: { "import.meta.env.VITE_FULLTABLE_DEMO": JSON.stringify("1") },
  }),
);
