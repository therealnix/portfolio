import mascotOutline from '../assets/findus-outline.json';

export type ParticleShape = 'findus' | 'shop' | 'music' | 'headphones' | 'spark' | 'modono' | 'linkedin' | 'email' | 'soundcloud' | 'car';
export type Point = [number, number];

// These paths are sampled into points; no solid icons are rendered in the scene.
const outlines: Record<Exclude<ParticleShape, 'findus'>, string> = {
  car: 'M38 126 L59 69 Q62 60 74 60 H182 Q194 60 197 69 L218 126 M59 108 L72 76 H184 L197 108 Z M38 126 Q27 132 27 147 V191 H229 V147 Q229 132 218 126 Z M27 166 H229 M48 139 H82 V153 H48 Z M174 139 H208 V153 H174 Z M100 141 H156 V154 H100 Z M39 191 V211 H70 V191 M186 191 V211 H217 V191',
  shop: 'M44 110 V209 H212 V110 M33 78 L50 43 H206 L223 78 Z M33 78 V99 Q51 126 71 99 V78 M71 99 Q90 126 109 99 V78 M109 99 Q128 126 147 99 V78 M147 99 Q166 126 185 99 V78 M185 99 Q204 126 223 99 V78 M68 138 H112 V184 H68 Z M142 209 V137 H188 V209 M153 172 H156',
  music: 'M101 178 V65 L204 44 V156 M101 89 L204 69 M101 178 C101 207 53 215 46 194 C39 174 83 160 101 178 M204 156 C204 185 156 193 149 172 C142 152 186 138 204 156',
  headphones: 'M45 158 V112 C45 11 211 11 211 112 V158 M45 117 H66 V190 H45 Q30 190 30 171 V139 Q30 117 45 117 M211 117 H190 V190 H211 Q226 190 226 171 V139 Q226 117 211 117 M91 124 V167 M110 100 V187 M129 114 V174 M148 96 V191 M167 128 V161',
  spark: 'M128 27 C138 94 162 116 227 128 C162 140 138 162 128 229 C116 162 94 140 29 128 C94 116 116 94 128 27 Z M210 22 V62 M190 42 H230 M44 199 V229 M29 214 H59',
  modono: 'M51 87 H205 L219 216 H37 Z M89 100 V68 C89 16 167 16 167 68 V100 M83 177 V128 L128 164 L173 128 V177',
  linkedin: 'M42 32 H214 Q224 32 224 42 V214 Q224 224 214 224 H42 Q32 224 32 214 V42 Q32 32 42 32 Z M65 102 H91 V192 H65 Z M91 73 A13 13 0 1 1 65 73 A13 13 0 1 1 91 73 Z M110 192 V102 H136 V114 C146 93 193 95 193 132 V192 H167 V139 C167 117 136 117 136 140 V192 Z',
  email: 'M35 65 H221 V193 H35 Z M35 68 L128 143 L221 68 M35 190 L101 132 M221 190 L155 132',
  soundcloud: 'M20 142 V167 M35 127 V180 M50 113 V184 M65 98 V184 M80 108 V184 M95 83 V184 M110 70 V184 M126 184 V66 C156 52 189 76 193 114 C244 101 260 184 215 184 Z',
};

/** The same contact outlines as plain SVG path data, for views that draw no particles. */
export const CONTACT_OUTLINES = { linkedin: outlines.linkedin, email: outlines.email, soundcloud: outlines.soundcloud };

function normalize(points: Point[]): Point[] {
  if (!points.length) return [];
  let minX = 256, minY = 256, maxX = 0, maxY = 0;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const size = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  return points.map(([x, y]) => [(x - (minX + maxX) / 2) / size, (y - (minY + maxY) / 2) / size]);
}

let shapesPromise: Promise<Record<ParticleShape, Point[]>> | undefined;

export function loadParticleShapes() {
  return shapesPromise ??= buildShapes();
}

async function buildShapes(): Promise<Record<ParticleShape, Point[]>> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const shapes = {} as Record<ParticleShape, Point[]>;
  if (!ctx) return shapes;

  for (const [name, path] of Object.entries(outlines)) {
    if (['linkedin', 'email', 'soundcloud'].includes(name)) {
      // Space the limited contact points evenly around each outline rather than sampling scanlines.
      const contour = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      contour.setAttribute('d', path);
      const length = contour.getTotalLength();
      shapes[name as ParticleShape] = normalize(Array.from({ length: 1600 }, (_, i) => {
        const point = contour.getPointAtLength(length * i / 1600);
        return [point.x, point.y] as Point;
      }));
      continue;
    }
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(path));
    const pixels = ctx.getImageData(0, 0, 256, 256).data;
    const points: Point[] = [];
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        if (pixels[(y * 256 + x) * 4 + 3] > 120) points.push([x, y]);
      }
    }
    shapes[name as ParticleShape] = normalize(points);
  }

  // Exact silhouette, eyes, smile and antenna sampled from the hub's FindusAvatar.
  // Regenerate with scripts/sample-mascot.ps1; no large raster is shipped.
  shapes.findus = normalize(mascotOutline as Point[]);
  return shapes;
}
