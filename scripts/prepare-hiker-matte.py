"""Cut the two hikers out of the opening photograph along the real edges of their clothes.

The clean plate (public/flight/mountain-clean.webp) is the same photograph without the hikers, aligned to
within a pixel. Where the two differ, there is a person. The hand-measured outline in src/flight/photo-scene.ts
only limits where to look, so rocks and haze further away are never picked up.

Edge pixels are a mix of person and sky. Their colour is replaced by the nearest solid colour of the person,
so no background travels with the hikers when the camera moves.

Writes public/flight/hikers.webp (RGBA, cropped to the hikers) and prints the crop rectangle in normalized
photo coordinates for HIKER_CROP in photo-scene.ts. Needs Pillow, numpy and scipy:

    python scripts/prepare-hiker-matte.py [preview-dir]
"""
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None
original = Image.open(os.path.join(ROOT, 'public/flight/mountain-upscaled.webp')).convert('RGB')
W, H = original.size
clean = Image.open(os.path.join(ROOT, 'public/flight/mountain-clean.webp')).convert('RGB').resize((W, H), Image.LANCZOS)
I = np.asarray(original).astype(np.float32) / 255
B = np.asarray(clean).astype(np.float32) / 255

# The hand-measured outline, with the same corrections photo-scene.ts applies.
source = open(os.path.join(ROOT, 'src/flight/photo-scene.ts'), encoding='utf-8').read()
block = source[source.index('const hikers = ['):source.index('];', source.index('const hikers = ['))]
points = [(float(u), float(v)) for u, v in re.findall(r'\[([\d.]+), ([\d.]+)\]', block)]


def corrected(u, v):
    if u < .335 and .67 < v < .8:
        u -= .007
    if .45 < u < .496 and .495 < v < .63:
        u -= .008
    if .575 < u < .612 and .5 < v < .66:
        u += .004
    return u * W, v * H


outline = Image.new('L', (W, H), 0)
ImageDraw.Draw(outline).polygon([corrected(u, v) for u, v in points], fill=255)
inside = np.asarray(outline) > 127
distance_out = ndimage.distance_transform_edt(~inside)
distance_in = ndimage.distance_transform_edt(inside)
search = distance_out <= 32          # where a person may be
core = distance_in >= 16             # certainly a person

# Difference to the clean plate, lightly smoothed so photo grain does not fray the edge.
difference = ndimage.gaussian_filter(np.sqrt(((I - B) ** 2).sum(-1)), 1.0)
luma = lambda image: ndimage.gaussian_filter(image @ np.array([.299, .587, .114], np.float32), 1.0)
# Inside the outline, anything that differs from the clean plate is the person; the rest is background.
person = (difference > .1) & inside
# Outside it, the AI clean plate sometimes painted a ridge a little differently. Only take what is clearly a
# silhouette against the brighter sky behind it, or differs very strongly.
person |= search & ~inside & (difference > .16) & ((luma(I) < luma(B) - .04) | (difference > .4))
# Thin lines and spikes (a ridge one pixel off between the two images, haze painted a little differently)
# are not people: anything narrower than about nine pixels that sticks out of the silhouette is dropped.
disk = np.hypot(*np.mgrid[-4:5, -4:5]) <= 4.2
person = ndimage.binary_opening(person, structure=disk)
person |= core
labels, _ = ndimage.label(person)
keep = np.unique(labels[core])
person = np.isin(labels, keep[keep > 0])
person = ndimage.binary_closing(person, structure=ndimage.generate_binary_structure(2, 1), iterations=3)
person = ndimage.binary_fill_holes(person)

# A soft edge about one and a half pixels wide, centred on the boundary.
signed = ndimage.distance_transform_edt(person) - ndimage.distance_transform_edt(~person)
alpha = np.clip(.5 + signed / 1.5, 0, 1)

# Edge colours: the share of the clean background is taken out of each edge pixel (we know that background
# exactly), so the edge keeps its own light, such as the sunlit rim, without carrying sky along. Where the
# person covers too little of the pixel for that to be reliable, the nearest solid colour of the person is used.
solid = alpha >= .999
_, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
colour = I.copy()
a3 = np.maximum(alpha, 1e-3)[..., None]
unmixed = np.clip(B + (I - B) / a3, 0, 1)
nearest = I[iy, ix]
weight = np.clip((alpha - .2) / .3, 0, 1)[..., None]
edge = ~solid
colour[edge] = (unmixed * weight + nearest * (1 - weight))[edge]

ys, xs = np.nonzero(alpha > 0)
pad = 4
x0, x1 = max(0, xs.min() - pad), min(W, xs.max() + 1 + pad)
y0, y1 = max(0, ys.min() - pad), min(H, ys.max() + 1 + pad)
rgba = np.dstack([colour, alpha])[y0:y1, x0:x1]
image = Image.fromarray((rgba * 255 + .5).astype(np.uint8), 'RGBA')
target = os.path.join(ROOT, 'public/flight/hikers.webp')
# exact keeps the colour under transparent pixels, so texture filtering never pulls in a dark fringe.
image.save(target, 'WEBP', quality=92, alpha_quality=100, method=6, exact=True)
print(f'HIKER_CROP = [{x0 / W:.6f}, {y0 / H:.6f}, {x1 / W:.6f}, {y1 / H:.6f}]  # u0, v0, u1, v1')
print(f'{image.size[0]} x {image.size[1]} px, {os.path.getsize(target)} bytes')

if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    a = alpha[..., None]
    # Over the clean plate exactly: must reproduce the photograph.
    home = colour * a + B * (1 - a)
    covered = alpha > 0
    error = np.abs(home - I).max(-1)[covered]
    print(f'at the opening view, over the hikers: mean difference {error.mean():.4f},',
          f'pixels off by more than 10%: {(error > .1).sum()} of {covered.sum()}')
    # Over the clean plate shifted sideways, as during the fly-by: shows halos and leftovers.
    shifted = np.roll(B, -60, axis=1)
    moved = colour * a + shifted * (1 - a)
    for name, picture in [('cutout-over-shifted', moved), ('cutout-over-flat', colour * a + np.array([.85, .2, .6]) * (1 - a))]:
        Image.fromarray((np.clip(picture, 0, 1) * 255).astype(np.uint8)).crop((x0, y0, x1, y1)).save(os.path.join(PREVIEW, name + '.png'))
    Image.fromarray((alpha * 255).astype(np.uint8)).crop((x0, y0, x1, y1)).save(os.path.join(PREVIEW, 'alpha.png'))
    # Gained outside the outline in green, removed inside it in red, over the photograph.
    overlay = I.copy()
    overlay[person & ~inside] = overlay[person & ~inside] * .3 + np.array([0, 1, 0]) * .7
    overlay[~person & inside] = overlay[~person & inside] * .3 + np.array([1, 0, 0]) * .7
    Image.fromarray((overlay * 255).astype(np.uint8)).crop((x0, y0, x1, y1)).save(os.path.join(PREVIEW, 'changes.png'))
    Image.fromarray((np.clip(difference * 3, 0, 1) * 255).astype(np.uint8)).crop((x0, y0, x1, y1)).save(os.path.join(PREVIEW, 'difference.png'))
