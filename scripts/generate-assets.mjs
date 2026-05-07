
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "assets/logo-source/smartbottle-mark.svg");
const OUT = resolve(ROOT, "assets");

const BRAND = "#0EA5E9";

function svgWithPadding(rawMark, size, inset, bg) {
  const innerSize = Math.round(size * (1 - inset * 2));
  const offset = Math.round((size - innerSize) / 2);
  const bgRect = bg
    ? `<rect width="${size}" height="${size}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bgRect}
    <g transform="translate(${offset} ${offset}) scale(${innerSize / 1024})">
      ${rawMark}
    </g>
  </svg>`;
}

async function emit(name, svgString, size) {
  const out = resolve(OUT, name);
  await sharp(Buffer.from(svgString)).resize(size, size).png().toFile(out);
  console.log(`  ${name}  (${size}x${size})`);
}

async function main() {
  const fullSvg = await readFile(SRC, "utf8");
  const innerMark = fullSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  console.log("Generating SmartBottle assets:");

  await emit(
    "icon.png",
    svgWithPadding(innerMark, 1024, 0.12, BRAND),
    1024,
  );

  await emit(
    "splash-icon.png",
    svgWithPadding(innerMark, 1024, 0.18, null),
    1024,
  );

  await emit(
    "notification-icon.png",
    svgWithPadding(innerMark, 96, 0.08, null),
    96,
  );

  await emit(
    "android-icon-foreground.png",
    svgWithPadding(innerMark, 1024, 0.25, null),
    1024,
  );

  await emit(
    "android-icon-background.png",
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <rect width="1024" height="1024" fill="${BRAND}"/>
    </svg>`,
    1024,
  );

  await emit(
    "android-icon-monochrome.png",
    svgWithPadding(innerMark, 1024, 0.25, null),
    1024,
  );

  await emit(
    "favicon.png",
    svgWithPadding(innerMark, 48, 0.08, BRAND),
    48,
  );

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
