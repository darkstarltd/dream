import { Theme, ThemePalette } from '../types';

// --- Color Conversion Helpers ---
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, l: l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => ('0' + Math.round(c).toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number): string {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Palette Generation ---

function generatePalette(baseHex: string): ThemePalette {
    const { r: R, g: G, b: B } = hexToRgb(baseHex);
    const { h, s, l: baseL } = rgbToHsl(R, G, B);
    
    const factors: { [key: string]: number } = {
        '100': 0.85, '200': 0.7, '300': 0.5, '400': 0.25,
        '600': 0.15, '700': 0.3, '800': 0.45, '900': 0.6
    };
    
    const palette: Partial<ThemePalette> = { '500': baseHex };
    
    for (const key of ['100', '200', '300', '400'] as const) {
        const l = baseL + (1 - baseL) * factors[key];
        const { r, g, b } = hslToRgb(h, s, Math.min(l, 1));
        palette[key] = rgbToHex(r, g, b);
    }
    
    for (const key of ['600', '700', '800', '900'] as const) {
        const l = baseL - baseL * factors[key];
        const { r, g, b } = hslToRgb(h, s, Math.max(l, 0));
        palette[key] = rgbToHex(r, g, b);
    }
    
    return palette as ThemePalette;
}

const defaultFonts = { sans: 'Inter, system-ui, sans-serif', mono: 'Fira Code, monospace' };

const THEMES: Theme[] = [
    {
        name: 'Dream (Purple)',
        font: defaultFonts,
        colors: {
            primary: { '100': '#e0dffd', '200': '#c2bffa', '300': '#a39ff8', '400': '#857ff5', '500': '#6a5acd', '600': '#5a4cb4', '700': '#4a3e9a', '800': '#3a317f', '900': '#2f2766' },
            dark: { '100': '#a7b0bb', '200': '#7d8895', '300': '#5c6672', '400': '#48515a', '500': '#30363d', '600': '#21262d', '700': '#161b22', '800': '#0d1117', '900': '#080a0e' },
            glow: { start: 'rgba(106, 90, 205, 0.8)', end: 'rgba(106, 90, 205, 0.5)' }
        }
    },
    {
        name: 'Neon (Pink)',
        font: defaultFonts,
        colors: {
            primary: { '100': '#ffd6f5', '200': '#ffadeb', '300': '#ff84e0', '400': '#ff5bd6', '500': '#f927c3', '600': '#d31fa5', '700': '#ad1787', '800': '#881069', '900': '#6c0c53' },
            dark: { '100': '#575757', '200': '#434343', '300': '#333333', '400': '#232323', '500': '#181818', '600': '#121212', '700': '#0e0e0e', '800': '#090909', '900': '#050505' },
            glow: { start: 'rgba(249, 39, 195, 0.8)', end: 'rgba(249, 39, 195, 0.5)' }
        }
    },
    {
        name: 'Matrix (Green)',
        font: { sans: 'Source Sans Pro, sans-serif', mono: 'Roboto Mono, monospace' },
        colors: {
            primary: { '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b' },
            dark: { '100': '#434a46', '200': '#303633', '300': '#252a27', '400': '#1a1d1b', '500': '#101211', '600': '#090a09', '700': '#050605', '800': '#020302', '900': '#000000' },
            glow: { start: 'rgba(16, 185, 129, 0.8)', end: 'rgba(16, 185, 129, 0.5)' }
        }
    },
    {
        name: 'Oceanic (Blue)',
        font: defaultFonts,
        colors: {
            primary: { '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a' },
            dark: { '100': '#525a69', '200': '#374151', '300': '#1f2937', '400': '#111827', '500': '#080d16', '600': '#050911', '700': '#03060c', '800': '#020408', '900': '#010204' },
            glow: { start: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0.5)' }
        }
    }
];

export const getAllThemes = (): Theme[] => THEMES;

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    // Apply fonts
    root.style.setProperty('--font-sans', theme.font.sans);
    root.style.setProperty('--font-mono', theme.font.mono);

    // Apply colors
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value);
    });
    const darkPalette = theme.colors.dark;
    root.style.setProperty(`--color-dark-900`, darkPalette['900']);
    root.style.setProperty(`--color-dark-800`, darkPalette['800']);
    root.style.setProperty(`--color-dark-700`, darkPalette['700']);
    root.style.setProperty(`--color-dark-600`, darkPalette['600']);
    root.style.setProperty(`--color-dark-500`, darkPalette['500']);

    root.style.setProperty('--color-primary-500-glow-start', theme.colors.glow.start);
    root.style.setProperty('--color-primary-500-glow-end', theme.colors.glow.end);
};

export const createThemeFromHex = (name: string, primaryHex: string, darkHex: string, font: { sans: string, mono: string }): Theme => {
    const primaryPalette = generatePalette(primaryHex);
    
    // darkHex is the darkest shade (900)
    const { r: R, g: G, b: B } = hexToRgb(darkHex);
    const { h, s, l: baseL } = rgbToHsl(R, G, B);
    
    const darkPalette: Partial<ThemePalette> = { '900': darkHex };
    const lightnessSteps = { '800': 0.05, '700': 0.1, '600': 0.15, '500': 0.2 };

    Object.entries(lightnessSteps).forEach(([key, step]) => {
         const l = baseL + step;
         const { r, g, b } = hslToRgb(h, s, Math.min(l, 1));
         darkPalette[key as keyof typeof lightnessSteps] = rgbToHex(r, g, b);
    });
    
    return {
        name,
        isCustom: true,
        font,
        colors: {
            primary: primaryPalette,
            dark: darkPalette as ThemePalette,
            glow: {
                start: hexToRgba(primaryHex, 0.8),
                end: hexToRgba(primaryHex, 0.5)
            }
        }
    };
};