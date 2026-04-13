const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Tesseract = require('tesseract.js');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/receipts'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

function extractAmount(text) {
  let amounts = [];

  // Helper: if number has 4+ digits and no decimal, assume last 2 are cents
  const parseAmount = (raw) => {
    const clean = raw.replace(/,/g, '');
    if (clean.includes('.')) return parseFloat(clean);
    if (clean.length >= 4) return parseInt(clean.slice(0, -2)) + parseInt(clean.slice(-2)) / 100;
    return parseFloat(clean);
  };

  // 1. Look for total/amount lines with dollar values (with or without decimal)
  const totalPatterns = [
    /(?:total|amount|grand\s*total|balance\s*due|net|subtotal|tot)[:\s]*\$?\s*([\d,]+\.?\d*)/gi,
  ];
  for (const p of totalPatterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const val = parseAmount(m[1]);
      if (val > 0 && val < 100000) amounts.push({ val, priority: 3 });
    }
  }

  // 2. Dollar sign followed by numbers (with decimal)
  const dollarDecimal = /\$\s*([\d,]+\.\d{2})/g;
  let m;
  while ((m = dollarDecimal.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (val > 0 && val < 100000) amounts.push({ val, priority: 2 });
  }

  // 3. Dollar sign followed by numbers (no decimal - OCR often drops the dot)
  const dollarNoDec = /\$\s*(\d{2,6})\b/g;
  while ((m = dollarNoDec.exec(text)) !== null) {
    const raw = m[1];
    let val;
    // If 4+ digits with no decimal, assume last 2 are cents (e.g. $8200 = $82.00)
    if (raw.length >= 4) {
      val = parseInt(raw.slice(0, -2)) + parseInt(raw.slice(-2)) / 100;
    } else {
      val = parseFloat(raw);
    }
    if (val > 0 && val < 100000) amounts.push({ val, priority: 1 });
  }

  // 4. Numbers with decimal point (no dollar sign)
  const plainDecimal = /\b(\d{1,6}\.\d{2})\b/g;
  while ((m = plainDecimal.exec(text)) !== null) {
    const val = parseFloat(m[1]);
    if (val > 1 && val < 100000) amounts.push({ val, priority: 0 });
  }

  if (amounts.length === 0) return null;

  // Prefer total-line matches, then highest amount
  amounts.sort((a, b) => b.priority - a.priority || b.val - a.val);
  return amounts[0].val;
}

function extractDate(text) {
  // 1. Standard formats with separators: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const withSep = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g,
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/g,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
  ];

  for (const pattern of withSep) {
    const match = pattern.exec(text);
    if (match) {
      let day, month, year;
      if (match[1].length === 4) {
        year = parseInt(match[1]); month = parseInt(match[2]); day = parseInt(match[3]);
      } else {
        day = parseInt(match[1]); month = parseInt(match[2]); year = parseInt(match[3]);
        if (year < 100) year += 2000;
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // 2. OCR often drops slashes - look for digits near "date" keyword
  const dateNear = /(?:date|dat|dte)[:\s]*(\d{6,10})/gi;
  const m1 = dateNear.exec(text);
  if (m1) {
    const s = m1[1];
    // Try DDMMYYYY (8 digits)
    if (s.length >= 8) {
      const day = parseInt(s.slice(0, 2)), month = parseInt(s.slice(2, 4)), year = parseInt(s.slice(4, 8));
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // Try DMYYYY or DDMYYYY (7 digits - single digit day or month)
    if (s.length === 7) {
      // Try D/MM/YYYY
      let day = parseInt(s.slice(0, 1)), month = parseInt(s.slice(1, 3)), year = parseInt(s.slice(3, 7));
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      // Try DD/M/YYYY
      day = parseInt(s.slice(0, 2)); month = parseInt(s.slice(2, 3)); year = parseInt(s.slice(3, 7));
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // Try DDMMYY (6 digits)
    if (s.length === 6) {
      const day = parseInt(s.slice(0, 2)), month = parseInt(s.slice(2, 4)), year = 2000 + parseInt(s.slice(4, 6));
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // 3. Find year (20XX) and try all DD/MM combos from digits before it
  const yearPos = text.search(/20[2-3]\d/);
  if (yearPos > 0) {
    const year = parseInt(text.slice(yearPos, yearPos + 4));
    const before = text.slice(Math.max(0, yearPos - 12), yearPos).replace(/\D/g, '');
    if (before.length >= 3) {
      // Try DDMM from the first 4 digits (skip OCR garbage at the end near year)
      const combos = [
        [before.slice(0, 2), before.slice(2, 4)],   // DDMM from start
        [before.slice(-4, -2), before.slice(-2)],    // DDMM from end
        [before.slice(0, 1), before.slice(1, 3)],    // D/MM
        [before.slice(0, 2), before.slice(2, 3)],    // DD/M
      ];
      for (const [ds, ms] of combos) {
        if (!ds || !ms) continue;
        const day = parseInt(ds), month = parseInt(ms);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
  }

  return null;
}

function extractDescription(text) {
  // Try to find store/vendor name (usually first few lines)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length > 0) {
    // First meaningful line is usually the store name
    const storeName = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    if (storeName.length >= 3 && storeName.length <= 60) return storeName;
  }
  return null;
}

router.post('/receipt', auth, upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const url = `/uploads/receipts/${req.file.filename}`;
  const filePath = req.file.path;

  // Run OCR in background, return URL immediately with a scan promise
  let ocr = { amount: null, date: null, description: null };

  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    ocr.amount = extractAmount(text);
    ocr.date = extractDate(text);
    ocr.description = extractDescription(text);
    ocr.rawText = text;
  } catch (err) {
    console.error('OCR failed:', err.message);
  }

  res.json({ url, filename: req.file.filename, ocr });
});

module.exports = router;
