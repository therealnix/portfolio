import mascotOutline from '../assets/findus-outline.json';

export type ParticleShape = 'findus' | 'shop' | 'music' | 'headphones' | 'spark' | 'modono' | 'linkedin' | 'email' | 'soundcloud';
export type Point = [number, number];

// These paths are sampled into points; no solid icons are rendered in the scene.
const outlines: Record<Exclude<ParticleShape, 'findus'>, string> = {
  shop: 'M44 110 V209 H212 V110 M33 78 L50 43 H206 L223 78 Z M33 78 V99 Q51 126 71 99 V78 M71 99 Q90 126 109 99 V78 M109 99 Q128 126 147 99 V78 M147 99 Q166 126 185 99 V78 M185 99 Q204 126 223 99 V78 M68 138 H112 V184 H68 Z M142 209 V137 H188 V209 M153 172 H156',
  music: 'M101 178 V65 L204 44 V156 M101 89 L204 69 M101 178 C101 207 53 215 46 194 C39 174 83 160 101 178 M204 156 C204 185 156 193 149 172 C142 152 186 138 204 156',
  headphones: 'M45 158 V112 C45 11 211 11 211 112 V158 M45 117 H66 V190 H45 Q30 190 30 171 V139 Q30 117 45 117 M211 117 H190 V190 H211 Q226 190 226 171 V139 Q226 117 211 117 M91 124 V167 M110 100 V187 M129 114 V174 M148 96 V191 M167 128 V161',
  spark: 'M128 27 C138 94 162 116 227 128 C162 140 138 162 128 229 C116 162 94 140 29 128 C94 116 116 94 128 27 Z M210 22 V62 M190 42 H230 M44 199 V229 M29 214 H59',
  modono: 'M51 87 H205 L219 216 H37 Z M89 100 V68 C89 16 167 16 167 68 V100 M83 177 V128 L128 164 L173 128 V177',
  linkedin: 'M41 34 H215 V222 H41 Z M76 101 V184 M76 72 V76 M106 184 V101 H132 V112 C144 94 182 97 182 129 V184 M132 132 V184',
  email: 'M35 65 H221 V193 H35 Z M35 68 L128 143 L221 68 M35 190 L101 132 M221 190 L155 132',
  soundcloud: 'M36 170 H69 V113 H84 V170 H97 V95 H112 V170 H126 V80 H142 V170 H158 V110 C217 96 239 137 218 165 C207 180 190 170 190 170 H158',
};

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
