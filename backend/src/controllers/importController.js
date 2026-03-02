const pool = require("../config/db");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const XLSX = require("xlsx");

// --- Multer: accept any file, detect internally ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, _file, cb) => cb(null, true),
});

exports.uploadMiddleware = upload.single("file");

// ======================================================================
// DATE PARSING
// ======================================================================
const MONTH_MAP = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
  january:0, february:1, march:2, april:3, june:5,
  july:6, august:7, september:8, october:9, november:10, december:11,
};

function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2]-1, +m[1]));
    return isNaN(d) ? null : d.toISOString().slice(0,10);
  }

  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
    return isNaN(d) ? null : d.toISOString().slice(0,10);
  }

  // DD/MM/YY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const yr = +m[3] < 50 ? 2000 + +m[3] : 1900 + +m[3];
    const d = new Date(Date.UTC(yr, +m[2]-1, +m[1]));
    return isNaN(d) ? null : d.toISOString().slice(0,10);
  }

  // MMM DD, YYYY  (e.g. "Feb 28, 2026" or "February 28, 2026")
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = MONTH_MAP[m[1].toLowerCase()];
    if (mo !== undefined) {
      const d = new Date(Date.UTC(+m[3], mo, +m[2]));
      return isNaN(d) ? null : d.toISOString().slice(0,10);
    }
  }

  // DD MMM YYYY  (e.g. "28 Feb 2026" or "28 February 2026")
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase()];
    if (mo !== undefined) {
      const d = new Date(Date.UTC(+m[3], mo, +m[1]));
      return isNaN(d) ? null : d.toISOString().slice(0,10);
    }
  }

  // DD-MMM-YYYY  (e.g. "28-Feb-2026" or "28-February-2026")
  m = s.match(/^(\d{1,2})-([A-Za-z]{3,9})-(\d{4})$/);
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase()];
    if (mo !== undefined) {
      const d = new Date(Date.UTC(+m[3], mo, +m[1]));
      return isNaN(d) ? null : d.toISOString().slice(0,10);
    }
  }

  // MMM-DD-YYYY or MMM DD YYYY (with full month support)
  m = s.match(/^([A-Za-z]{3,9})[\s\-](\d{1,2})[\s\-,]*(\d{4})$/);
  if (m) {
    const mo = MONTH_MAP[m[1].toLowerCase()];
    if (mo !== undefined) {
      const d = new Date(Date.UTC(+m[3], mo, +m[2]));
      return isNaN(d) ? null : d.toISOString().slice(0,10);
    }
  }

  return null;
}

// ======================================================================
// AMOUNT HELPERS
// ======================================================================
const AMOUNT_RE = /[₹$£€]?\s*[\d,]+(?:\.\d{1,2})?/g;
const DR_KEYWORDS = /\b(DR|DEBIT|debit|dr|withdrawal|withdrawl|paid|sent|debited)\b/i;
const CR_KEYWORDS = /\b(CR|CREDIT|credit|cr|deposit|received|credited)\b/i;

function parseAmount(s) {
  if (!s) return 0;
  return parseFloat(s.replace(/[₹$£€,\s]/g, "")) || 0;
}

// ======================================================================
// AUTO CATEGORISATION
// ======================================================================
const CATEGORY_RULES = [
  // Income first — catches "received", "salary", "refund"
  { cat: "Income",        re: /\b(received|salary|sal|wages|refund|cashback|reward|credit\s*from|interest\s*credit|dividend)\b/i },
  // Transfer
  { cat: "Transfer",      re: /\b(transfer|trf|imps|neft|rtgs|upi\s*transfer|send\s*money|p2p|web\s*upi|upi)\b/i },
  // EMI / Loan
  { cat: "EMI",           re: /\b(emi|loan|lending|bajaj|hdfc\s*loan|icici\s*loan|equitas|credit\s*card\s*bill|cc\s*bill|kotak\s*emi)\b/i },
  // Bills / Utilities
  { cat: "Bills",         re: /\b(electricity|water|gas|bill|bsnl|airtel|jio|vodafone|vi\b|recharge|broadband|internet|wifi|postpaid|prepaid|bescom|msedcl|tpddl|bescom|dth|tata\s*sky|dish\s*tv|sun\s*direct)\b/i },
  // Investment / Savings
  { cat: "Investment",    re: /\b(mutual\s*fund|mf|sip|zerodha|groww|kite|smallcase|nps|ppf|fd|fixed\s*deposit|stock|share|coin|demat|upstox|investing|investment)\b/i },
  // Insurance
  { cat: "Insurance",     re: /\b(insurance|lic|policy|premium|mediclaim|health\s*ins|motor\s*ins|life\s*ins|star\s*health|hdfc\s*life|max\s*life)\b/i },
  // Education
  { cat: "Education",     re: /\b(school|college|university|tuition|course|udemy|coursera|byju|unacademy|vedantu|fee|admission|exam|coaching)\b/i },
  // Health / Medical
  { cat: "Health",        re: /\b(hospital|clinic|doctor|pharmacy|medical|medicine|health|apollo|medplus|1mg|netmeds|lab|diagnostic|dental|spa|salon|saloon|beauty|wellness)\b/i },
  // Entertainment / OTT
  { cat: "Entertainment", re: /\b(netflix|amazon\s*prime|hotstar|disney|zee5|sonyliv|swiggy|zomato|bms|bookmyshow|inox|pvr|spotify|youtube\s*premium|gaming|google\s*play|apple\s*music|google\b|play\s*store)\b/i },
  // Transport
  { cat: "Transport",     re: /\b(uber|ola|rapido|metro|bus|train|flight|irctc|makemytrip|goibibo|yatra|petrol|diesel|fuel|parking|toll|fastag|cab|auto|rickshaw|porter|dunzo)\b/i },
  // Food & Dining
  { cat: "Food",          re: /\b(restaurant|cafe|coffee|food|eat|lunch|dinner|breakfast|swiggy|zomato|hotel|dhaba|bakery|pizza|burger|biryani|domino|kfc|mcdonalds|subway|starbucks|chai|juice|canteen|tiffin|snack|mart|grocery|supermarket|bigbasket|blinkit|zepto|dmart|reliance\s*fresh|more\s*retail|spencer|nature\s*basket)\b/i },
  // Shopping
  { cat: "Shopping",      re: /\b(amazon|flipkart|myntra|meesho|ajio|nykaa|snapdeal|shopsy|tatacliq|ikea|decathlon|reliance\s*digital|croma|mall|store|shop|purchase|order|delivery|courier|dunzo|zepto|blinkit)\b/i },
];

function classifyCategory(title, type) {
  if (!title) return type === "income" ? "Income" : "Other";
  if (type === "income") {
    // If it looks like received money, mark as Income
    if (/\b(received|salary|refund|cashback|reward|interest|dividend)\b/i.test(title)) return "Income";
  }
  const lower = title.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(lower)) return rule.cat;
  }
  return type === "income" ? "Income" : "Other";
}

// Pick best amount: prefer ₹-prefixed, then decimal, then any
function extractBestAmount(amounts) {
  if (!amounts || !amounts.length) return null;
  const withSymbol = amounts.filter((a) => /[₹$£€]/.test(a));
  if (withSymbol.length) return withSymbol[withSymbol.length - 1];
  const withDecimal = amounts.filter((a) => /\.\d{1,2}$/.test(a));
  if (withDecimal.length) return withDecimal[withDecimal.length - 1];
  // Only use bare integers if they look like money (≤8 digits, no UTR/ref-length numbers)
  const moneyLike = amounts.filter((a) => {
    const clean = a.replace(/[,\s]/g, "");
    return clean.length <= 8;
  });
  return moneyLike.length ? moneyLike[moneyLike.length - 1] : null;
}

function normaliseTransaction(date, desc, amtStr, typeHint) {
  const amt = parseAmount(amtStr);
  if (!date || !amt || amt > 10_000_000) return null; // filter absurd amounts (UTR numbers)
  let type = "expense";
  if (typeHint) {
    if (CR_KEYWORDS.test(typeHint)) type = "income";
  } else if (CR_KEYWORDS.test(desc)) {
    type = "income";
  }
  const title = desc.trim();
  return { date, title, amount: amt, type, category: classifyCategory(title, type) };
}

// ======================================================================
// DESCRIPTION CLEANER
// ======================================================================
function cleanDesc(raw) {
  return raw
    .replace(/\b(Transaction\s*ID|UTR\s*No\.?|Paid\s*by|Ref\s*No\.?|Reference\s*No\.?)\s*[:\-]?\s*[\w\d]+/gi, "")
    .replace(/\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?/gi, "")
    .replace(/[₹$£€]\s*[\d,]+(?:\.\d{1,2})?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ======================================================================
// STRATEGY 1 — LINE-START DATE (HDFC, SBI, ICICI, Axis)
// Date appears at start of each transaction line
// ======================================================================
function strategyLineStart(text) {
  const DATE_SOL = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}[\s\-]\d{1,2}[\s\-,]*\d{4}|\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-]\d{4})/;;
  const results = [];
  for (const line of text.split("\n")) {
    const m = line.match(DATE_SOL);
    if (!m) continue;
    const date = parseDate(m[1]);
    if (!date) continue;
    const rest = line.slice(m[0].length).trim();
    const amounts = rest.match(AMOUNT_RE) || [];
    const amtStr = extractBestAmount(amounts);
    if (!amtStr) continue;
    const desc = cleanDesc(rest.replace(amtStr, ""));
    const typeHint = rest;
    const tx = normaliseTransaction(date, desc, amtStr, typeHint);
    if (tx) results.push(tx);
  }
  return results;
}

// ======================================================================
// STRATEGY 2 — BLOCK/DATE-ON-OWN-LINE (PhonePe, GPay, Paytm UPI)
// Date appears on its own line; description and amount follow
// ======================================================================
function strategyBlockDate(text) {
  // Match a standalone date line
  const DATE_LINE = /^[\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-]\d{4})[\s]*$/;;
  const lines = text.split("\n");
  const results = [];
  let i = 0;
  while (i < lines.length) {
    const dateLine = lines[i].trim();
    const mDate = dateLine.match(DATE_LINE);
    if (mDate) {
      const date = parseDate(mDate[1]);
      if (date) {
        // Collect next 1-5 lines as the block
        const block = [];
        for (let j = i+1; j < Math.min(i+6, lines.length); j++) {
          if (lines[j].trim().match(DATE_LINE)) break;
          block.push(lines[j]);
        }
        const blockText = block.join(" ");
        const amounts = blockText.match(AMOUNT_RE) || [];
        const amtStr = extractBestAmount(amounts);
        if (amtStr) {
          const desc = cleanDesc(blockText.replace(amtStr, ""));
          const tx = normaliseTransaction(date, desc, amtStr, blockText);
          if (tx) results.push(tx);
        }
        i++;
        continue;
      }
    }
    i++;
  }
  return results;
}

// ======================================================================
// STRATEGY 3 — GLOBAL SCAN (universal fallback)
// Scan entire text for date occurrences and grab adjacent amounts
// ======================================================================
function strategyGlobalScan(text) {
  const DATE_PATTERNS = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    /\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/g,
    /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/g,
    /\b(\d{1,2}-[A-Za-z]{3,9}-\d{4})\b/g,
  ];
  const hits = [];
  for (const re of DATE_PATTERNS) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const date = parseDate(m[1]);
      if (date) hits.push({ pos: m.index, end: m.index + m[0].length, date });
    }
  }
  hits.sort((a,b) => a.pos - b.pos);

  const results = [];
  const seen = new Set();
  for (let idx = 0; idx < hits.length; idx++) {
    const { pos, end, date } = hits[idx];
    const nextPos = idx + 1 < hits.length ? hits[idx+1].pos : text.length;
    const snippet = text.slice(end, Math.min(end + 300, nextPos));
    const amounts = snippet.match(AMOUNT_RE) || [];
    const amtStr = extractBestAmount(amounts);
    if (!amtStr) continue;
    const desc = cleanDesc(snippet.replace(amtStr, ""));
    const key = `${date}|${parseAmount(amtStr)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const tx = normaliseTransaction(date, desc, amtStr, snippet);
    if (tx) results.push(tx);
  }
  return results;
}

// ======================================================================
// STRATEGY 4 — PHONEPE SPECIFIC
// Format per transaction (each is a block of consecutive lines):
//   Line A: "Feb 28, 2026"                    ← date
//   Line B: "08:27 pm"                        ← time (skip)
//   Line C: "DEBIT₹30Paid to VIZA MART"       ← TYPE + ₹ + AMOUNT + DESC concatenated
//   Line D: "Transaction ID T260..."           ← noise
//   Line E: "UTR No. 482..."                   ← noise
//   Line F: "Paid by" / "Credited to"         ← noise
//   Line G: "XXXXXX6985"                       ← noise
// ======================================================================
function strategyPhonePe(text) {
  const lines = text.split("\n");
  const results = [];

  // Match a PhonePe date line: "Feb 28, 2026" / "Mar 2, 2025" etc.
  const DATE_LINE_RE = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/;
  // Match the combined TYPE₹AMOUNTDescription line
  const TXN_LINE_RE  = /^(DEBIT|CREDIT)[₹\u20b9]([\d,]+(?:\.\d{1,2})?)(.+)$/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const dateMatch = line.match(DATE_LINE_RE);
    if (dateMatch) {
      const mo = MONTH_MAP[dateMatch[1].toLowerCase()];
      if (mo !== undefined) {
        const date = new Date(Date.UTC(+dateMatch[3], mo, +dateMatch[2])).toISOString().slice(0, 10);
        // Next line is time — skip it; look ahead up to 3 lines for the txn line
        let txnLine = null;
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const candidate = lines[j].trim();
          if (TXN_LINE_RE.test(candidate)) { txnLine = candidate; break; }
        }
        if (txnLine) {
          const m = txnLine.match(TXN_LINE_RE);
          const type   = m[1] === "CREDIT" ? "income" : "expense";
          const amount = parseFloat(m[2].replace(/,/g, ""));
          const title  = m[3].trim();
          if (amount > 0) {
            results.push({ date, title, amount, type, category: classifyCategory(title, type) });
          }
        }
      }
    }
    i++;
  }
  return results;
}

// ======================================================================
// PDF PARSER — runs all strategies, picks best
// ======================================================================
async function parsePDF(buffer) {
  let data;
  try {
    data = await pdfParse(buffer);
  } catch (e) {
    throw new Error("Could not read PDF. Make sure it is not password-protected or image-only.");
  }
  const text = data.text;
  if (!text || !text.trim()) {
    throw new Error("This PDF appears to be scanned/image-based. Please export as CSV or Excel from your banking app.");
  }

  // Log first 1000 chars to Railway logs for debugging
  console.log("[PDF DEBUG] Pages:", data.numpages, "Text length:", text.length);
  console.log("[PDF DEBUG] First 1000 chars:", JSON.stringify(text.slice(0, 1000)));

  const s0 = strategyPhonePe(text);
  const s1 = strategyLineStart(text);
  const s2 = strategyBlockDate(text);
  const s3 = strategyGlobalScan(text);
  console.log("[PDF DEBUG] strategy results — phonePe:", s0.length, "lineStart:", s1.length, "blockDate:", s2.length, "globalScan:", s3.length);

  const strategies = [s0, s1, s2, s3];
  strategies.sort((a,b) => b.length - a.length);
  return strategies[0] || [];
}

// ======================================================================
// EXCEL PARSER
// ======================================================================
function parseXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  if (!rows.length) return null;

  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());

  // Try to find date, description, amount columns
  const dateCol = headers.find(h => /date/.test(h));
  const descCol = headers.find(h => /desc|narr|particular|detail|remark/.test(h));
  const amtCol  = headers.find(h => /amount|amt|debit|credit/.test(h));
  const typeCol = headers.find(h => /type|dr.*cr|cr.*dr|debit.*credit/.test(h));
  const debitCol = headers.find(h => /\bdebit\b/.test(h) && h !== amtCol);
  const creditCol = headers.find(h => /\bcredit\b/.test(h) && h !== amtCol);

  const parsed = [];
  for (const row of rows) {
    const rawDate = dateCol ? String(row[Object.keys(row).find(k=>k.toLowerCase().trim()===dateCol)] || "") : "";
    const rawDesc = descCol ? String(row[Object.keys(row).find(k=>k.toLowerCase().trim()===descCol)] || "") : Object.values(row).slice(1,3).join(" ");
    let rawAmt = "";
    let type = "debit";

    if (debitCol && creditCol) {
      const dKey = Object.keys(row).find(k=>k.toLowerCase().trim()===debitCol);
      const cKey = Object.keys(row).find(k=>k.toLowerCase().trim()===creditCol);
      const dVal = parseAmount(String(row[dKey] || ""));
      const cVal = parseAmount(String(row[cKey] || ""));
      if (cVal > 0) { rawAmt = String(cVal); type = "income"; }
      else if (dVal > 0) { rawAmt = String(dVal); type = "expense"; }
    } else if (amtCol) {
      const aKey = Object.keys(row).find(k=>k.toLowerCase().trim()===amtCol);
      rawAmt = String(row[aKey] || "");
      if (typeCol) {
        const tKey = Object.keys(row).find(k=>k.toLowerCase().trim()===typeCol);
        const tv = String(row[tKey] || "");
        type = CR_KEYWORDS.test(tv) ? "income" : "expense";
      }
    }

    const date = parseDate(rawDate);
    const amt  = parseAmount(rawAmt);
    if (!date || !amt) continue;
    parsed.push({ date, title: rawDesc.trim(), amount: amt, type, category: classifyCategory(rawDesc.trim(), type) });
  }
  return parsed.length > 0 ? { parsed, headers: Object.keys(rows[0]) } : null;
}
// ======================================================================
function parseCSVBuffer(buffer) {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return null;

  // Detect delimiter
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const rows = lines.map(l => l.split(delim).map(c => c.replace(/^["']|["']$/g, "").trim()));
  const headers = rows[0].map(h => h.toLowerCase());

  const dateIdx  = headers.findIndex(h => /date/.test(h));
  const descIdx  = headers.findIndex(h => /desc|narr|particular|detail/.test(h));
  const amtIdx   = headers.findIndex(h => /amount|amt/.test(h));
  const typeIdx  = headers.findIndex(h => /type|dr.*cr|cr.*dr/.test(h));
  const debitIdx = headers.findIndex(h => /\bdebit\b/.test(h) && h !== headers[amtIdx]);
  const creditIdx= headers.findIndex(h => /\bcredit\b/.test(h) && h !== headers[amtIdx]);

  const parsed = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = dateIdx >= 0 ? (row[dateIdx] || "") : "";
    const rawDesc = descIdx >= 0 ? (row[descIdx] || "") : row.slice(1,3).join(" ");
    let rawAmt = "";
    let type = "debit";

    if (debitIdx >= 0 && creditIdx >= 0) {
      const dVal = parseAmount(row[debitIdx] || "");
      const cVal = parseAmount(row[creditIdx] || "");
      if (cVal > 0) { rawAmt = String(cVal); type = "income"; }
      else if (dVal > 0) { rawAmt = String(dVal); type = "expense"; }
    } else if (amtIdx >= 0) {
      rawAmt = row[amtIdx] || "";
      if (typeIdx >= 0 && CR_KEYWORDS.test(row[typeIdx] || "")) type = "income";
    }

    const date = parseDate(rawDate);
    const amt  = parseAmount(rawAmt);
    if (!date || !amt) continue;
    parsed.push({ date, title: rawDesc.trim(), amount: amt, type, category: classifyCategory(rawDesc.trim(), type) });
  }
  return parsed.length > 0 ? { parsed, headers: rows[0] } : null;
}

// ======================================================================
// DEBUG ENDPOINT — returns raw extracted text (no auth)
// ======================================================================
exports.debugPDF = async (req, res) => {
  try {
    const buf = req.file && req.file.buffer;
    if (!buf) return res.status(400).json({ message: "No file uploaded" });
    const data = await pdfParse(buf);
    const text = data.text || "";
    // Run all strategies and show counts
    const s0 = strategyPhonePe(text);
    const s1 = strategyLineStart(text);
    const s2 = strategyBlockDate(text);
    const s3 = strategyGlobalScan(text);
    res.json({
      pages: data.numpages,
      textLength: text.length,
      rawText: text.slice(0, 3000),
      strategies: { phonePe: s0.length, lineStart: s1.length, blockDate: s2.length, globalScan: s3.length },
      sample_s0: s0.slice(0, 3),
      sample_s1: s1.slice(0, 3),
      sample_s2: s2.slice(0, 3),
      sample_s3: s3.slice(0, 3),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================================================
// CONTROLLER: PREVIEW
// ======================================================================
exports.previewImport = async (req, res) => {
  try {
    const buf = req.file && req.file.buffer;
    if (!buf) return res.status(400).json({ message: "No file uploaded" });

    const filename = (req.file.originalname || "").toLowerCase();
    const mime     = (req.file.mimetype || "").toLowerCase();

    const isPDF  = mime === "application/pdf" || filename.endsWith(".pdf");
    const isXLSX = filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".ods") || mime.includes("spreadsheetml") || mime.includes("ms-excel");
    const isCSV  = filename.endsWith(".csv") || filename.endsWith(".txt") || mime === "text/csv" || mime === "text/plain";

    // ── PDF ──
    if (isPDF) {
      let txns;
      try { txns = await parsePDF(buf); } catch (e) {
        return res.status(400).json({ message: e.message });
      }
      if (!txns || txns.length === 0) {
        return res.status(400).json({
          message: "No transactions found in this PDF. The file may be scanned or image-based. Try exporting as CSV or Excel from your banking app.",
        });
      }
      return res.json({ bank: "PDF Import", total: txns.length, headers: [], transactions: txns });
    }

    // ── Excel ──
    if (isXLSX) {
      const result = parseXLSX(buf);
      if (!result || !result.parsed.length) {
        return res.status(400).json({ message: "No transactions found in the Excel file. Make sure it contains date, description, and amount columns." });
      }
      return res.json({ bank: "Excel Import", total: result.parsed.length, headers: result.headers, transactions: result.parsed });
    }

    // ── CSV / TXT ──
    if (isCSV) {
      const result = parseCSVBuffer(buf);
      if (!result || !result.parsed.length) {
        return res.status(400).json({ message: "No transactions found. Make sure your CSV has headers like Date, Description, Amount." });
      }
      return res.json({ bank: "CSV Import", total: result.parsed.length, headers: result.headers, transactions: result.parsed });
    }

    // ── Unknown — try PDF then CSV as fallback ──
    try {
      const txns = await parsePDF(buf);
      if (txns && txns.length > 0) {
        return res.json({ bank: "PDF Import", total: txns.length, headers: [], transactions: txns });
      }
    } catch (_) {}

    const csvResult = parseCSVBuffer(buf);
    if (csvResult && csvResult.parsed.length > 0) {
      return res.json({ bank: "CSV Import", total: csvResult.parsed.length, headers: csvResult.headers, transactions: csvResult.parsed });
    }


    return res.status(400).json({ message: "Could not detect file format. Please upload a PDF, Excel (.xlsx), or CSV file." });
  } catch (err) {
    console.error("previewImport error:", err);
    res.status(500).json({ message: "Server error processing file." });
  }
};

// ======================================================================
// CONTROLLER: CONFIRM IMPORT
// ======================================================================
exports.confirmImport = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorised" });

  const { transactions } = req.body;
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ message: "No transactions provided" });
  }

  let inserted = 0;
  let skipped  = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const tx of transactions) {
      const { date, title, description, amount, type, category } = tx;
      const desc = title || description || "";
      if (!date || !amount) { skipped++; continue; }
      await client.query(
        `INSERT INTO transactions (user_id, date, description, amount, type, category)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, date, desc, parseFloat(amount), type || "expense", category || "Uncategorized"]
      );
      inserted++;
    }
    await client.query("COMMIT");
    res.json({ message: `Imported ${inserted} transaction(s).`, inserted, saved: inserted, skipped });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("confirmImport error:", err);
    res.status(500).json({ message: "Database error during import." });
  } finally {
    client.release();
  }
};
exports.uploadMiddleware = upload.single("file");
