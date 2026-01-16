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
 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/download-pdf', async (req, res) => {
  try {
    const { url } = req.body;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    const screenshot = await page.screenshot({ fullPage: true });

    const { width, height } = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }));

    await browser.close();

    const pdf = new jsPDF({
      orientation: height > width ? 'portrait' : 'landscape',
      unit: 'px',
      format: [width, height]
    });

    pdf.addImage(screenshot, 'PNG', 0, 0, width, height);

    const buffer = Buffer.from(pdf.output('arraybuffer'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="page.pdf"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('PDF generation failed');
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('✅ App running on port ${PORT}');
});
