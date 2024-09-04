import fs from "node:fs";
import path from "node:path";
import picocolors from "picocolors";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import resolve from "vite-plugin-resolve";

/**
 * @returns {import("vite").Plugin<any>[]}
 */
export function aztec() {
  const aztecJsVersion = resolveAztecJsVersion();
  return [
    {
      name: "vite-plugin-aztec",
      config(config) {
        if (!isSupportedTarget(config.build?.target)) {
          console.log(`Setting build.target to "${MIN_SUPPORTED_TARGET}"`);
          config.build ??= {};
          config.build.target = MIN_SUPPORTED_TARGET;
        }
        if (!isSupportedTarget(config.optimizeDeps?.esbuildOptions?.target)) {
          console.log(
            `Setting optimizeDeps.esbuildOptions.target to "${MIN_SUPPORTED_TARGET}"`,
          );
          config.optimizeDeps ??= {};
          config.optimizeDeps.esbuildOptions ??= {};
          config.optimizeDeps.esbuildOptions.target = MIN_SUPPORTED_TARGET;
        }
      },
    },
    ...(process.env.NODE_ENV === "production"
      ? // TODO: this should be removed once `@aztec/bb.js` is back to normal size again
        resolve({
          "@aztec/bb.js": `export * from "https://unpkg.com/@aztec/bb.js@${aztecJsVersion}/dest/browser/index.js"`,
        })
      : []),
    nodePolyfills({
      include: [
        "fs",
        "buffer",
        "util",
        "crypto",
        "path",
        "stream",
        "events",
        "string_decoder",
      ],
    }),
  ];
}

function resolveAztecJsVersion() {
  /** @type {{ dependencies?: Record<string, string> }} */
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
  );

  /** @type {string | undefined} */
  let aztecJsVersion;
  for (const [name, version] of Object.entries(
    packageJson.dependencies ?? {},
  )) {
    if (!name.startsWith("@aztec/")) {
      continue;
    }
    if (version.startsWith("^")) {
      console.error(
        `${name} is not installed correctly. Please specify the concrete version in order to avoid incompatibilities with other aztec packages.`,
      );
      const correctVersion = version.slice(1);
      console.log(picocolors.bgRed(`- "${name}": "${version}"`));
      console.log(picocolors.bgGreen(`+ "${name}": "${correctVersion}"`));
      throw new Error();
    }
    if (!aztecJsVersion) {
      aztecJsVersion = version;
    } else if (aztecJsVersion !== version) {
      throw new Error(
        `Found incompatible @aztec packages versions: "${aztecJsVersion}" and "${version}"`,
      );
    }
  }
  if (!aztecJsVersion) {
    throw new Error(
      `Please install aztec.js: "npm install @aztec/aztec.js --save-exact"`,
    );
  }
  return aztecJsVersion;
}

const MIN_SUPPORTED_TARGET = "ES2022";
/**
 * @param {string | string[] | undefined | false} rawTarget
 */
function isSupportedTarget(rawTarget) {
  if (typeof rawTarget !== "string") {
    return false;
  }

  const target = rawTarget.toLowerCase();
  if (target === "esnext") {
    return true;
  }

  if (
    !target.startsWith("es") ||
    Number(target.slice(2)) < Number(MIN_SUPPORTED_TARGET.slice(2))
  ) {
    return false;
  }
  return true;
}
