"""生成水彩晕染贴图（透明 PNG），替代浏览器端实时 SVG 滤镜。

用法：python scripts/make-washes.py src/assets/washes
每张图：多团色块 + 分形噪声扭曲边缘 + 边缘积色 + 颗粒；颜色取自封面水彩画。
"""
import os
import sys

import numpy as np
from PIL import Image

OUT = sys.argv[1]
N = 900

TONES = {
    "mix": ((199, 178, 222), (242, 205, 214), (142, 95, 147)),
    "lilac": ((199, 178, 222), (221, 208, 236), (125, 90, 150)),
    "blush": ((244, 217, 223), (234, 184, 197), (201, 129, 150)),
    "plum": ((167, 122, 163), (108, 59, 103), (75, 35, 70)),
    "brand": ((226, 169, 184), (196, 92, 120), (160, 0, 48)),
}
VARIANTS = {"mix": [1, 2], "lilac": [1, 2], "blush": [1, 2], "plum": [1], "brand": [1]}


def smooth_noise(res, rng):
    g = rng.random((res, res)).astype(np.float32)
    im = Image.fromarray(g).resize((N, N), Image.BICUBIC)
    return np.asarray(im, dtype=np.float32)


def fractal(rng, base, octaves, persistence=0.55):
    total = np.zeros((N, N), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        total += amp * smooth_noise(base * 2**o, rng)
        norm += amp
        amp *= persistence
    return total / norm


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def make(tone, variant):
    rng = np.random.default_rng(sum(map(ord, tone)) * 100 + variant)
    c1, c2, rim_c = (np.array(c, np.float32) for c in TONES[tone])
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32) / N

    field = np.full((N, N), -3.0, np.float32)
    k = rng.integers(4, 7)
    for i in range(k):
        cx, cy = 0.5 + rng.normal(0, 0.12, 2)
        r = rng.uniform(0.15, 0.27) if i else 0.3
        w = rng.uniform(0.75, 1.0)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
        field = np.maximum(field, w * (1 - d))

    warp = fractal(rng, 3, 5) - 0.5
    fine = fractal(rng, 20, 3) - 0.5
    f = field + 0.34 * warp + 0.05 * fine

    body = smoothstep(0.0, 0.34, f)
    rim = np.exp(-(((f - 0.018) / 0.026) ** 2)) * (field > -0.25)
    gran = fractal(rng, 160, 2)
    pooling = fractal(rng, 4, 4)
    blooms = smoothstep(0.58, 0.78, fractal(rng, 7, 3))

    alpha = np.clip(0.58 * body + 0.26 * rim, 0, 1)
    alpha *= 0.72 + 0.56 * (pooling - 0.5) + 0.28
    alpha *= 0.86 + 0.28 * (gran - 0.5)
    alpha *= 1 - 0.3 * blooms * body
    border = np.minimum.reduce([xx, yy, 1 - xx, 1 - yy])
    alpha *= smoothstep(0.0, 0.08, border)

    t = fractal(rng, 2, 3)[..., None]
    rgb = c1 * (1 - t) + c2 * t
    rgb = rgb * (1 - 0.55 * rim[..., None]) + rim_c * 0.55 * rim[..., None]

    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"{tone}-{variant}.png"), optimize=True)


os.makedirs(OUT, exist_ok=True)
for tone, vs in VARIANTS.items():
    for v in vs:
        make(tone, v)
        print("wrote", tone, v)
