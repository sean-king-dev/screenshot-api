import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { jsPDF } from 'jspdf';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// PDF endpoint
app.post('/download-pdf', async (req, res) => {
  try {
    const { url } = req.body;

    // Launch headless browser
    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] }); // <-- important for Render
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Take full-page screenshot as PNG buffer
    const screenshot = await page.screenshot({ fullPage: true });

    // Get page dimensions
    const { width, height } = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }));

    await browser.close();

    // Create jsPDF document
    const pdf = new jsPDF({
      orientation: height > width ? 'portrait' : 'landscape',
      unit: 'px',
      format: [width, height]
    });

    // Convert screenshot buffer to base64 for jsPDF
    const imgBase64 = screenshot.toString('base64');
    pdf.addImage(imgBase64, 'PNG', 0, 0, width, height);

    // Output PDF as buffer
    const pdfOutput = pdf.output('datauristring');
    const base64 = pdfOutput.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    // const buffer = Buffer.from(pdf.output('arraybuffer'));

    // Send correct headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="page.pdf"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('PDF generation failed');
  }
});

const PORT = process.env.PORT || 3000;

// Correct console log
app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});
