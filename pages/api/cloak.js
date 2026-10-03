// Para Vercel: guarda como pages/api/cloak.js
// Para servidor tradicional: guarda como cloak.php o cloaker.js con tu framework

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const accept = req.headers['accept'] || '';

  const WHITE_PAGE = process.env.WHITE_PAGE_URL || 'https://google.com';
  const OFFER_PAGE = process.env.OFFER_PAGE_URL || 'https://ejemplo.com';

  // Detecta bots
  const botPatterns = [
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|viber|slackbot|curl|wget|python|requests|phantomjs|selenium|headless/i,
  ];

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  const hasRealBrowserHeaders = acceptLanguage && acceptEncoding && accept && accept.includes('text/html');

  // Verifica IP colombiana
  const colombianRanges = [
    { start: '200.0.0.0', end: '200.255.255.255' },
    { start: '186.0.0.0', end: '186.255.255.255' },
    { start: '190.0.0.0', end: '190.255.255.255' },
    { start: '179.1.0.0', end: '179.255.255.255' },
    { start: '181.0.0.0', end: '181.255.255.255' },
  ];

  function ipToNumber(ip) {
    const parts = ip.split('.');
    return parts.reduce((acc, part, i) => acc + (parseInt(part) << (8 * (3 - i))), 0);
  }

  function isIpInRange(ip, start, end) {
    const ipNum = ipToNumber(ip);
    const startNum = ipToNumber(start);
    const endNum = ipToNumber(end);
    return ipNum >= startNum && ipNum <= endNum;
  }

  const isColombian = colombianRanges.some(range => isIpInRange(ip, range.start, range.end));
  const isBlocked = isBot || !hasRealBrowserHeaders || !isColombian;

  // Si está bloqueado, muestra white page
  if (isBlocked) {
    console.log(`[CLOAK] BLOQUEADO: ${userAgent} | IP: ${ip}`);
    try {
      const response = await fetch(WHITE_PAGE);
      let content = await response.text();
      content = content.replace('<head>', `<head><base href="${WHITE_PAGE}" />`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.write(content);
      res.end();
    } catch (error) {
      res.status(200).send('<h1>Página no disponible</h1>');
    }
    return;
  }

  // Usuario real colombiano - muestra offer page
  console.log(`[CLOAK] PERMITIDO: ${userAgent} | IP: ${ip}`);
  try {
    const response = await fetch(OFFER_PAGE, {
      headers: { 'User-Agent': userAgent, 'Referer': referer }
    });
    let content = await response.text();
    content = content.replace('<head>', `<head><base href="${OFFER_PAGE}" />`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(content);
    res.end();
  } catch (error) {
    res.status(500).send('<h1>Error</h1>');
  }
}
