import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// SVG 아이콘 (심플 버전)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#d5804a"/>
  <path d="M256 100 L380 320 L320 320 L256 220 L192 320 L132 320 Z" fill="#fdf8f3"/>
  <rect x="244" y="80" width="24" height="60" rx="4" fill="#fff"/>
  <rect x="224" y="100" width="64" height="16" rx="4" fill="#fff"/>
  <text x="256" y="420" text-anchor="middle" font-family="Arial" font-size="72" font-weight="bold" fill="#fdf8f3">SUMMIT</text>
</svg>
`;

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 },
];

async function generateIcons() {
  console.log('🎨 아이콘 생성 중...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ ${name} (${size}x${size})`);
  }

  // 스크린샷 플레이스홀더 생성 (wide)
  const wideScreenshot = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#fdf8f3"/>
  <rect x="20" y="20" width="1240" height="680" rx="20" fill="#d5804a" opacity="0.1"/>
  <text x="640" y="360" text-anchor="middle" font-family="Arial" font-size="48" fill="#d5804a">SUMMIT - 3집중</text>
  <text x="640" y="420" text-anchor="middle" font-family="Arial" font-size="24" fill="#888">3집중 속에 찾는 나의 망대 여정</text>
</svg>
`;

  await sharp(Buffer.from(wideScreenshot))
    .resize(1280, 720)
    .png()
    .toFile(join(publicDir, 'screenshot-wide.png'));
  console.log('✅ screenshot-wide.png (1280x720)');

  // 스크린샷 플레이스홀더 생성 (narrow)
  const narrowScreenshot = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280">
  <rect width="720" height="1280" fill="#fdf8f3"/>
  <rect x="20" y="20" width="680" height="1240" rx="20" fill="#d5804a" opacity="0.1"/>
  <text x="360" y="600" text-anchor="middle" font-family="Arial" font-size="48" fill="#d5804a">SUMMIT</text>
  <text x="360" y="660" text-anchor="middle" font-family="Arial" font-size="24" fill="#888">3집중</text>
</svg>
`;

  await sharp(Buffer.from(narrowScreenshot))
    .resize(720, 1280)
    .png()
    .toFile(join(publicDir, 'screenshot-narrow.png'));
  console.log('✅ screenshot-narrow.png (720x1280)');

  console.log('\n🎉 모든 아이콘 생성 완료!');
}

generateIcons().catch(console.error);

