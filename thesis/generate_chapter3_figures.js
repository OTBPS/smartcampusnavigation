const fs = require("fs");
const path = require("path");
const sharp = require("C:/Users/cnpen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");

const outDir = path.join(__dirname, "assets");
fs.mkdirSync(outDir, { recursive: true });

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgBase(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .bg{fill:#fff}
      .box{fill:#f8fafc;stroke:#334155;stroke-width:2.2}
      .blue{fill:#eaf3ff;stroke:#2563eb}
      .green{fill:#eafaf2;stroke:#15935f}
      .orange{fill:#fff3e3;stroke:#e17b24}
      .purple{fill:#f3ecff;stroke:#7c3fc4}
      .red{fill:#fff1f2;stroke:#e11d48}
      .line{stroke:#475569;stroke-width:3;fill:none;marker-end:url(#arrow)}
      .plain-line{stroke:#475569;stroke-width:2.6;fill:none}
      .text{font-family:"Times New Roman",Arial,sans-serif;fill:#111827}
      .title{font-size:30px;font-weight:700}
      .label{font-size:23px}
      .small{font-size:19px}
      .tiny{font-size:17px}
      .bold{font-weight:700}
    </style>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
      <path d="M0 0 L12 6 L0 12 Z" fill="#475569"/>
    </marker>
  </defs>
  <rect class="bg" width="${width}" height="${height}"/>
  ${body}
</svg>`;
}

function text(x, y, content, cls = "text label", anchor = "middle") {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(content)}</text>`;
}

function rect(x, y, w, h, cls, label, sub = "") {
  const midX = x + w / 2;
  const mainY = y + h / 2 + (sub ? -8 : 8);
  const subY = y + h / 2 + 28;
  return `<rect class="box ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/>
${text(midX, mainY, label, "text label bold")}
${sub ? text(midX, subY, sub, "text small") : ""}`;
}

function line(x1, y1, x2, y2, arrow = true) {
  return `<path class="${arrow ? "line" : "plain-line"}" d="M${x1} ${y1} L${x2} ${y2}"/>`;
}

function poly(points, arrow = true) {
  return `<path class="${arrow ? "line" : "plain-line"}" d="${points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ")}"/>`;
}

function flowNode(x, y, w, h, label, cls = "blue") {
  return rect(x, y, w, h, cls, label);
}

function erTable(x, y, w, h, name, fields) {
  const headerH = 62;
  const fieldStartY = y + headerH + 42;
  const rowGap = Math.min(34, Math.floor((h - headerH - 34) / Math.max(fields.length, 1)));
  const rows = fields.map((field, index) => text(x + 40, fieldStartY + index * rowGap, field, "text small", "start")).join("\n");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#4b5563" stroke-width="3"/>
<line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" stroke="#4b5563" stroke-width="3"/>
${text(x + 40, y + 40, name, "text title", "start")}
${rows}`;
}

function erLine(points, arrow = false) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  return `<path d="${d}" stroke="#374151" stroke-width="2.5" fill="none"${arrow ? " marker-end=\"url(#crow)\"" : ""}/>`;
}

function writeFigure(name, width, height, body) {
  const svg = svgBase(width, height, body);
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(svgPath, svg, "utf8");
  return sharp(Buffer.from(svg)).png().toFile(pngPath).then(info => ({ svgPath, pngPath, info }));
}

async function main() {
  const jobs = [];

  jobs.push(writeFigure("figure-3-1-overall-system-architecture", 1500, 900, `
${rect(120, 90, 1260, 105, "blue", "Presentation Layer", "Thymeleaf / HTML / CSS / Native JavaScript")}
${line(750, 205, 750, 265)}
${rect(120, 280, 1260, 105, "green", "Controller Layer", "Spring MVC Controllers / Unified API Response")}
${line(750, 395, 750, 455)}
${rect(120, 470, 1260, 105, "green", "Service Layer", "POI / Route / Weather / Suggestion / Saved Places / Route History / Intelligent Assistant")}
${poly([[520, 585], [520, 650]])}
${poly([[980, 585], [980, 650]])}
${rect(120, 665, 620, 115, "purple", "Persistence Layer", "MyBatis Mapper / MySQL")}
${rect(820, 665, 560, 115, "orange", "Third-Party Services", "AMap / QWeather API / DeepSeek Proxy")}
${line(740, 722, 820, 722)}
`));

  jobs.push(writeFigure("figure-3-2-system-functional-structure", 1500, 900, `
${rect(500, 70, 500, 85, "green", "Campus Intelligent Navigation System")}
${line(750, 155, 750, 220)}
${line(250, 220, 1250, 220, false)}
${line(250, 220, 250, 280)}
${line(450, 220, 450, 280)}
${line(650, 220, 650, 280)}
${line(850, 220, 850, 280)}
${line(1050, 220, 1050, 280)}
${line(1250, 220, 1250, 280)}
${rect(105, 280, 290, 90, "blue", "POI Retrieval", "Search / Details")}
${rect(305, 430, 290, 90, "green", "Route Planning", "Walking / Cycling")}
${rect(505, 280, 290, 90, "orange", "Weather & Suggestion", "Weather / Travel Prompt")}
${rect(705, 430, 290, 90, "purple", "Saved Places", "Add / Rename / Delete")}
${rect(905, 280, 290, 90, "purple", "Route History", "Store / Reuse / Delete")}
${rect(1105, 430, 290, 90, "orange", "Intelligent Assistant", "Context / Answer")}
`));

  jobs.push(writeFigure("figure-3-3-poi-query-flowchart", 1500, 900, `
${flowNode(580, 70, 340, 75, "Enter Keyword", "blue")}
${line(750, 145, 750, 205)}
${flowNode(560, 215, 380, 75, "Send POI Request", "green")}
${line(750, 290, 750, 350)}
${flowNode(545, 360, 410, 75, "Query poi Table", "purple")}
${line(750, 435, 750, 495)}
${flowNode(545, 505, 410, 75, "Return POI List", "green")}
${line(750, 580, 750, 640)}
${flowNode(180, 650, 390, 80, "Render Result List", "blue")}
${flowNode(930, 650, 390, 80, "Display Map Markers", "blue")}
${poly([[750, 640], [375, 640], [375, 650]])}
${poly([[750, 640], [1125, 640], [1125, 650]])}
${flowNode(555, 775, 390, 75, "Show No-Result Prompt", "orange")}
${poly([[750, 580], [750, 775]])}
`));

  jobs.push(writeFigure("figure-3-4-route-planning-flowchart", 1500, 900, `
${flowNode(120, 95, 300, 80, "Select Start Point", "blue")}
${line(420, 135, 520, 135)}
${flowNode(520, 95, 300, 80, "Select Waypoint", "blue")}
${line(820, 135, 920, 135)}
${flowNode(920, 95, 330, 80, "Select Destination", "blue")}
${poly([[1085, 175], [1085, 245], [750, 245], [750, 305]])}
${flowNode(560, 315, 380, 80, "Validate Parameters", "orange")}
${line(750, 395, 750, 465)}
${flowNode(535, 475, 430, 80, "Invoke AMap Route Service", "green")}
${line(750, 555, 750, 625)}
${flowNode(550, 635, 400, 80, "Parse Route Result", "green")}
${line(750, 715, 750, 780)}
${flowNode(510, 790, 480, 80, "Render Route on Frontend Map", "blue")}
`));

  jobs.push(writeFigure("figure-3-5-weather-aware-travel-suggestion-flowchart", 1500, 900, `
${flowNode(155, 90, 360, 80, "Request Current Weather", "blue")}
${line(515, 130, 635, 130)}
${flowNode(635, 90, 360, 80, "Call QWeather API", "orange")}
${line(995, 130, 1115, 130)}
${flowNode(1115, 90, 260, 80, "Return Weather", "green")}
${poly([[1245, 170], [1245, 255], [750, 255], [750, 315]])}
${flowNode(540, 325, 420, 80, "Combine Route Context", "purple")}
${line(750, 405, 750, 475)}
${flowNode(520, 485, 460, 80, "Generate Travel Suggestion", "green")}
${line(750, 565, 750, 635)}
${flowNode(505, 645, 490, 80, "Display Weather and Suggestion", "blue")}
`));

  jobs.push(writeFigure("figure-3-6-database-er-diagram", 1700, 1050, `
${erTable(90, 90, 500, 330, "poi", ["id (PK)", "name", "type", "longitude, latitude", "description", "opening_hours, enabled"])}
${erTable(820, 90, 540, 330, "saved_place", ["id (PK)", "poi_id (nullable)", "name, type", "longitude, latitude", "source", "saved_at, updated_at"])}
${erTable(90, 660, 610, 320, "route_history", ["id (PK)", "title, mode", "start_name, start_lng, start_lat", "end_name, end_lng, end_lat", "via_json", "distance, duration"])}
${erTable(1030, 660, 540, 320, "covered_path_node", ["id (PK)", "name", "longitude, latitude", "description", "priority, enabled"])}
${erLine([[590, 255], [820, 255]], false)}
${text(625, 236, "1", "text small bold")}
${text(785, 236, "0..N", "text small bold")}
${text(705, 286, "optional logical reference: saved_place.poi_id", "text tiny")}
${text(395, 620, "Independent route records", "text tiny")}
${text(1300, 620, "Auxiliary table for sheltered path suggestions", "text tiny")}
`));

  const results = await Promise.all(jobs);
  for (const result of results) {
    console.log(`${path.basename(result.pngPath)} ${result.info.width}x${result.info.height} ${result.info.size} bytes`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
