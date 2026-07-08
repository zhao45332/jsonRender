const canvas = document.querySelector("#cardCanvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector("#cardForm");
const ideaForm = document.querySelector("#ideaForm");
const message = document.querySelector("#message");
const ideaMessage = document.querySelector("#ideaMessage");
const downloadBtn = document.querySelector("#downloadBtn");
const toolbarInput = document.querySelector("#toolbarItems");
const popoverSelected = document.querySelector("#popoverSelected");
const symbolQuickList = document.querySelector("#symbolQuickList");
const emojiPopover = document.querySelector("#emojiPopover");
const closeEmojiPopoverBtn = document.querySelector("#closeEmojiPopoverBtn");
const emojiPicker = document.querySelector("#emojiPicker");
const customSymbolInput = document.querySelector("#customSymbolInput");
const addCustomSymbolBtn = document.querySelector("#addCustomSymbolBtn");

const API_CARDS_URL = "api/cards";
const API_IDEAS_URL = "api/ideas";
const ISSUE_NEW_URL = "https://github.com/zhao45332/jsonRender/issues/new";
const IS_GITHUB_PAGES = location.hostname.endsWith("github.io");
const CODE_FONT_FAMILY = "Hack, Consolas, 'Courier New', monospace";
const codeFontReady = document.fonts
  ? Promise.all([
      document.fonts.load(`31px ${CODE_FONT_FAMILY}`),
      document.fonts.ready
    ])
  : Promise.resolve();
const DEFAULT_TOOLBAR_ITEMS = ["file", "copy", "folder", "download", "refresh", "braces"];
const TOOLBAR_ICON_LABELS = {
  file: "▯",
  copy: "▣",
  folder: "▰",
  download: "↓",
  refresh: "↻",
  braces: "{}",
  square: "□"
};
const SYMBOL_OPTIONS = ["file", "copy", "folder", "download", "refresh", "braces", "square", "…", "#", "*", "/", "\\", "|", "~", "^", "[]", "<>", "()", "=>", "&&", "||"];
let toolbarPlusBounds = null;

let currentCard = {
  title: "Business Card",
  name: "@fr0gger_",
  phone: "13800000000",
  email: "my@email.com",
  remark: "Malware Therapist",
  toolbarItems: JSON.stringify(DEFAULT_TOOLBAR_ITEMS)
};

for (const [key, value] of Object.entries(currentCard)) {
  if (form.elements[key]) form.elements[key].value = value;
}
downloadBtn.disabled = true;

function parseToolbarItems(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed) && parsed.length) return parsed.map(String).slice(0, 30);
  } catch {
    const fallback = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (fallback.length) return fallback.slice(0, 30);
  }
  return [...DEFAULT_TOOLBAR_ITEMS];
}

function toolbarLabel(item) {
  return TOOLBAR_ICON_LABELS[item] || item;
}

function setToolbarItems(items) {
  const normalized = items.map(String).filter(Boolean).slice(0, 30);
  toolbarInput.value = JSON.stringify(normalized.length ? normalized : DEFAULT_TOOLBAR_ITEMS);
  renderPopoverSelection();
  renderCard(Object.fromEntries(new FormData(form).entries()));
}

function addToolbarItem(item) {
  const items = parseToolbarItems(toolbarInput.value);
  items.push(item);
  setToolbarItems(items);
}

function removeToolbarItem(index) {
  const items = parseToolbarItems(toolbarInput.value);
  items.splice(index, 1);
  setToolbarItems(items);
}

function renderPopoverSelection() {
  const items = parseToolbarItems(toolbarInput.value);
  popoverSelected.innerHTML = "";
  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "symbol-chip";
    button.type = "button";
    button.textContent = toolbarLabel(item);
    button.title = "点击移除";
    button.addEventListener("click", () => removeToolbarItem(index));
    popoverSelected.append(button);
  });
  const plus = document.createElement("span");
  plus.className = "symbol-plus";
  plus.textContent = "+";
  popoverSelected.append(plus);
}

function renderSymbolQuickList() {
  symbolQuickList.innerHTML = "";
  SYMBOL_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.className = "symbol-option";
    button.type = "button";
    button.textContent = toolbarLabel(item);
    button.title = item;
    button.addEventListener("click", () => addToolbarItem(item));
    symbolQuickList.append(button);
  });
}

function openEmojiPopover() {
  emojiPopover.hidden = false;
}

function closeEmojiPopover() {
  emojiPopover.hidden = true;
}

function buildCodeLines(card) {
  const data = {
    name: String(card.name || ""),
    phone: String(card.phone || ""),
    email: String(card.email || ""),
    remark: String(card.remark || "")
  };

  return [
    { number: 1, kind: "comment", text: `# ${card.title || "Business Card"}` },
    ...JSON.stringify(data, null, 2)
      .split("\n")
      .map((text, index) => ({ number: index + 2, kind: "json", text }))
  ];
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundedRect(x, y, width, height, radius, fill) {
  roundedRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundedRect(x, y, width, height, radius, stroke, lineWidth = 1) {
  roundedRect(x, y, width, height, radius);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawIcon(kind, x, y) {
  ctx.save();
  ctx.strokeStyle = "#f3f7f6";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "file") {
    ctx.strokeRect(x, y, 18, 24);
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + 18, y + 6);
    ctx.stroke();
  }
  if (kind === "copy") {
    ctx.strokeRect(x + 6, y + 3, 15, 20);
    ctx.strokeRect(x, y + 8, 13, 17);
  }
  if (kind === "folder") {
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x + 8, y + 9);
    ctx.lineTo(x + 11, y + 4);
    ctx.lineTo(x + 25, y + 4);
    ctx.lineTo(x + 25, y + 25);
    ctx.lineTo(x, y + 25);
    ctx.closePath();
    ctx.stroke();
  }
  if (kind === "download") {
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + 12, y + 20);
    ctx.moveTo(x + 3, y + 12);
    ctx.lineTo(x + 12, y + 21);
    ctx.lineTo(x + 21, y + 12);
    ctx.moveTo(x + 3, y + 27);
    ctx.lineTo(x + 21, y + 27);
    ctx.stroke();
  }
  if (kind === "circle") {
    ctx.beginPath();
    ctx.arc(x + 12, y + 13, 11, -Math.PI * 0.45, Math.PI * 1.2);
    ctx.stroke();
  }
  if (kind === "braces") {
    ctx.font = `30px ${CODE_FONT_FAMILY}`;
    ctx.fillStyle = "#f3f7f6";
    ctx.fillText("{}", x, y + 25);
  }
  if (kind === "square") {
    ctx.strokeRect(x + 2, y + 2, 24, 24);
  }
  ctx.restore();
}

function drawToolbarItem(item, x, y) {
  if (TOOLBAR_ICON_LABELS[item]) {
    const iconKind = item === "refresh" ? "circle" : item;
    drawIcon(iconKind, x, y);
    return item === "braces" ? 48 : 44;
  }

  ctx.save();
  ctx.fillStyle = "#f3f7f6";
  ctx.font = `28px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', ${CODE_FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(item, x, y - 1);
  const width = Math.max(34, ctx.measureText(item).width + 16);
  ctx.restore();
  return width;
}

function drawToolbarItems(items, x, y, maxX) {
  let cursorX = x;
  toolbarPlusBounds = null;
  [...items, "+"].forEach((item) => {
    if (cursorX > maxX - 34) return;
    if (item === "+") {
      toolbarPlusBounds = { x: cursorX - 5, y: y - 5, width: 34, height: 38 };
      ctx.save();
      ctx.fillStyle = "#f3f7f6";
      ctx.font = `30px ${CODE_FONT_FAMILY}`;
      ctx.textBaseline = "top";
      ctx.fillText("+", cursorX, y - 1);
      ctx.restore();
      cursorX += 36;
      return;
    }
    cursorX += drawToolbarItem(item, cursorX, y) + 4;
  });
}

function wrapText(text, maxWidth) {
  const chars = Array.from(String(text));
  const lines = [];
  let line = "";

  for (const char of chars) {
    const trial = line + char;
    if (line && ctx.measureText(trial).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = trial;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function getContinuationIndent(text) {
  const leading = text.match(/^\s*/)?.[0] || "";
  const afterColon = text.match(/^\s*"[^"]+"\s*:\s*/);
  if (afterColon) return " ".repeat(afterColon[0].length);
  return leading;
}

function tokenizeJsonLine(text) {
  const tokens = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === '"') {
      let end = index + 1;
      let escaped = false;
      while (end < text.length) {
        const next = text[end];
        if (next === '"' && !escaped) {
          end += 1;
          break;
        }
        escaped = next === "\\" && !escaped;
        if (next !== "\\") escaped = false;
        end += 1;
      }

      const value = text.slice(index, end);
      const rest = text.slice(end);
      tokens.push({ text: value, color: /^\s*:/.test(rest) ? "#f18e88" : "#fbf2a7" });
      index = end;
      continue;
    }

    if ("{}[]:,".includes(char)) {
      tokens.push({ text: char, color: char === ":" || char === "," ? "#c9d1d0" : "#8f9b9b" });
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < text.length && text[end] !== '"' && !"{}[]:,".includes(text[end])) {
      end += 1;
    }
    tokens.push({ text: text.slice(index, end), color: "#c9d1d0" });
    index = end;
  }

  return tokens;
}

function appendSegment(segments, text, color) {
  const last = segments[segments.length - 1];
  if (last?.color === color) {
    last.text += text;
    return;
  }
  segments.push({ text, color });
}

function wrapTokenSegments(tokens, maxWidth, continuationIndent = "") {
  const lines = [];
  let segments = [];
  let width = 0;
  const indentWidth = ctx.measureText(continuationIndent).width;

  const startContinuationLine = () => {
    segments = [];
    width = 0;
    if (continuationIndent) {
      appendSegment(segments, continuationIndent, "#c9d1d0");
      width = indentWidth;
    }
  };

  tokens.forEach((token) => {
    for (const char of Array.from(token.text)) {
      const charWidth = ctx.measureText(char).width;
      if (segments.length && width + charWidth > maxWidth) {
        lines.push(segments);
        startContinuationLine();
      }
      appendSegment(segments, char, token.color);
      width += charWidth;
    }
  });

  if (segments.length) lines.push(segments);
  return lines.length ? lines : [[{ text: "", color: "#c9d1d0" }]];
}

function fitText(text, maxWidth) {
  const value = String(text);
  if (ctx.measureText(value).width <= maxWidth) return value;

  let fitted = "";
  for (const char of Array.from(value)) {
    const trial = `${fitted}${char}`;
    if (ctx.measureText(`${trial}...`).width > maxWidth) break;
    fitted = trial;
  }
  return `${fitted}...`;
}

function measureLayout(card) {
  const metrics = {
    margin: 16,
    width: 900,
    titleH: 76,
    toolH: 62,
    contentPadTop: 34,
    contentPadBottom: 34,
    rowGap: 14,
    lineHeight: 38,
    codeFont: `31px ${CODE_FONT_FAMILY}`,
    titleFont: "700 31px Inter, 'Segoe UI', Arial",
    monoTitleFont: `700 30px ${CODE_FONT_FAMILY}`
  };
  metrics.cardX = metrics.margin;
  metrics.cardY = metrics.margin;
  metrics.cardW = metrics.width - metrics.margin * 2;
  metrics.lineX = metrics.cardX + 32;
  metrics.codeX = metrics.cardX + 88;
  ctx.font = metrics.codeFont;
  metrics.maxCodeW = metrics.cardX + metrics.cardW - metrics.codeX - 34;

  const rows = buildCodeLines(card).map((row) => {
    const oldFont = ctx.font;
    ctx.font = row.kind === "comment" ? metrics.monoTitleFont : metrics.codeFont;
    const tokens = row.kind === "comment"
      ? [{ text: row.text, color: "#f4f7f6" }]
      : tokenizeJsonLine(row.text);
    const segmentLines = wrapTokenSegments(tokens, metrics.maxCodeW, getContinuationIndent(row.text));
    ctx.font = oldFont;
    return { ...row, visualLines: segmentLines.length, segmentLines };
  });

  const contentH = rows.reduce((total, row) => {
    return total + row.visualLines * metrics.lineHeight + metrics.rowGap;
  }, metrics.contentPadTop + metrics.contentPadBottom - metrics.rowGap);

  metrics.cardH = metrics.titleH + metrics.toolH + contentH;
  metrics.height = Math.ceil(metrics.cardH + metrics.margin * 2);
  return { metrics, rows };
}

function drawEditor(card) {
  const { metrics: m, rows } = measureLayout(card);
  canvas.width = m.width;
  canvas.height = m.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  fillRoundedRect(m.cardX, m.cardY, m.cardW, m.cardH, 22, "#111718");
  ctx.shadowColor = "transparent";
  strokeRoundedRect(m.cardX, m.cardY, m.cardW, m.cardH, 22, "rgba(255, 255, 255, 0.25)", 1.2);

  ctx.save();
  roundedRect(m.cardX, m.cardY, m.cardW, m.cardH, 22);
  ctx.clip();
  ctx.fillStyle = "#151b1d";
  ctx.fillRect(m.cardX, m.cardY, m.cardW, m.titleH);
  ctx.fillStyle = "#111718";
  ctx.fillRect(m.cardX, m.cardY + m.titleH, m.cardW, m.toolH);
  ctx.fillStyle = "#061010";
  ctx.fillRect(m.cardX, m.cardY + m.titleH + m.toolH, m.cardW, m.cardH - m.titleH - m.toolH);
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(m.cardX, m.cardY + m.titleH);
  ctx.lineTo(m.cardX + m.cardW, m.cardY + m.titleH);
  ctx.moveTo(m.cardX, m.cardY + m.titleH + m.toolH);
  ctx.lineTo(m.cardX + m.cardW, m.cardY + m.titleH + m.toolH);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const dots = [
    ["#ff4d3f", m.cardX + 30],
    ["#f5b735", m.cardX + 58],
    ["#8ac936", m.cardX + 86]
  ];
  dots.forEach(([color, cx]) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(cx, m.cardY + 38, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  const titleText = `${card.title || "Business Card"}.json`;
  ctx.fillStyle = "#f4f7f6";
  ctx.font = m.titleFont;
  ctx.textAlign = "center";
  ctx.fillText(fitText(titleText, m.cardW - 260), m.cardX + m.cardW / 2, m.cardY + 50);
  ctx.textAlign = "left";
  ctx.font = "700 28px Inter, 'Segoe UI', Arial";
  ctx.fillText("...", m.cardX + m.cardW - 42, m.cardY + 48);

  const iconY = m.cardY + m.titleH + 18;
  drawToolbarItems(parseToolbarItems(card.toolbarItems), m.cardX + 18, iconY, m.cardX + m.cardW - 132);
  drawIcon("square", m.cardX + m.cardW - 72, iconY);
  ctx.font = "700 25px Inter, 'Segoe UI', Arial";
  ctx.fillText("...", m.cardX + m.cardW - 36, m.cardY + m.titleH + 42);

  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  ctx.fillRect(m.cardX + 64, m.cardY + m.titleH + m.toolH, 2, m.cardH - m.titleH - m.toolH);

  let y = m.cardY + m.titleH + m.toolH + m.contentPadTop;
  ctx.font = m.codeFont;
  ctx.textBaseline = "top";

  rows.forEach((row) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillText(String(row.number), m.lineX, y);

    drawCodeRow(row, m.codeX, y, m);

    y += row.visualLines * m.lineHeight + m.rowGap;
  });

  ctx.textBaseline = "alphabetic";
}

function drawCodeRow(row, x, y, metrics) {
  const originalFont = ctx.font;
  ctx.font = row.kind === "comment" ? metrics.monoTitleFont : metrics.codeFont;

  row.segmentLines.forEach((segments, index) => {
    let cursorX = x;
    const lineY = y + index * metrics.lineHeight;

    segments.forEach((segment) => {
      ctx.fillStyle = segment.color;
      ctx.fillText(segment.text, cursorX, lineY);
      cursorX += ctx.measureText(segment.text).width;
    });
  });

  ctx.font = originalFont;
}

function renderCard(card = currentCard) {
  currentCard = { ...currentCard, ...card };
  drawEditor(currentCard);
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#f08b86" : "#96a09f";
}

function setIdeaMessage(text, isError = false) {
  ideaMessage.textContent = text;
  ideaMessage.style.color = isError ? "#f08b86" : "#96a09f";
}

async function saveCurrentCard() {
  const payload = Object.fromEntries(new FormData(form).entries());
  setMessage("正在保存...");

  let response;
  try {
    response = await fetch(API_CARDS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    renderCard(payload);
    setMessage("静态部署模式：无法保存到 db，但可以下载 PNG。");
    return payload;
  }

  if (response.status === 404) {
    renderCard(payload);
    setMessage("静态部署模式：无法保存到 db，但可以下载 PNG。");
    return payload;
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const firstError = result.errors ? Object.values(result.errors)[0] : result.message;
    setMessage(firstError || "保存失败", true);
    throw new Error(firstError || "保存失败");
  }

  renderCard(result.card);
  setMessage("已保存到 data/db.json，正在下载 PNG。");
  return result.card;
}

function downloadPng() {
  const payload = Object.fromEntries(new FormData(form).entries());
  renderCard(payload);
  const link = document.createElement("a");
  link.download = `${(currentCard.title || "business-card").replace(/[^\w-]+/g, "-")}-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  if (IS_GITHUB_PAGES) {
    setMessage("PNG 已下载。静态站点不会保存到 db。");
    return;
  }

  saveCurrentCard()
    .then(() => setMessage("PNG 已下载，并已保存到 data/db.json。"))
    .catch((error) => setMessage(`PNG 已下载，但保存失败：${error.message}`, true));
}

async function submitIdea(event) {
  event.preventDefault();
  const ideaText = new FormData(ideaForm).get("ideaText");
  if (!String(ideaText || "").trim()) {
    setIdeaMessage("请输入建议内容", true);
    return;
  }

  if (IS_GITHUB_PAGES) {
    const issueUrl = new URL(ISSUE_NEW_URL);
    issueUrl.searchParams.set("title", "用户创意建议");
    issueUrl.searchParams.set("body", String(ideaText).trim());
    window.open(issueUrl.toString(), "_blank", "noopener,noreferrer");
    setIdeaMessage("已打开 GitHub Issue 页面，请在那里提交建议。");
    return;
  }

  setIdeaMessage("正在提交...");

  let response;
  try {
    response = await fetch(API_IDEAS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ideaText })
    });
  } catch {
    setIdeaMessage("静态部署模式暂不支持保存建议。", true);
    return;
  }

  if (response.status === 404) {
    setIdeaMessage("静态部署模式暂不支持保存建议。", true);
    return;
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    setIdeaMessage(result.message || "提交失败", true);
    return;
  }

  ideaForm.reset();
  setIdeaMessage("建议已保存，谢谢。");
}

form.addEventListener("submit", (event) => event.preventDefault());
ideaForm.addEventListener("submit", submitIdea);
downloadBtn.addEventListener("click", downloadPng);
canvas.addEventListener("click", (event) => {
  if (!toolbarPlusBounds) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const hit = x >= toolbarPlusBounds.x
    && x <= toolbarPlusBounds.x + toolbarPlusBounds.width
    && y >= toolbarPlusBounds.y
    && y <= toolbarPlusBounds.y + toolbarPlusBounds.height;
  if (hit) openEmojiPopover();
});
closeEmojiPopoverBtn.addEventListener("click", closeEmojiPopover);
emojiPicker.addEventListener("emoji-click", (event) => {
  const emoji = event.detail?.unicode;
  if (emoji) addToolbarItem(emoji);
});
document.addEventListener("click", (event) => {
  if (emojiPopover.hidden) return;
  if (emojiPopover.contains(event.target) || event.target === canvas) return;
  closeEmojiPopover();
});
addCustomSymbolBtn.addEventListener("click", () => {
  const value = customSymbolInput.value.trim();
  if (!value) return;
  addToolbarItem(value);
  customSymbolInput.value = "";
});
customSymbolInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomSymbolBtn.click();
  }
});

for (const input of form.elements) {
  if (input.name) {
    input.addEventListener("input", () => {
      renderCard(Object.fromEntries(new FormData(form).entries()));
    });
  }
}

renderSymbolQuickList();
renderPopoverSelection();
if (new URLSearchParams(window.location.search).get("idea") === "saved") {
  setIdeaMessage("建议已保存，谢谢。");
  history.replaceState(null, "", window.location.pathname);
}
renderCard(currentCard);
codeFontReady.finally(() => {
  downloadBtn.disabled = false;
  renderCard(currentCard);
});
