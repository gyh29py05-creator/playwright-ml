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
          }),
          credentials: "include"
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
