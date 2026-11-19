/**
 * Pure-JS QR Code Generator (ISO/IEC 18004)
 * Zero external dependencies. Supports Byte mode, Versions 1-10, EC Level M,
 * multi-block Reed-Solomon interleaving, and all 8 mask patterns.
 */

// GF(256) log/exp tables with primitive polynomial 0x11d (x^8 + x^4 + x^3 + x^2 + 1)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(ecCount) {
    let poly = [1];
    for (let i = 0; i < ecCount; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const factor = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
    }
    return poly;
}

function rsEncode(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const res = new Uint8Array(data.length + ecCount);
    res.set(data, 0);
    for (let i = 0; i < data.length; i++) {
        const coef = res[i];
        if (coef !== 0) {
            for (let j = 0; j < gen.length; j++) {
                res[i + j] ^= gfMul(gen[j], coef);
            }
        }
    }
    return res.slice(data.length);
}

// Version specs for EC Level M: [totalCodewords, ecPerBlock, group1Blocks, group1DataCW, group2Blocks, group2DataCW]
const VERSION_SPECS_M = [
    null,
    [26, 10, 1, 16, 0, 0],     // V1 (21x21)
    [44, 16, 1, 28, 0, 0],     // V2 (25x25)
    [70, 26, 1, 44, 0, 0],     // V3 (29x29)
    [100, 18, 2, 32, 0, 0],    // V4 (33x33)
    [134, 24, 2, 43, 0, 0],    // V5 (37x37)
    [172, 16, 4, 27, 0, 0],    // V6 (41x41)
    [196, 18, 4, 31, 0, 0],    // V7 (45x45)
    [242, 22, 2, 38, 2, 39],   // V8 (49x49)
    [292, 22, 3, 36, 2, 37],   // V9 (53x53)
    [346, 26, 4, 43, 1, 44],   // V10 (57x57)
];

const ALIGNMENT_POSITIONS = [
    null,
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
];

function selectVersion(byteLen) {
    for (let v = 1; v <= 10; v++) {
        const [, , g1b, g1d, g2b, g2d] = VERSION_SPECS_M[v];
        const totalDataCW = g1b * g1d + g2b * g2d;
        const charCountBits = v <= 9 ? 8 : 16;
        const headerBits = 4 + charCountBits;
        const availableBytes = Math.floor((totalDataCW * 8 - headerBits) / 8);
        if (byteLen <= availableBytes) return v;
    }
    throw new Error(`QR payload too long (${byteLen} bytes, max 213 bytes for V10-M)`);
}

function encodeDataCodewords(bytes, version) {
    const [, , g1b, g1d, g2b, g2d] = VERSION_SPECS_M[version];
    const totalDataCW = g1b * g1d + g2b * g2d;
    const totalBits = totalDataCW * 8;
    const bits = [];

    const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) {
            bits.push((val >> i) & 1);
        }
    };

    // Byte mode indicator: 0100
    pushBits(0b0100, 4);
    pushBits(bytes.length, version <= 9 ? 8 : 16);
    for (let i = 0; i < bytes.length; i++) {
        pushBits(bytes[i], 8);
    }

    // Terminator (up to 4 zero bits)
    const termLen = Math.min(4, totalBits - bits.length);
    for (let i = 0; i < termLen; i++) bits.push(0);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = new Uint8Array(totalDataCW);
    let idx = 0;
    for (let i = 0; i < bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
        codewords[idx++] = b;
    }

    // Pad codewords alternating 0xEC, 0x11
    const padBytes = [0xec, 0x11];
    let p = 0;
    while (idx < totalDataCW) {
        codewords[idx++] = padBytes[p++ % 2];
    }

    return codewords;
}

function buildFinalCodewords(dataCW, version) {
    const [, ecPerBlock, g1b, g1d, g2b, g2d] = VERSION_SPECS_M[version];
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;

    for (let i = 0; i < g1b; i++) {
        const block = dataCW.slice(offset, offset + g1d);
        offset += g1d;
        dataBlocks.push(block);
        ecBlocks.push(rsEncode(block, ecPerBlock));
    }
    for (let i = 0; i < g2b; i++) {
        const block = dataCW.slice(offset, offset + g2d);
        offset += g2d;
        dataBlocks.push(block);
        ecBlocks.push(rsEncode(block, ecPerBlock));
    }

    const result = [];
    const maxDataLen = Math.max(g1d, g2d);
    for (let i = 0; i < maxDataLen; i++) {
        for (const b of dataBlocks) {
            if (i < b.length) result.push(b[i]);
        }
    }
    for (let i = 0; i < ecPerBlock; i++) {
        for (const b of ecBlocks) {
            result.push(b[i]);
        }
    }
    return new Uint8Array(result);
}

function createMatrix(version) {
    const size = version * 4 + 17;
    const modules = new Uint8Array(size * size);
    const reserved = new Uint8Array(size * size);

    const setMod = (r, c, val, isRes = true) => {
        if (r < 0 || c < 0 || r >= size || c >= size) return;
        modules[r * size + c] = val ? 1 : 0;
        if (isRes) reserved[r * size + c] = 1;
    };

    const drawFinder = (top, left) => {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const rr = top + r;
                const cc = left + c;
                if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
                const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6;
                const isDark = inBox && (
                    r === 0 || r === 6 || c === 0 || c === 6 ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4)
                );
                setMod(rr, cc, isDark, true);
            }
        }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Alignment patterns
    const alignPos = ALIGNMENT_POSITIONS[version];
    for (const r of alignPos) {
        for (const c of alignPos) {
            if (reserved[r * size + c]) continue;
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const isDark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
                    setMod(r + dr, c + dc, isDark, true);
                }
            }
        }
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
        if (!reserved[6 * size + i]) setMod(6, i, i % 2 === 0, true);
        if (!reserved[i * size + 6]) setMod(i, 6, i % 2 === 0, true);
    }

    // Dark module
    setMod(4 * version + 9, 8, 1, true);

    // Reserve format info
    for (let i = 0; i < 9; i++) {
        if (i !== 6) {
            reserved[8 * size + i] = 1;
            reserved[i * size + 8] = 1;
        }
    }
    for (let i = size - 8; i < size; i++) {
        reserved[8 * size + i] = 1;
        reserved[i * size + 8] = 1;
    }

    // Reserve version info for V >= 7
    if (version >= 7) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                reserved[i * size + (size - 11 + j)] = 1;
                reserved[(size - 11 + j) * size + i] = 1;
            }
        }
    }

    return { size, modules, reserved };
}

function placeDataBits(size, modules, reserved, codewords) {
    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let up = true;

    for (let col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5;
        for (let i = 0; i < size; i++) {
            const row = up ? size - 1 - i : i;
            for (let dc = 0; dc < 2; dc++) {
                const c = col - dc;
                const pos = row * size + c;
                if (!reserved[pos]) {
                    let bit = 0;
                    if (bitIdx < totalBits) {
                        bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
                        bitIdx++;
                    }
                    modules[pos] = bit;
                }
            }
        }
        up = !up;
    }
}

const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function computeFormatBits(maskPattern) {
    // EC Level M = 0b00
    const data = (0b00 << 3) | maskPattern;
    let rem = data << 10;
    const gen = 0b10100110111;
    for (let i = 14; i >= 10; i--) {
        if (rem & (1 << i)) rem ^= gen << (i - 10);
    }
    return ((data << 10) | rem) ^ 0b101010000010010;
}

function computeVersionBits(version) {
    let rem = version << 12;
    const gen = 0b1111100100101;
    for (let i = 17; i >= 12; i--) {
        if (rem & (1 << i)) rem ^= gen << (i - 12);
    }
    return (version << 12) | rem;
}

function applyFormatAndVersion(size, modules, version, maskPattern) {
    const fmt = computeFormatBits(maskPattern);
    for (let i = 0; i < 6; i++) {
        const bit = (fmt >> (14 - i)) & 1;
        modules[8 * size + i] = bit;
        modules[(size - 1 - i) * size + 8] = bit;
    }
    modules[8 * size + 7] = (fmt >> 8) & 1;
    modules[(size - 7) * size + 8] = (fmt >> 8) & 1;
    modules[8 * size + 8] = (fmt >> 7) & 1;
    modules[7 * size + 8] = (fmt >> 6) & 1;
    for (let i = 0; i < 6; i++) {
        const bit = (fmt >> (5 - i)) & 1;
        modules[(5 - i) * size + 8] = bit;
        modules[8 * size + (size - 6 + i)] = bit;
    }
    modules[8 * size + (size - 8)] = (fmt >> 7) & 1;
    modules[8 * size + (size - 7)] = (fmt >> 6) & 1;

    if (version >= 7) {
        const vBits = computeVersionBits(version);
        for (let i = 0; i < 18; i++) {
            const bit = (vBits >> i) & 1;
            const r = Math.floor(i / 3);
            const c = size - 11 + (i % 3);
            modules[r * size + c] = bit;
            modules[c * size + r] = bit;
        }
    }
}

function scoreMask(size, modules) {
    let penalty = 0;

    // Rule 1: 5+ consecutive same-color modules in row/col
    for (let r = 0; r < size; r++) {
        let run = 1;
        for (let c = 1; c < size; c++) {
            if (modules[r * size + c] === modules[r * size + c - 1]) {
                run++;
            } else {
                if (run >= 5) penalty += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) penalty += 3 + (run - 5);
    }
    for (let c = 0; c < size; c++) {
        let run = 1;
        for (let r = 1; r < size; r++) {
            if (modules[r * size + c] === modules[(r - 1) * size + c]) {
                run++;
            } else {
                if (run >= 5) penalty += 3 + (run - 5);
                run = 1;
            }
        }
        if (run >= 5) penalty += 3 + (run - 5);
    }

    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const v = modules[r * size + c];
            if (
                v === modules[r * size + c + 1] &&
                v === modules[(r + 1) * size + c] &&
                v === modules[(r + 1) * size + c + 1]
            ) {
                penalty += 3;
            }
        }
    }

    // Rule 4: dark ratio
    let dark = 0;
    for (let i = 0; i < modules.length; i++) dark += modules[i];
    const pct = (dark * 100) / modules.length;
    penalty += Math.floor(Math.abs(pct - 50) / 5) * 10;

    return penalty;
}

/**
 * Generates a QR matrix for the given string using EC Level M.
 * @param {string} text
 * @returns {{ size: number, version: number, modules: Uint8Array }}
 */
export function generateQRMatrix(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(String(text || ''));
    const version = selectVersion(bytes.length);
    const dataCW = encodeDataCodewords(bytes, version);
    const finalCW = buildFinalCodewords(dataCW, version);

    const { size, modules, reserved } = createMatrix(version);
    placeDataBits(size, modules, reserved, finalCW);

    let bestMask = 0;
    let bestScore = Infinity;
    let bestModules = null;

    for (let m = 0; m < 8; m++) {
        const candidate = new Uint8Array(modules);
        const fn = MASK_FNS[m];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const pos = r * size + c;
                if (!reserved[pos] && fn(r, c)) {
                    candidate[pos] ^= 1;
                }
            }
        }
        applyFormatAndVersion(size, candidate, version, m);
        const score = scoreMask(size, candidate);
        if (score < bestScore) {
            bestScore = score;
            bestMask = m;
            bestModules = candidate;
        }
    }

    return { size, version, mask: bestMask, modules: bestModules };
}

/**
 * Generates an inline PNG Data URL synchronously using an offscreen HTML5 Canvas,
 * or SVG Data URL when running outside a DOM.
 */
export function generateQRDataURL(text, options = {}) {
    const {
        width = 256,
        margin = 1,
        darkColor = '#000000',
        lightColor = '#ffffff',
    } = options;

    const { size, modules } = generateQRMatrix(text);
    const totalModules = size + margin * 2;

    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        const scale = Math.max(2, Math.ceil(width / totalModules));
        const pxSize = totalModules * scale;
        canvas.width = pxSize;
        canvas.height = pxSize;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, pxSize, pxSize);
        ctx.fillStyle = darkColor;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (modules[r * size + c]) {
                    ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
                }
            }
        }
        return canvas.toDataURL('image/png');
    }

    // Fallback SVG data URL (for SSR/tests)
    let paths = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (modules[r * size + c]) {
                paths += `M${c + margin},${r + margin}h1v1h-1z`;
            }
        }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges"><rect width="${totalModules}" height="${totalModules}" fill="${lightColor}"/><path d="${paths}" fill="${darkColor}"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
