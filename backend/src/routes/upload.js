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
  // Match patterns like $82.00, $1,234.56, 82.00, Total: $82
  const patterns = [
    /(?:total|amount|grand\s*total|balance\s*due|net|subtotal)[:\s]*\$?\s*([\d,]+\.?\d*)/gi,
    /\$\s*([\d,]+\.\d{2})/g,
    /([\d,]+\.\d{2})/g,
  ];

  let amounts = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > 0 && val < 100000) amounts.push(val);
    }
  }

  if (amounts.length === 0) return null;
  // Return the largest amount (likely the total)
  return Math.max(...amounts);
}

function extractDate(text) {
  // Match common date formats: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, YYYY-MM-DD
  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g,
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/g,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      let day, month, year;

      if (match[1].length === 4) {
        // YYYY-MM-DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        // DD/MM/YYYY or DD/MM/YY (Australian format)
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
        if (year < 100) year += 2000;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
