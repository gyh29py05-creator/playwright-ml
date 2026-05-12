const express = require('express');
const { chromium } = require('playwright');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Playwright API Running');
});

app.post('/abrir', async (req, res) => {
  const { url } = req.body;

  try {
    const browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.goto(url);

    const title = await page.title();

    await browser.close();

    res.json({
      status: 'ok',
      title
    });

  } catch (error) {
    res.json({
      status: 'erro',
      message: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
