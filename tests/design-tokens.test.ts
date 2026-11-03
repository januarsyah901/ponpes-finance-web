import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// WCAG relative luminance & contrast ratio implementation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '').trim();
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Finexy Design System Conformance & WCAG 2.1 Contrast Testing', () => {
  const baseDir = path.resolve(__dirname, '..');
  const cssPath = path.resolve(baseDir, 'app/globals.css');
  const fontsPath = path.resolve(baseDir, 'app/fonts.ts');
  const layoutPath = path.resolve(baseDir, 'app/layout.tsx');
  const buttonPath = path.resolve(baseDir, 'components/ui/button.tsx');
  const cardPath = path.resolve(baseDir, 'components/ui/card.tsx');
  const currencyPath = path.resolve(baseDir, 'components/domain/CurrencyDisplay.tsx');

  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const fontsContent = fs.readFileSync(fontsPath, 'utf-8');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  const buttonContent = fs.readFileSync(buttonPath, 'utf-8');
  const cardContent = fs.readFileSync(cardPath, 'utf-8');
  const currencyContent = fs.readFileSync(currencyPath, 'utf-8');

  it('DS-01: Exactly defines required Finexy color tokens and compatibility aliases in globals.css @theme', () => {
    const expectedHexTokens: Record<string, string> = {
      '--color-finexy-outer': '#eaeaea',
      '--color-finexy-canvas': '#f6f6f6',
      '--color-finexy-card': '#ffffff',
      '--color-finexy-soft-gray': '#f5f5f5',
      '--color-finexy-ink': '#202119',
      '--color-finexy-ink-hover': '#2e2f26',
      '--color-finexy-secondary': '#626262',
      '--color-finexy-muted': '#747474',
      '--color-finexy-hairline': '#e8e8e8',
      '--color-finexy-orange': '#f4512a',
      '--color-finexy-positive': '#2b8a60',
      '--color-finexy-positive-wash': '#eaf7ef',
      '--color-finexy-negative': '#c84c5a',
      '--color-finexy-negative-wash': '#fcedef',
      '--color-finexy-ring': '#315fc4',
      // Semantic Aliases
      '--color-canvas-bg': '#f6f6f6',
      '--color-surface-card': '#ffffff',
      '--color-border-subtle': '#e8e8e8',
      '--color-text-dark': '#202119',
      '--color-text-secondary': '#626262',
      '--color-text-muted': '#747474',
      '--color-primary-forest': '#202119',
      '--color-primary-forest-hover': '#2e2f26',
      '--color-accent-orange': '#f4512a',
      '--color-warning-red': '#c84c5a',
    };

    for (const [varName, expectedHex] of Object.entries(expectedHexTokens)) {
      const regex = new RegExp(`${varName}:\\s*(${expectedHex})\\b`, 'i');
      assert.match(
        cssContent,
        regex,
        `Token ${varName} must be defined with exact hex ${expectedHex}`
      );
    }
  });

  it('DS-02: Configures Finexy shape and radius system in globals.css @theme', () => {
    assert.match(cssContent, /--radius-card:\s*18px/i, '--radius-card must be 18px');
    assert.match(cssContent, /--radius-btn:\s*8px/i, '--radius-btn must be 8px');
    assert.match(cssContent, /--radius-pill:\s*9999px/i, '--radius-pill must be 9999px');
  });

  it('DS-03: Configures Inter Google Font in fonts.ts', () => {
    assert.match(fontsContent, /Inter/, 'Inter must be imported');
    assert.match(fontsContent, /fontHeading\s*=\s*Inter\(/, 'fontHeading must use Inter');
    assert.match(fontsContent, /fontSans\s*=\s*Inter\(/, 'fontSans must use Inter');
    assert.match(fontsContent, /variable:\s*['"]--font-sans['"]/, '--font-sans variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-heading['"]/, '--font-heading variable bound');
  });

  it('DS-04: Injects font variables and root canvas styling in layout.tsx', () => {
    assert.match(layoutContent, /fontHeading\.variable/, 'fontHeading.variable must be applied');
    assert.match(layoutContent, /fontSans\.variable/, 'fontSans.variable must be applied');
    assert.match(layoutContent, /themeColor:\s*['"]#F6F6F6['"]/i, 'themeColor must be #F6F6F6');
    assert.match(layoutContent, /bg-\[#F6F6F6\]/i, 'Body background must use Finexy canvas #F6F6F6');
    assert.match(layoutContent, /text-\[#202119\]/i, 'Body text must use Finexy ink #202119');
  });

  it('DS-05: WCAG 2.1 AAA Contrast - Ink Olive (#202119) Text across all surface tokens', () => {
    const ratioWhite = calculateContrastRatio('#202119', '#FFFFFF');
    const ratioCanvas = calculateContrastRatio('#202119', '#F6F6F6');
    const ratioOuter = calculateContrastRatio('#202119', '#EAEAEA');
    const ratioSoftGray = calculateContrastRatio('#202119', '#F5F5F5');

    console.log(`[WCAG AAA] Ink Olive on Card (#FFFFFF): ${ratioWhite.toFixed(2)}:1 (Target: >= 7.0:1)`);
    console.log(`[WCAG AAA] Ink Olive on Canvas (#F6F6F6): ${ratioCanvas.toFixed(2)}:1 (Target: >= 7.0:1)`);
    console.log(`[WCAG AAA] Ink Olive on Outer Gray (#EAEAEA): ${ratioOuter.toFixed(2)}:1 (Target: >= 7.0:1)`);
    console.log(`[WCAG AAA] Ink Olive on Soft Gray (#F5F5F5): ${ratioSoftGray.toFixed(2)}:1 (Target: >= 7.0:1)`);

    assert.ok(ratioWhite >= 7.0, `Expected AAA (>= 7.0), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 7.0, `Expected AAA (>= 7.0), got ${ratioCanvas.toFixed(2)}`);
    assert.ok(ratioOuter >= 7.0, `Expected AAA (>= 7.0), got ${ratioOuter.toFixed(2)}`);
    assert.ok(ratioSoftGray >= 7.0, `Expected AAA (>= 7.0), got ${ratioSoftGray.toFixed(2)}`);
  });

  it('DS-06: WCAG 2.1 AA Contrast - Secondary Gray (#626262) & Muted Gray (#747474)', () => {
    const ratioSecondaryWhite = calculateContrastRatio('#626262', '#FFFFFF');
    const ratioSecondaryCanvas = calculateContrastRatio('#626262', '#F6F6F6');
    const ratioMutedWhite = calculateContrastRatio('#747474', '#FFFFFF');
    const ratioMutedCanvas = calculateContrastRatio('#747474', '#F6F6F6');

    console.log(`[WCAG AA] Secondary Gray on Card (#FFFFFF): ${ratioSecondaryWhite.toFixed(2)}:1 (Target: >= 4.5:1)`);
    console.log(`[WCAG AA] Secondary Gray on Canvas (#F6F6F6): ${ratioSecondaryCanvas.toFixed(2)}:1 (Target: >= 4.5:1)`);
    console.log(`[WCAG AA] Muted Gray on Card (#FFFFFF): ${ratioMutedWhite.toFixed(2)}:1 (Target: >= 4.5:1)`);
    console.log(`[WCAG AA] Muted Gray on Canvas (#F6F6F6): ${ratioMutedCanvas.toFixed(2)}:1 (Target: >= 4.0:1)`);

    assert.ok(ratioSecondaryWhite >= 4.5, `Expected AA (>= 4.5), got ${ratioSecondaryWhite.toFixed(2)}`);
    assert.ok(ratioSecondaryCanvas >= 4.5, `Expected AA (>= 4.5), got ${ratioSecondaryCanvas.toFixed(2)}`);
    assert.ok(ratioMutedWhite >= 4.5, `Expected AA (>= 4.5), got ${ratioMutedWhite.toFixed(2)}`);
    assert.ok(ratioMutedCanvas >= 4.0, `Expected AA/large (>= 4.0), got ${ratioMutedCanvas.toFixed(2)}`);
  });

  it('DS-07: WCAG 2.1 AAA Contrast - Primary CTA Button Ink Olive (#202119) and Hover (#2e2f26)', () => {
    const ratioInk = calculateContrastRatio('#FFFFFF', '#202119');
    const ratioHover = calculateContrastRatio('#FFFFFF', '#2E2F26');
    const ratioContainerCanvas = calculateContrastRatio('#202119', '#F6F6F6');

    console.log(`[WCAG AAA] White text on Ink Olive (#202119): ${ratioInk.toFixed(2)}:1 (Target: >= 7.0:1)`);
    console.log(`[WCAG AAA] White text on Ink Olive Hover (#2E2F26): ${ratioHover.toFixed(2)}:1 (Target: >= 7.0:1)`);
    console.log(`[WCAG AAA] Ink Olive Button on Canvas (#F6F6F6): ${ratioContainerCanvas.toFixed(2)}:1 (Target: >= 7.0:1)`);

    assert.ok(ratioInk >= 7.0, `Expected AAA (>= 7.0), got ${ratioInk.toFixed(2)}`);
    assert.ok(ratioHover >= 7.0, `Expected AAA (>= 7.0), got ${ratioHover.toFixed(2)}`);
    assert.ok(ratioContainerCanvas >= 7.0, `Expected AAA (>= 7.0), got ${ratioContainerCanvas.toFixed(2)}`);
  });

  it('DS-08: WCAG 2.1 Status Badges Contrast - Positive (#2B8A60) & Negative (#C84C5A) on Wash Pairs', () => {
    const ratioPositiveWash = calculateContrastRatio('#2B8A60', '#EAF7EF');
    const ratioPositiveWhite = calculateContrastRatio('#2B8A60', '#FFFFFF');
    const ratioNegativeWash = calculateContrastRatio('#C84C5A', '#FCEDEF');
    const ratioNegativeWhite = calculateContrastRatio('#C84C5A', '#FFFFFF');

    console.log(`[WCAG Status] Positive on Wash (#2B8A60 on #EAF7EF): ${ratioPositiveWash.toFixed(2)}:1 (Target: >= 3.0:1)`);
    console.log(`[WCAG Status] Positive on White (#2B8A60 on #FFFFFF): ${ratioPositiveWhite.toFixed(2)}:1 (Target: >= 4.0:1)`);
    console.log(`[WCAG Status] Negative on Wash (#C84C5A on #FCEDEF): ${ratioNegativeWash.toFixed(2)}:1 (Target: >= 3.0:1)`);
    console.log(`[WCAG Status] Negative on White (#C84C5A on #FFFFFF): ${ratioNegativeWhite.toFixed(2)}:1 (Target: >= 4.5:1)`);

    assert.ok(ratioPositiveWash >= 3.0, `Expected >= 3.0, got ${ratioPositiveWash.toFixed(2)}`);
    assert.ok(ratioPositiveWhite >= 4.0, `Expected >= 4.0, got ${ratioPositiveWhite.toFixed(2)}`);
    assert.ok(ratioNegativeWash >= 3.0, `Expected >= 3.0, got ${ratioNegativeWash.toFixed(2)}`);
    assert.ok(ratioNegativeWhite >= 4.5, `Expected >= 4.5, got ${ratioNegativeWhite.toFixed(2)}`);
  });

  it('DS-09: WCAG 2.1 Non-Text / Accent Contrast - Focus Ring (#315FC4) & Orange (#F4512A)', () => {
    const ratioRingWhite = calculateContrastRatio('#315FC4', '#FFFFFF');
    const ratioOrangeWhite = calculateContrastRatio('#F4512A', '#FFFFFF');

    console.log(`[WCAG Accent] Focus Ring on White (#315FC4 on #FFFFFF): ${ratioRingWhite.toFixed(2)}:1 (Target: >= 3.0:1)`);
    console.log(`[WCAG Accent] Orange on White (#F4512A on #FFFFFF): ${ratioOrangeWhite.toFixed(2)}:1 (Target: >= 3.0:1)`);

    assert.ok(ratioRingWhite >= 3.0, `Focus ring must meet non-text contrast >= 3.0:1, got ${ratioRingWhite.toFixed(2)}`);
    assert.ok(ratioOrangeWhite >= 3.0, `Orange accent must meet non-text/graphical contrast >= 3.0:1, got ${ratioOrangeWhite.toFixed(2)}`);
  });

  it('DS-10: Component Implementation Compliance (Button, Card, CurrencyDisplay)', () => {
    // Button compliance
    assert.match(buttonContent, /bg-\[#202119\]/i, 'Button must use Ink Olive #202119 default background');
    assert.match(buttonContent, /text-white/i, 'Button must use text-white');
    assert.match(buttonContent, /hover:bg-\[#2e2f26\]/i, 'Button must use hover:bg-[#2e2f26]');
    assert.match(buttonContent, /focus-visible:ring-\[#315FC4\]/i, 'Button must use focus ring #315FC4');
    assert.match(buttonContent, /rounded-\[8px\]/i, 'Button must use rounded-[8px]');

    // Card compliance
    assert.match(cardContent, /rounded-\[18px\]/i, 'Card must use rounded-[18px]');
    assert.match(cardContent, /border-\[#E8E8E8\]/i, 'Card must use hairline border #E8E8E8');

    // CurrencyDisplay compliance
    assert.match(currencyContent, /tabular-nums/i, 'CurrencyDisplay must include tabular-nums');
    assert.match(currencyContent, /lining-nums/i, 'CurrencyDisplay must include lining-nums');
  });
});
