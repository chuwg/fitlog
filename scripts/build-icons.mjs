import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');

const MINT = '#00D4AA';
const DARK = '#0B0F14';

// 핏로그 메인 아이콘: 다크 배경 + 민트 'F' + 심박파형
const fullIconSvg = (size = 1024) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F14"/>
      <stop offset="100%" stop-color="#1C242F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- F 글자 (rect로 구성) -->
  <rect x="320" y="220" width="120" height="584" rx="20" fill="${MINT}"/>
  <rect x="320" y="220" width="384" height="120" rx="20" fill="${MINT}"/>
  <rect x="320" y="460" width="304" height="110" rx="20" fill="${MINT}"/>
  <!-- 심박파형 -->
  <polyline
    points="180,860 320,860 360,800 410,920 460,780 510,890 560,860 844,860"
    stroke="${MINT}"
    stroke-width="14"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
    opacity="0.55"
  />
</svg>
`;

// Android adaptive icon foreground: 안전영역 고려해 중앙 ~66% 영역에 심볼만
const adaptiveForegroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- F 글자 (중앙 안전영역 안) -->
  <g transform="translate(0, -40)">
    <rect x="380" y="320" width="100" height="440" rx="16" fill="${MINT}"/>
    <rect x="380" y="320" width="280" height="100" rx="16" fill="${MINT}"/>
    <rect x="380" y="500" width="220" height="92" rx="16" fill="${MINT}"/>
  </g>
</svg>
`;

// 스플래시: 메인 아이콘과 동일 (크게 표시)
const splashIconSvg = fullIconSvg(1024);

// 파비콘: 작은 사이즈에 단순화
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="${DARK}"/>
  <rect x="80" y="55" width="32" height="146" rx="6" fill="${MINT}"/>
  <rect x="80" y="55" width="100" height="32" rx="6" fill="${MINT}"/>
  <rect x="80" y="115" width="80" height="28" rx="6" fill="${MINT}"/>
</svg>
`;

async function svgToPng(svg, outPath, size) {
  const buffer = Buffer.from(svg);
  await sharp(buffer).resize(size, size).png().toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

async function main() {
  await svgToPng(fullIconSvg(), join(ASSETS, 'icon.png'), 1024);
  await svgToPng(adaptiveForegroundSvg, join(ASSETS, 'adaptive-icon.png'), 1024);
  await svgToPng(splashIconSvg, join(ASSETS, 'splash-icon.png'), 1024);
  await svgToPng(faviconSvg, join(ASSETS, 'favicon.png'), 48);
  console.log('\n✅ All icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
