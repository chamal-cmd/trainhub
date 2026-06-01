const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  console.log('Navigating to Trainual login link...');
  await page.goto('https://u6571251.ct.sendgrid.net/ls/click?upn=u001.vUXN9fu7oeL1-2FvyZiT4liIOK7jrT7HlcqNEm5QJsoWQbVnJA-2Bt15ANGlafPpPUq7FNbqVhAKCH5V6TKQoakwwYYHXtNDVh6UlXMcZaZVGIEK6TtoUtd54-2FrWzxvAeEEO2MQ9Jzct2DxsRg5OtpvH9D-2BvGIDIf7T75hAIAk29Tx-2BEjS-2F-2F6wBY-2Fu-2BCxdzvlKkW-2Bj-2FrJ0GOaSVOMmqOBgTcMQ-3D-3DO-WY_IvDtygO1627C10EtNiYolz4co76sQ0XKEBUG6-2FCb1hrn3gt01v6GACm5iPdZokBtWAmhjF-2BMEjSOg7aTgzYKrGSez82ln46h2Y7BBoyIQrlHEJwtzkgJYuU49rBNM1Ji0a0mg0WTk0dW7YfpNTL201sElA7kywkhZhRs4o1kDXthbxxI-2Fnpbdc7bTvRX4UL-2BrMU0mIQIAuNfCU5FLinZ7Hhekce3si5LER2tyXC1vOsdV8pxgnhKwjZgTZ8Sn8JJQBrqe2EFQ5stMIhNov02Vw-3D-3D', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  console.log('Title:', await page.title());
  // Keep browser open
  await new Promise(() => {});
})();
