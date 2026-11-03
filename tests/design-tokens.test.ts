import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

describe('Design System Conformance & WCAG 2.1 Contrast Testing', () => {
  const baseDir = path.resolve('/home/kadalcoklat/Downloads/projects/ponpes-finance/ponpes-finance-web');
  const cssPath = path.resolve(baseDir, 'app/globals.css');
  const fontsPath = path.resolve(baseDir, 'app/fonts.ts');
  const layoutPath = path.resolve(baseDir, 'app/layout.tsx');

  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const fontsContent = fs.readFileSync(fontsPath, 'utf-8');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  it('DS-01: Exactly defines required Notion color tokens and compatibility aliases in globals.css @theme', () => {
    const expectedHexTokens: Record<string, string> = {
      '--color-notion-canvas': '#f6f5f4',
      '--color-notion-card': '#ffffff',
      '--color-notion-blue': '#0075de',
      '--color-notion-blue-hover': '#0060b8',
      '--color-notion-sky-tint': '#e6f3fe',
      '--color-notion-charcoal': '#111111',
      '--color-notion-stone': '#757575',
      '--color-canvas-bg': '#f6f5f4',
      '--color-surface-card': '#ffffff',
      '--color-text-dark': '#111111',
      '--color-text-muted': '#757575',
      '--color-primary-forest': '#0075de',
      '--color-primary-forest-hover': '#0060b8',
      '--color-primary-forest-subtle': '#e6f3fe',
      '--color-accent-emerald': '#097fe8',
      '--color-gold-amber': '#e89d01',
      '--color-warning-red': '#e32d14',
    };

    for (const [varName, expectedHex] of Object.entries(expectedHexTokens)) {
      const regex = new RegExp(`${varName}:\\s*(${expectedHex})\\b`, 'i');
      assert.match(
        cssContent,
        regex,
        `Token ${varName} must be defined with exact hex ${expectedHex}`
      );
    }

    assert.match(
      cssContent,
      /--color-notion-hairline:\s*rgba\(0,\s*0,\s*0,\s*0\.08\)/i,
      '--color-notion-hairline must be defined as rgba(0, 0, 0, 0.08)'
    );
    assert.match(
      cssContent,
      /--color-border-subtle:\s*rgba\(0,\s*0,\s*0,\s*0\.08\)/i,
      '--color-border-subtle must be defined as rgba(0, 0, 0, 0.08)'
    );
  });

  it('DS-02: Configures required Google Fonts in fonts.ts (Inter, Source_Serif_4, JetBrains_Mono)', () => {
    assert.match(fontsContent, /Inter/, 'Inter must be imported');
    assert.match(fontsContent, /Source_Serif_4/, 'Source_Serif_4 must be imported');
    assert.match(fontsContent, /JetBrains_Mono/, 'JetBrains Mono must be imported');

    assert.match(fontsContent, /variable:\s*['"]--font-heading['"]/, '--font-heading variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-sans['"]/, '--font-sans variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-serif['"]/, '--font-serif variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-mono['"]/, '--font-mono variable bound');
  });

  it('DS-03: Injects font variables into RootLayout HTML element in layout.tsx', () => {
    assert.match(layoutContent, /fontHeading\.variable/, 'fontHeading.variable must be applied');
    assert.match(layoutContent, /fontSans\.variable/, 'fontSans.variable must be applied');
    assert.match(layoutContent, /fontSerif\.variable/, 'fontSerif.variable must be applied');
    assert.match(layoutContent, /fontMono\.variable/, 'fontMono.variable must be applied');
  });

  it('DS-04: WCAG 2.1 Contrast - Text Charcoal (#111111) on Card (#ffffff) and Canvas (#f6f5f4)', () => {
    const ratioWhite = calculateContrastRatio('#111111', '#ffffff');
    const ratioCanvas = calculateContrastRatio('#111111', '#f6f5f4');

    console.log(`[WCAG] Charcoal on White: ${ratioWhite.toFixed(2)}:1 (Target: >= 7:1 AAA)`);
    console.log(`[WCAG] Charcoal on Canvas: ${ratioCanvas.toFixed(2)}:1 (Target: >= 7:1 AAA)`);

    assert.ok(ratioWhite >= 7.0, `Expected AAA (>= 7.0), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 7.0, `Expected AAA (>= 7.0), got ${ratioCanvas.toFixed(2)}`);
  });

  it('DS-05: WCAG 2.1 Contrast - Text Stone Muted (#757575) on Card (#ffffff) and Canvas (#f6f5f4)', () => {
    const ratioWhite = calculateContrastRatio('#757575', '#ffffff');
    const ratioCanvas = calculateContrastRatio('#757575', '#f6f5f4');

    console.log(`[WCAG] Stone Muted on White: ${ratioWhite.toFixed(2)}:1 (Target: >= 4.5:1 AA)`);
    console.log(`[WCAG] Stone Muted on Canvas: ${ratioCanvas.toFixed(2)}:1 (Target: >= 4.0:1)`);

    assert.ok(ratioWhite >= 4.5, `Expected AA (>= 4.5), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 4.0, `Expected AA/large (>= 4.0), got ${ratioCanvas.toFixed(2)}`);
  });

  it('DS-06: WCAG 2.1 Contrast - Primary CTA Notion Blue (#0075de) on Card (#ffffff) and Canvas (#f6f5f4)', () => {
    const ratioWhite = calculateContrastRatio('#0075de', '#ffffff');
    const ratioCanvas = calculateContrastRatio('#0075de', '#f6f5f4');
    console.log(`[WCAG] Notion Blue on White: ${ratioWhite.toFixed(2)}:1 (Target: >= 4.5:1 AA)`);
    console.log(`[WCAG] Notion Blue on Canvas: ${ratioCanvas.toFixed(2)}:1 (Target: >= 4.0:1)`);
    assert.ok(ratioWhite >= 4.5, `Expected AA (>= 4.5), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 4.0, `Expected >= 4.0, got ${ratioCanvas.toFixed(2)}`);
  });

  it('DS-07: WCAG 2.1 Contrast - White Text (#ffffff) on Notion Blue (#0075de) and Hover (#0060b8)', () => {
    const ratioBlue = calculateContrastRatio('#ffffff', '#0075de');
    const ratioHover = calculateContrastRatio('#ffffff', '#0060b8');
    console.log(`[WCAG] White Text on Notion Blue: ${ratioBlue.toFixed(2)}:1 (Target: >= 4.5:1 AA)`);
    console.log(`[WCAG] White Text on Blue Hover: ${ratioHover.toFixed(2)}:1 (Target: >= 4.5:1 AA)`);
    assert.ok(ratioBlue >= 4.5, `Expected AA (>= 4.5), got ${ratioBlue.toFixed(2)}`);
    assert.ok(ratioHover >= 4.5, `Expected AA (>= 4.5), got ${ratioHover.toFixed(2)}`);
  });

  it('DS-08: WCAG 2.1 Contrast - Status Badge Foreground on Subtle Background Tokens', () => {
    // Sky Tint: #02093a on #e6f3fe
    const ratioSky = calculateContrastRatio('#02093a', '#e6f3fe');
    console.log(`[WCAG] Midnight Ink Badge Text (#02093a on #e6f3fe): ${ratioSky.toFixed(2)}:1`);
    assert.ok(ratioSky >= 4.5, `Sky badge text must satisfy AA >= 4.5:1, got ${ratioSky.toFixed(2)}`);

    // Saffron: #92400e on #fff6e5
    const ratioSaffron = calculateContrastRatio('#92400e', '#fff6e5');
    console.log(`[WCAG] Saffron Badge Text (#92400e on #fff6e5): ${ratioSaffron.toFixed(2)}:1`);
    assert.ok(ratioSaffron >= 4.5, `Saffron badge text must satisfy AA >= 4.5:1, got ${ratioSaffron.toFixed(2)}`);

    // Vermillion: #991b1b on #fdeeed
    const ratioRed = calculateContrastRatio('#991b1b', '#fdeeed');
    console.log(`[WCAG] Vermillion Badge Text (#991b1b on #fdeeed): ${ratioRed.toFixed(2)}:1`);
    assert.ok(ratioRed >= 4.5, `Vermillion badge text must satisfy AA >= 4.5:1, got ${ratioRed.toFixed(2)}`);
  });

  it('DS-09: WCAG 2.1 Analysis - White Text (#ffffff) on Notion Blue (#0075de) and Vermillion (#e32d14)', () => {
    const ratioBlue = calculateContrastRatio('#ffffff', '#0075de');
    const ratioRed = calculateContrastRatio('#ffffff', '#e32d14');
    const ratioSaffron = calculateContrastRatio('#ffffff', '#e89d01');

    console.log(`[WCAG Analysis] White on Notion Blue (#0075de): ${ratioBlue.toFixed(2)}:1`);
    console.log(`[WCAG Analysis] White on Vermillion (#e32d14): ${ratioRed.toFixed(2)}:1`);
    console.log(`[WCAG Analysis] White on Saffron (#e89d01): ${ratioSaffron.toFixed(2)}:1`);

    assert.ok(ratioBlue >= 4.5, 'Notion Blue button text meets WCAG AA >= 4.5:1');
    assert.ok(ratioRed > 3.0, 'Vermillion button text meets large/graphical ratio > 3.0:1');
  });
});
