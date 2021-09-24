import { UI_URL } from '../../env';

export function renderView(certificateId: string): string {
  const certificateUrl = `https://www.arweave.net/${certificateId}?ext=png`;
  const title = 'DeepWaifu Certificate of Adoption ヽ(*・ω・)ﾉ';

  return `<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8" />
  <meta name="twitter:card" content="summary" />
  <meta property="og:image" content="${certificateUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="Mint your perfect Waifu on the blockchain today!" />
  <meta property="og:url" content="${UI_URL}" />
  <title>${title}</title>
  </head>
  <body>
    <img src="${certificateUrl}" alt="${title}" />
    <script>window.location.href="${UI_URL}"</script>
  </body>
</html>`;
}
