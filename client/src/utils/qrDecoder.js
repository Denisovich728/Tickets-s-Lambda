/**
 * Pure-JS QR Code Decoder (ISO/IEC 18004)
 * Zero external dependencies. Supports adaptive thresholding, finder + alignment
 * homography, all 4 EC levels (L, M, Q, H), Versions 1-10, and full GF(256)
 * Reed-Solomon error correction.
 */

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

function gfDiv(a, b) {
    if (a === 0) return 0;
    if (b === 0) throw new Error('GF div by zero');
    return GF_EXP[(GF_LOG[a] + 255 - GF_LOG[b]) % 255];
}

// Reed-Solomon error correction (Berlekamp-Massey + Chien + Forney)
function rsDecode(received, ecCount) {
    const n = received.length;
    const syndromes = new Uint8Array(ecCount);
    let hasError = false;
    for (let i = 0; i < ecCount; i++) {
        let val = 0;
        const root = GF_EXP[i];
        for (let j = 0; j < n; j++) {
            val = gfMul(val, root) ^ received[j];
        }
        syndromes[i] = val;
        if (val !== 0) hasError = true;
    }
    if (!hasError) return received.slice(0, n - ecCount);

    // Berlekamp-Massey
    let C = [1];
    let B = [1];
    let L = 0;
    let m = 1;
    let b = 1;

    for (let r = 0; r < ecCount; r++) {
        let d = syndromes[r];
        for (let i = 1; i <= L; i++) {
            d ^= gfMul(C[i], syndromes[r - i]);
        }
        if (d === 0) {
            m++;
        } else {
            const T = C.slice();
            const coef = gfDiv(d, b);
            while (C.length < B.length + m) C.push(0);
            for (let i = 0; i < B.length; i++) {
                C[i + m] ^= gfMul(coef, B[i]);
            }
            if (2 * L <= r) {
                L = r + 1 - L;
                B = T;
                b = d;
                m = 1;
            } else {
                m++;
            }
        }
    }

    if (L * 2 > ecCount) return null;

    // Chien search
    const errPositions = [];
    for (let i = 0; i < n; i++) {
        const xInv = GF_EXP[(255 - i) % 255]; // alpha^(-i)
        let evalVal = 0;
        let xPow = 1;
        for (let j = 0; j < C.length; j++) {
            evalVal ^= gfMul(C[j], xPow);
            xPow = gfMul(xPow, xInv);
        }
        if (evalVal === 0) {
            errPositions.push(n - 1 - i);
        }
    }

    if (errPositions.length !== L) return null;

    // Error evaluator Omega(x) = (S(x) * C(x)) mod x^ecCount
    const omega = new Uint8Array(ecCount);
    for (let i = 0; i < ecCount; i++) {
        let val = 0;
        for (let j = 0; j <= i && j < C.length; j++) {
            val ^= gfMul(syndromes[i - j], C[j]);
        }
        omega[i] = val;
    }

    // Formal derivative of C(x)
    const cPrime = [];
    for (let i = 1; i < C.length; i += 2) {
        cPrime.push(C[i]);
    }

    const corrected = new Uint8Array(received);
    for (const pos of errPositions) {
        const power = n - 1 - pos;
        const xInv = GF_EXP[(255 - power) % 255];

        let num = 0;
        let xPow = 1;
        for (let i = 0; i < omega.length; i++) {
            num ^= gfMul(omega[i], xPow);
            xPow = gfMul(xPow, xInv);
        }

        let den = 0;
        const xInv2 = gfMul(xInv, xInv);
        let x2Pow = 1;
        for (let i = 0; i < cPrime.length; i++) {
            den ^= gfMul(cPrime[i], x2Pow);
            x2Pow = gfMul(x2Pow, xInv2);
        }
        if (den === 0) return null;
        corrected[pos] ^= gfDiv(num, den);
    }

    return corrected.slice(0, n - ecCount);
}

// EC specs for L(01), M(00), Q(11), H(10) - Versions 1..10
// Format: [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]
const EC_SPECS = {
    // EC Level M (bits = 00)
    0: [
        null,
        [10, 1, 16, 0, 0],
        [16, 1, 28, 0, 0],
        [26, 1, 44, 0, 0],
        [18, 2, 32, 0, 0],
        [24, 2, 43, 0, 0],
        [16, 4, 27, 0, 0],
        [18, 4, 31, 0, 0],
        [22, 2, 38, 2, 39],
        [22, 3, 36, 2, 37],
        [26, 4, 43, 1, 44],
    ],
    // EC Level L (bits = 01)
    1: [
        null,
        [7, 1, 19, 0, 0],
        [10, 1, 34, 0, 0],
        [15, 1, 55, 0, 0],
        [20, 1, 80, 0, 0],
        [26, 1, 108, 0, 0],
        [18, 2, 68, 0, 0],
        [20, 2, 78, 0, 0],
        [24, 2, 97, 0, 0],
        [30, 2, 116, 0, 0],
        [18, 2, 68, 2, 69],
    ],
    // EC Level H (bits = 10)
    2: [
        null,
        [17, 1, 9, 0, 0],
        [28, 1, 16, 0, 0],
        [22, 2, 13, 0, 0],
        [16, 4, 9, 0, 0],
        [22, 2, 11, 2, 12],
        [28, 4, 15, 0, 0],
        [26, 4, 13, 1, 14],
        [26, 4, 14, 2, 15],
        [24, 4, 12, 4, 13],
        [28, 6, 15, 2, 16],
    ],
    // EC Level Q (bits = 11)
    3: [
        null,
        [13, 1, 13, 0, 0],
        [22, 1, 22, 0, 0],
        [18, 2, 17, 0, 0],
        [26, 2, 24, 0, 0],
        [18, 2, 15, 2, 16],
        [24, 4, 19, 0, 0],
        [18, 2, 14, 4, 15],
        [22, 4, 18, 2, 19],
        [20, 4, 16, 4, 17],
        [24, 6, 19, 2, 20],
    ],
};

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

const FORMAT_TABLE = [];
(() => {
    for (let ec = 0; ec < 4; ec++) {
        for (let mask = 0; mask < 8; mask++) {
            const data = (ec << 3) | mask;
            let rem = data << 10;
            const gen = 0b10100110111;
            for (let i = 14; i >= 10; i--) {
                if (rem & (1 << i)) rem ^= gen << (i - 10);
            }
            const encoded = ((data << 10) | rem) ^ 0b101010000010010;
            FORMAT_TABLE.push({ ec, mask, encoded });
        }
    }
})();

function popcount(x) {
    let c = 0;
    while (x) {
        c += x & 1;
        x >>>= 1;
    }
    return c;
}

function decodeFormatInfo(bits15) {
    let best = null;
    let bestDist = 4; // max 3 bit errors
    for (const entry of FORMAT_TABLE) {
        const dist = popcount(entry.encoded ^ bits15);
        if (dist < bestDist) {
            bestDist = dist;
            best = entry;
        }
    }
    return best;
}

/**
 * Adaptive binarization using integral image (1 = dark, 0 = light)
 */
function binarize(rgba, width, height) {
    const gray = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
        gray[i] = (rgba[p] * 77 + rgba[p + 1] * 150 + rgba[p + 2] * 29) >> 8;
    }

    const integral = new Int32Array((width + 1) * (height + 1));
    const iw = width + 1;
    for (let y = 0; y < height; y++) {
        let rowSum = 0;
        const yOff = y * width;
        const iOff = (y + 1) * iw;
        const prevOff = y * iw;
        for (let x = 0; x < width; x++) {
            rowSum += gray[yOff + x];
            integral[iOff + x + 1] = integral[prevOff + x + 1] + rowSum;
        }
    }

    const bin = new Uint8Array(width * height);
    const radius = Math.max(8, Math.floor(Math.min(width, height) / 16));
    for (let y = 0; y < height; y++) {
        const y0 = Math.max(0, y - radius);
        const y1 = Math.min(height - 1, y + radius);
        for (let x = 0; x < width; x++) {
            const x0 = Math.max(0, x - radius);
            const x1 = Math.min(width - 1, x + radius);
            const area = (x1 - x0 + 1) * (y1 - y0 + 1);
            const sum =
                integral[(y1 + 1) * iw + (x1 + 1)] -
                integral[y0 * iw + (x1 + 1)] -
                integral[(y1 + 1) * iw + x0] +
                integral[y0 * iw + x0];
            const mean = sum / area;
            // Dark if significantly below local mean or very dark absolute
            bin[y * width + x] = gray[y * width + x] < Math.max(15, mean * 0.88) ? 1 : 0;
        }
    }
    return bin;
}

function checkRatio(stateCount) {
    let total = 0;
    for (let i = 0; i < 5; i++) {
        if (stateCount[i] === 0) return false;
        total += stateCount[i];
    }
    if (total < 7) return false;
    const moduleSize = total / 7;
    const maxVar = moduleSize * 0.55;
    return (
        Math.abs(moduleSize - stateCount[0]) < maxVar &&
        Math.abs(moduleSize - stateCount[1]) < maxVar &&
        Math.abs(3 * moduleSize - stateCount[2]) < 3 * maxVar &&
        Math.abs(moduleSize - stateCount[3]) < maxVar &&
        Math.abs(moduleSize - stateCount[4]) < maxVar
    );
}

function crossCheckVertical(bin, w, h, startY, centerX, maxCount, origTotal) {
    const state = [0, 0, 0, 0, 0];
    let y = startY;
    while (y >= 0 && bin[y * w + centerX] === 1) {
        state[2]++;
        y--;
    }
    if (y < 0) return null;
    while (y >= 0 && bin[y * w + centerX] === 0 && state[1] <= maxCount) {
        state[1]++;
        y--;
    }
    if (y < 0 || state[1] > maxCount) return null;
    while (y >= 0 && bin[y * w + centerX] === 1 && state[0] <= maxCount) {
        state[0]++;
        y--;
    }
    if (state[0] > maxCount) return null;

    y = startY + 1;
    while (y < h && bin[y * w + centerX] === 1) {
        state[2]++;
        y++;
    }
    if (y >= h) return null;
    while (y < h && bin[y * w + centerX] === 0 && state[3] <= maxCount) {
        state[3]++;
        y++;
    }
    if (y >= h || state[3] > maxCount) return null;
    while (y < h && bin[y * w + centerX] === 1 && state[4] <= maxCount) {
        state[4]++;
        y++;
    }
    if (state[4] > maxCount) return null;

    const total = state[0] + state[1] + state[2] + state[3] + state[4];
    if (Math.abs(total - origTotal) * 5 >= origTotal * 2) return null;
    if (!checkRatio(state)) return null;
    return y - state[4] - state[3] - state[2] / 2;
}

function findFinderPatterns(bin, w, h) {
    const candidates = [];
    const step = Math.max(1, Math.floor(Math.min(w, h) / 200));

    for (let y = 0; y < h; y += step) {
        const state = [0, 0, 0, 0, 0];
        let curr = 0;
        for (let x = 0; x < w; x++) {
            const dark = bin[y * w + x] === 1;
            if (dark) {
                if ((curr & 1) === 1) curr++;
                state[curr]++;
            } else {
                if ((curr & 1) === 0) {
                    if (curr === 4) {
                        if (checkRatio(state)) {
                            const total = state[0] + state[1] + state[2] + state[3] + state[4];
                            const cx = Math.round(x - state[4] - state[3] - state[2] / 2);
                            const cy = crossCheckVertical(bin, w, h, y, cx, state[2], total);
                            if (cy !== null) {
                                const modSize = total / 7;
                                let merged = false;
                                for (const c of candidates) {
                                    if (
                                        Math.abs(c.x - cx) < modSize * 2 &&
                                        Math.abs(c.y - cy) < modSize * 2
                                    ) {
                                        const n = c.count + 1;
                                        c.x = (c.x * c.count + cx) / n;
                                        c.y = (c.y * c.count + cy) / n;
                                        c.modSize = (c.modSize * c.count + modSize) / n;
                                        c.count = n;
                                        merged = true;
                                        break;
                                    }
                                }
                                if (!merged) {
                                    candidates.push({ x: cx, y: cy, modSize, count: 1 });
                                }
                            }
                        }
                        state[0] = state[2];
                        state[1] = state[3];
                        state[2] = state[4];
                        state[3] = 1;
                        state[4] = 0;
                        curr = 3;
                    } else {
                        curr++;
                        state[curr]++;
                    }
                } else {
                    state[curr]++;
                }
            }
        }
    }

    if (candidates.length < 3) return null;
    candidates.sort((a, b) => b.count - a.count);
    const top = candidates.slice(0, Math.min(8, candidates.length));

    // Find best 3 forming a right isosceles triangle
    let bestTri = null;
    let bestScore = Infinity;

    for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
            for (let k = j + 1; k < top.length; k++) {
                const pts = [top[i], top[j], top[k]];
                const d01 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const d12 = Math.hypot(pts[1].x - pts[2].x, pts[1].y - pts[2].y);
                const d20 = Math.hypot(pts[2].x - pts[0].x, pts[2].y - pts[0].y);

                let a, b, c, hyp, leg1, leg2;
                if (d01 >= d12 && d01 >= d20) {
                    c = pts[2]; a = pts[0]; b = pts[1];
                    hyp = d01; leg1 = d12; leg2 = d20;
                } else if (d12 >= d01 && d12 >= d20) {
                    c = pts[0]; a = pts[1]; b = pts[2];
                    hyp = d12; leg1 = d01; leg2 = d20;
                } else {
                    c = pts[1]; a = pts[0]; b = pts[2];
                    hyp = d20; leg1 = d01; leg2 = d12;
                }

                if (leg1 < 10 || leg2 < 10) continue;
                const legDiff = Math.abs(leg1 - leg2) / Math.max(leg1, leg2);
                const hypExpected = Math.hypot(leg1, leg2);
                const hypDiff = Math.abs(hyp - hypExpected) / hypExpected;
                const score = legDiff + hypDiff;

                if (legDiff < 0.25 && hypDiff < 0.25 && score < bestScore) {
                    bestScore = score;
                    // Orient: in image coords (x right, y down), (topRight - topLeft) x (bottomLeft - topLeft) > 0
                    const cross = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
                    bestTri = cross > 0
                        ? { topLeft: c, topRight: a, bottomLeft: b }
                        : { topLeft: c, topRight: b, bottomLeft: a };
                }
            }
        }
    }

    return bestTri;
}

// Compute homography mapping (u,v) -> (x,y) from 4 point pairs
function computeHomography(src, dst) {
    const A = [];
    const B = [];
    for (let i = 0; i < 4; i++) {
        const [u, v] = src[i];
        const [x, y] = dst[i];
        A.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
        B.push(x);
        A.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
        B.push(y);
    }

    // Gaussian elimination
    const n = 8;
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let r = i + 1; r < n; r++) {
            if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        [B[i], B[maxRow]] = [B[maxRow], B[i]];

        const pivot = A[i][i];
        if (Math.abs(pivot) < 1e-10) return null;
        for (let j = i; j < n; j++) A[i][j] /= pivot;
        B[i] /= pivot;

        for (let r = 0; r < n; r++) {
            if (r === i) continue;
            const factor = A[r][i];
            for (let j = i; j < n; j++) A[r][j] -= factor * A[i][j];
            B[r] -= factor * B[i];
        }
    }
    return [...B, 1];
}

function sampleGrid(bin, w, h, dimension, H) {
    const grid = new Uint8Array(dimension * dimension);
    for (let r = 0; r < dimension; r++) {
        const v = r + 0.5;
        for (let c = 0; c < dimension; c++) {
            const u = c + 0.5;
            const denom = H[6] * u + H[7] * v + H[8];
            const x = Math.round((H[0] * u + H[1] * v + H[2]) / denom);
            const y = Math.round((H[3] * u + H[4] * v + H[5]) / denom);
            if (x >= 0 && x < w && y >= 0 && y < h) {
                grid[r * dimension + c] = bin[y * w + x];
            }
        }
    }
    return grid;
}

function buildReservedMask(version, size) {
    const reserved = new Uint8Array(size * size);
    const mark = (r0, c0, r1, c1) => {
        for (let r = Math.max(0, r0); r <= Math.min(size - 1, r1); r++) {
            for (let c = Math.max(0, c0); c <= Math.min(size - 1, c1); c++) {
                reserved[r * size + c] = 1;
            }
        }
    };
    mark(0, 0, 8, 8);
    mark(0, size - 8, 8, size - 1);
    mark(size - 8, 0, size - 1, 8);
    const alignPos = ALIGNMENT_POSITIONS[version] || [];
    for (const r of alignPos) {
        for (const c of alignPos) {
            if (reserved[r * size + c]) continue;
            mark(r - 2, c - 2, r + 2, c + 2);
        }
    }
    for (let i = 0; i < size; i++) {
        reserved[6 * size + i] = 1;
        reserved[i * size + 6] = 1;
    }
    if (version >= 7) {
        mark(0, size - 11, 5, size - 9);
        mark(size - 11, 0, size - 9, 5);
    }
    return reserved;
}

function decodeMatrix(grid, size) {
    const version = (size - 17) / 4;
    if (version < 1 || version > 10 || !Number.isInteger(version)) return null;

    // Read format info copy 1 (top-left)
    let fmt1 = 0;
    for (let i = 0; i <= 5; i++) fmt1 = (fmt1 << 1) | grid[8 * size + i];
    fmt1 = (fmt1 << 1) | grid[8 * size + 7];
    fmt1 = (fmt1 << 1) | grid[8 * size + 8];
    fmt1 = (fmt1 << 1) | grid[7 * size + 8];
    for (let i = 5; i >= 0; i--) fmt1 = (fmt1 << 1) | grid[i * size + 8];

    // Copy 2
    let fmt2 = 0;
    for (let i = size - 1; i >= size - 7; i--) fmt2 = (fmt2 << 1) | grid[i * size + 8];
    for (let i = size - 8; i < size; i++) fmt2 = (fmt2 << 1) | grid[8 * size + i];

    const fmt = decodeFormatInfo(fmt1) || decodeFormatInfo(fmt2);
    if (!fmt) return null;

    const reserved = buildReservedMask(version, size);
    const maskFn = MASK_FNS[fmt.mask];
    const unmasked = new Uint8Array(grid);
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const pos = r * size + c;
            if (!reserved[pos] && maskFn(r, c)) {
                unmasked[pos] ^= 1;
            }
        }
    }

    // Read codewords in zig-zag
    const spec = EC_SPECS[fmt.ec]?.[version];
    if (!spec) return null;
    const [ecPerBlock, g1b, g1d, g2b, g2d] = spec;
    const totalCW = g1b * (g1d + ecPerBlock) + g2b * (g2d + ecPerBlock);

    const rawCW = new Uint8Array(totalCW);
    let cwIdx = 0;
    let bitAcc = 0;
    let bitCount = 0;
    let up = true;

    for (let col = size - 1; col >= 1 && cwIdx < totalCW; col -= 2) {
        if (col === 6) col = 5;
        for (let i = 0; i < size && cwIdx < totalCW; i++) {
            const row = up ? size - 1 - i : i;
            for (let dc = 0; dc < 2 && cwIdx < totalCW; dc++) {
                const c = col - dc;
                const pos = row * size + c;
                if (!reserved[pos]) {
                    bitAcc = (bitAcc << 1) | unmasked[pos];
                    bitCount++;
                    if (bitCount === 8) {
                        rawCW[cwIdx++] = bitAcc;
                        bitAcc = 0;
                        bitCount = 0;
                    }
                }
            }
        }
        up = !up;
    }

    // De-interleave blocks & RS decode
    const totalBlocks = g1b + g2b;
    const blocks = [];
    for (let i = 0; i < g1b; i++) blocks.push({ dataLen: g1d, cw: new Uint8Array(g1d + ecPerBlock) });
    for (let i = 0; i < g2b; i++) blocks.push({ dataLen: g2d, cw: new Uint8Array(g2d + ecPerBlock) });

    let rIdx = 0;
    const maxDataLen = Math.max(g1d, g2d);
    for (let i = 0; i < maxDataLen; i++) {
        for (let b = 0; b < totalBlocks; b++) {
            if (i < blocks[b].dataLen) blocks[b].cw[i] = rawCW[rIdx++];
        }
    }
    for (let i = 0; i < ecPerBlock; i++) {
        for (let b = 0; b < totalBlocks; b++) {
            blocks[b].cw[blocks[b].dataLen + i] = rawCW[rIdx++];
        }
    }

    const dataBytes = [];
    for (const b of blocks) {
        const decoded = rsDecode(b.cw, ecPerBlock);
        if (!decoded) return null;
        for (let i = 0; i < decoded.length; i++) dataBytes.push(decoded[i]);
    }

    // Parse bit stream
    let bitPos = 0;
    const totalDataBits = dataBytes.length * 8;
    const readBits = (count) => {
        if (bitPos + count > totalDataBits) return null;
        let val = 0;
        for (let i = 0; i < count; i++) {
            const byteIdx = bitPos >> 3;
            const bitIdx = 7 - (bitPos & 7);
            val = (val << 1) | ((dataBytes[byteIdx] >> bitIdx) & 1);
            bitPos++;
        }
        return val;
    };

    const outputBytes = [];
    while (bitPos + 4 <= totalDataBits) {
        const mode = readBits(4);
        if (mode === 0 || mode === null) break;

        if (mode === 0b0100) {
            // Byte mode
            const countBits = version <= 9 ? 8 : 16;
            const len = readBits(countBits);
            if (len === null) break;
            for (let i = 0; i < len; i++) {
                const b = readBits(8);
                if (b === null) break;
                outputBytes.push(b);
            }
        } else if (mode === 0b0010) {
            // Alphanumeric
            const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
            const countBits = version <= 9 ? 9 : 11;
            let len = readBits(countBits);
            if (len === null) break;
            while (len >= 2) {
                const v = readBits(11);
                if (v === null) break;
                outputBytes.push(ALNUM.charCodeAt(Math.floor(v / 45)));
                outputBytes.push(ALNUM.charCodeAt(v % 45));
                len -= 2;
            }
            if (len === 1) {
                const v = readBits(6);
                if (v !== null) outputBytes.push(ALNUM.charCodeAt(v));
            }
        } else if (mode === 0b0001) {
            // Numeric
            const countBits = version <= 9 ? 10 : 12;
            let len = readBits(countBits);
            if (len === null) break;
            while (len >= 3) {
                const v = readBits(10);
                if (v === null) break;
                const s = String(v).padStart(3, '0');
                for (let k = 0; k < 3; k++) outputBytes.push(s.charCodeAt(k));
                len -= 3;
            }
            if (len === 2) {
                const v = readBits(7);
                if (v !== null) {
                    const s = String(v).padStart(2, '0');
                    outputBytes.push(s.charCodeAt(0), s.charCodeAt(1));
                }
            } else if (len === 1) {
                const v = readBits(4);
                if (v !== null) outputBytes.push(String(v).charCodeAt(0));
            }
        } else {
            break;
        }
    }

    if (outputBytes.length === 0) return null;
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(outputBytes));
}

/**
 * Decodes a QR code from raw RGBA ImageData buffer.
 * @param {Uint8ClampedArray|Uint8Array} rgba
 * @param {number} width
 * @param {number} height
 * @returns {string|null}
 */
export function decodeQRFromImageData(rgba, width, height) {
    const bin = binarize(rgba, width, height);
    const tri = findFinderPatterns(bin, width, height);
    if (!tri) return null;

    const { topLeft, topRight, bottomLeft } = tri;
    const modSize = (topLeft.modSize + topRight.modSize + bottomLeft.modSize) / 3;
    const distTR = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
    const distBL = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
    const rawDim = (distTR + distBL) / (2 * modSize) + 7;
    const estDim = Math.round((rawDim - 17) / 4) * 4 + 17;

    // Try estimated dimension and +/- 4 in case of slight module size drift
    for (const dim of [estDim, estDim - 4, estDim + 4]) {
        if (dim < 21 || dim > 57) continue;

        // Estimate 4th corner (affine)
        const estBRx = topRight.x - topLeft.x + bottomLeft.x;
        const estBRy = topRight.y - topLeft.y + bottomLeft.y;

        const H = computeHomography(
            [
                [3.5, 3.5],
                [dim - 3.5, 3.5],
                [3.5, dim - 3.5],
                [dim - 3.5, dim - 3.5],
            ],
            [
                [topLeft.x, topLeft.y],
                [topRight.x, topRight.y],
                [bottomLeft.x, bottomLeft.y],
                [estBRx, estBRy],
            ]
        );
        if (!H) continue;

        const grid = sampleGrid(bin, width, height, dim, H);
        const decoded = decodeMatrix(grid, dim);
        if (decoded !== null) return decoded;
    }

    return null;
}
