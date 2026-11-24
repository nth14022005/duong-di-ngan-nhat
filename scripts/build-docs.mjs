// build-docs.mjs — Sinh phần dữ liệu trong BAOCAO.md từ nguồn dữ liệu thật (js/logic.js)
// Cách chạy: npm run build:docs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { STORES, LANDMARKS, DEFAULT_MAP_VIEW } from "../js/logic.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docPath = join(root, "BAOCAO.md");

// Chế độ in ra màn hình (không ghi file):
//   node scripts/build-docs.mjs --print  → in toàn bộ dữ liệu ứng dụng
//   node scripts/build-docs.mjs --help   → in hướng dẫn
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Sử dụng: node scripts/build-docs.mjs [--print]");
  console.log("  --print : in dữ liệu cửa hàng/địa danh (nguồn js/logic.js) ra stdout, không ghi file");
  process.exit(0);
}

const BEGIN = "<!-- AUTO-GEN:DATA BEGIN (dữ liệu sinh từ js/logic.js, không sửa tay) -->";
const END = "<!-- AUTO-GEN:DATA END -->";

const storeTable = [
  "| STT | Tên cửa hàng | Vĩ độ (lat) | Kinh độ (lng) |",
  "|-----|--------------|-------------|---------------|",
  ...STORES.map((s, i) => `| ${i + 1} | ${s.name} | ${s.lat} | ${s.lng} |`),
].join("\n");

const landmarkList = LANDMARKS.map((l) => `- ${l.name} — (${l.lat}, ${l.lng})`).join("\n");

const generated = [
  BEGIN,
  "",
  `**Số lượng cửa hàng mặc định:** ${STORES.length}`,
  `**Số lượng địa danh gợi ý:** ${LANDMARKS.length}`,
  `**Tọa độ trung tâm bản đồ mặc định:** ${DEFAULT_MAP_VIEW.lat}, ${DEFAULT_MAP_VIEW.lng} (zoom ${DEFAULT_MAP_VIEW.zoom})`,
  "",
  "### Danh sách cửa hàng mặc định",
  "",
  storeTable,
  "",
  "### Gợi ý địa danh nổi tiếng",
  "",
  landmarkList,
  "",
  END,
].join("\n");

// --print: in dữ liệu ra stdout (dùng cho CI/kiểm tra nhanh) rồi thoát, không ghi file
if (args.includes("--print")) {
  console.log(generated);
  process.exit(0);
}

let doc;
try {
  doc = readFileSync(docPath, "utf8");
} catch {
  doc = `# BÁO CÁO ĐỀ TÀI 3\n\n${generated}\n`;
  writeFileSync(docPath, doc, "utf8");
  console.log(`Đã tạo ${docPath} với dữ liệu sinh tự động.`);
  process.exit(0);
}

if (doc.includes(BEGIN) && doc.includes(END)) {
  const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
  doc = doc.replace(re, generated);
  console.log("Đã cập nhật phần dữ liệu sinh tự động trong BAOCAO.md.");
} else {
  doc += `\n\n## Phụ lục: Dữ liệu ứng dụng (sinh tự động)\n\n${generated}\n`;
  console.log("Đã thêm phụ lục dữ liệu sinh tự động vào BAOCAO.md.");
}

writeFileSync(docPath, doc, "utf8");
