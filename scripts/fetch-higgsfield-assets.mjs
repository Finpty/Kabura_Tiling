/**
 * Downloads the Higgsfield generations listed in
 * `assets-src/higgsfield/manifest.json` into that same folder.
 *
 *   npm run assets:fetch
 *   npm run assets:optimise   # then transcode them into public/media
 *
 * Files that already exist are skipped, so this is safe to re-run.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "assets-src", "higgsfield");
const MANIFEST = path.join(DIR, "manifest.json");

const force = process.argv.includes("--force");

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  console.log(`\nFetching ${manifest.assets.length} Higgsfield assets\n`);

  for (const asset of manifest.assets) {
    const dest = path.join(DIR, asset.file);
    if (existsSync(dest) && !force) {
      skipped += 1;
      console.log(`   skip      ${asset.file}`);
      continue;
    }
    try {
      const res = await fetch(asset.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, buf);
      downloaded += 1;
      console.log(
        `   ok        ${asset.file.padEnd(30)} ${(buf.length / 1048576).toFixed(2)} MB`,
      );
    } catch (error) {
      failures.push({ file: asset.file, message: String(error.message ?? error) });
      console.error(`   FAILED    ${asset.file}  ${error.message ?? error}`);
    }
  }

  console.log(
    `\n   ${downloaded} downloaded, ${skipped} already present, ${failures.length} failed\n`,
  );

  if (failures.length) {
    console.error(
      "Some assets could not be downloaded. Higgsfield result URLs can expire —\n" +
        "re-open the generations in the Higgsfield dashboard and update the URLs in\n" +
        "assets-src/higgsfield/manifest.json, then run this script again.\n",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Next: npm run assets:optimise\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
