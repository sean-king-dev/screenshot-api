import express from 'express';
import { chromium } from 'playwright';
import jsPDF, { jspdf } from 'jspdf';

const app = express();
app.use(express.json());

app.post('/download-pdf', async (req, res) => {
    const { url } = req.body;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle'});

    const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png'
    });

    await browser.close();

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
    });

    const img = new Image();
    img.src = `data:image/png;base64,${screenshot.toString('base64')}`;

    await new Promise(resolve => (img.onload = resolve));

    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = pageWidth / img.width;
    const imgHeight = img.height * ratio;

    pdf.addImage(
        img.src,
        'PNG',
        0,
        0,
        pageWidth,
        imgHeight
    );

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="page.pdf"');
    res.send(pdfBuffer);
});

app.listen(3000, () => {
    console.log("PDF Server running on http://localhost:3000");
})