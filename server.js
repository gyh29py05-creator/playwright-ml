const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Playwright API Running");
});

app.get("/login", async (req, res) => {

  try {

    const browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    await page.goto("https://www.mercadolivre.com.br");

    await context.storageState({
      path: "auth.json"
    });

    await browser.close();

    res.json({
      status: "ok",
      mensagem: "Auth criado"
    });

  } catch (error) {

    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });

  }

});

app.post("/mercado", async (req, res) => {

  try {

    const { url } = req.body;

    const browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    await page.goto(
      "https://www.mercadolivre.com.br/afiliados/linkbuilder#hub"
    );

    const response = await page.evaluate(async ({ url }) => {

      const result = await fetch(
        "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            urls: [url],
            tag: "ragi6098412"
          })
        }
      );

      return await result.json();

    }, { url });

    await browser.close();

    res.json({
      status: "ok",
      resultado: response
    });

  } catch (error) {

    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });

  }

});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
