const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Playwright API Running");
});

app.post("/abrir", async (req, res) => {

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      status: "erro",
      message: "URL não enviada"
    });
  }

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {

    await page.goto(url);

    const titulo = await page.title();

    res.json({
      status: "ok",
      titulo
    });

  } catch (error) {

    res.json({
      status: "erro",
      message: error.message
    });

  } finally {

    await browser.close();

  }

});

app.get("/login", async (req, res) => {

  const browser = await chromium.launch({
  headless: true
  });

  const page = await browser.newPage();
  await page.goto("https://www.mercadolivre.com");

await page.context().storageState({
  path: "auth.json"
});

  await page.goto("https://www.mercadolivre.com.br");

  res.send("Faça login manualmente no Mercado Livre");

});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
