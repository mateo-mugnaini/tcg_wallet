import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const distDirectory = resolve(scriptDirectory, "..", "dist");
const indexPath = resolve(distDirectory, "index.html");

if (!existsSync(indexPath)) {
  throw new Error("No existe dist/index.html. Ejecuta pnpm build antes de validar el artefacto.");
}

const indexHtml = readFileSync(indexPath, "utf8");
const assetReferences = [...indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((reference) => !reference.startsWith("http") && !reference.startsWith("data:"));

const missingAssets = assetReferences.filter((reference) => {
  const cleanReference = reference.split("?")[0].split("#")[0].replace(/^\//, "");
  return !existsSync(resolve(distDirectory, cleanReference));
});

if (missingAssets.length > 0) {
  throw new Error(`El build referencia archivos inexistentes: ${missingAssets.join(", ")}`);
}

if (indexHtml.includes("/src/main.jsx")) {
  throw new Error("dist/index.html todavía referencia el código fuente en lugar del bundle generado.");
}

const assetsDescription = assetReferences.length === 0
  ? "sin assets externos"
  : `${assetReferences.length} assets verificados`;
console.log(`Build frontend válido: ${relative(process.cwd(), indexPath)} (${assetsDescription}).`);
