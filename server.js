import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { jsPDF } from 'jspdf';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Optional: root route for sanity check
app.get('/', (req, res) => {
  res.send('PDF API is running. POST /download-pdf with JSON { url: "https://example.com" }');
});

// PDF endpoint
app.post('/download-pdf', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) throw new Error('No URL provided');

    // Launch headless browser (important for Render)
    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Take full-page screenshot
    const screenshot = await page.screenshot({ fullPage: true });

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

    pdf.addImage(screenshot.toString('base64'), 'PNG', 0, 0, width, height);

    // Send PDF buffer
    const pdfOutput = pdf.output('datauristring');
    const buffer = Buffer.from(pdfOutput.split(',')[1], 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="page.pdf"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('PDF generation failed: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ PDF API running on port ${PORT}`));
