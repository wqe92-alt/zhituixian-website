"""把 legacy-html/logo.png 矢量化为 SVG 路径（marching squares 取等值线 + RDP 简化）。

用法：python scripts/trace-logo.py ../legacy-html/logo.png src/assets/logo-paths.json
输出 mark（衣架图形）与 word（SMART RETURN 字标）两组路径及各自的包围盒；
换了更高清的 logo 原图时重跑即可。
"""
import json
import sys

import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]

rgba = np.asarray(Image.open(SRC).convert("RGBA")).astype(float)
r, g, b, a = (rgba[..., i] for i in range(4))
field = np.clip((r - (g + b) / 2) / 120.0, 0, 1) * (a / 255.0)  # 红色前景强度 0..1
field = np.pad(field, 1)  # 外圈补零，保证等值线闭合
H, W = field.shape
ISO = 0.5
inside = field > ISO

case = (
    inside[:-1, :-1].astype(int) * 8
    + inside[:-1, 1:].astype(int) * 4
    + inside[1:, 1:].astype(int) * 2
    + inside[1:, :-1].astype(int) * 1
)


def edge_point(key):
    kind, y, x = key
    if kind == "h":  # (y,x)-(y,x+1)
        v0, v1 = field[y, x], field[y, x + 1]
        t = (ISO - v0) / (v1 - v0) if v1 != v0 else 0.5
        return (x + t, y)
    v0, v1 = field[y, x], field[y + 1, x]
    t = (ISO - v0) / (v1 - v0) if v1 != v0 else 0.5
    return (x, y + t)


adj = {}


def link(k1, k2):
    adj.setdefault(k1, []).append(k2)
    adj.setdefault(k2, []).append(k1)


ys, xs = np.nonzero((case > 0) & (case < 15))
for y, x in zip(ys.tolist(), xs.tolist()):
    c = int(case[y, x])
    T, B, L, R = ("h", y, x), ("h", y + 1, x), ("v", y, x), ("v", y, x + 1)
    center = field[y : y + 2, x : x + 2].mean() > ISO
    table = {
        1: [(L, B)], 2: [(B, R)], 3: [(L, R)], 4: [(T, R)],
        5: [(L, T), (B, R)] if center else [(L, B), (T, R)],
        6: [(T, B)], 7: [(L, T)], 8: [(L, T)], 9: [(T, B)],
        10: [(T, R), (L, B)] if center else [(L, T), (B, R)],
        11: [(T, R)], 12: [(L, R)], 13: [(B, R)], 14: [(L, B)],
    }
    for k1, k2 in table[c]:
        link(k1, k2)

loops, seen = [], set()
for start in adj:
    if start in seen:
        continue
    loop, prev, cur = [], None, start
    while True:
        seen.add(cur)
        loop.append(edge_point(cur))
        nxt = [n for n in adj[cur] if n != prev]
        if not nxt:
            break
        prev, cur = cur, nxt[0]
        if cur == start:
            break
    if len(loop) > 8:
        loops.append(np.array(loop) - 1.0)  # 去掉补零偏移


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    s, e = pts[0], pts[-1]
    d = e - s
    n = np.hypot(*d)
    rel = pts - s
    dist = np.abs(d[0] * rel[:, 1] - d[1] * rel[:, 0]) / n if n else np.hypot(*rel.T)
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return np.vstack([rdp(pts[: i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.array([s, e])


def simplify_closed(loop, eps=0.45):
    far = int(np.argmax(np.hypot(*(loop - loop[0]).T)))
    a_ = rdp(loop[: far + 1], eps)
    b_ = rdp(np.vstack([loop[far:], loop[:1]]), eps)
    return np.vstack([a_[:-1], b_[:-1]])


def area(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * (np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


groups = {"mark": [], "word": []}
for loop in loops:
    if abs(area(loop)) < 30:
        continue
    groups["mark" if loop[:, 1].mean() < 670 else "word"].append(simplify_closed(loop))

out = {}
for name, polys in groups.items():
    allp = np.vstack(polys)
    x0, y0 = allp.min(axis=0)
    x1, y1 = allp.max(axis=0)
    d = " ".join(
        "M" + " L".join(f"{px - x0:.1f},{py - y0:.1f}" for px, py in poly) + "Z" for poly in polys
    )
    out[name] = {"d": d, "w": round(float(x1 - x0), 1), "h": round(float(y1 - y0), 1), "n": len(polys)}

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False)
print({k: (v["w"], v["h"], v["n"], len(v["d"])) for k, v in out.items()})
