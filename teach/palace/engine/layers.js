// The 16 ground texture layers (Poly Haven, CC0). Regions refer to them by name; the ground
// material packs them into array textures in this order. `color` is the linear-RGB colour the
// layer is normalised to (texture supplies detail, the region's tint supplies hue drift).
import { C } from './noise.js';

export const LAYERS = [
  { name: 'meadow', file: 'sparse_grass', scale: 3.0, color: C(0.32, 0.36, 0.16) },
  { name: 'forest', file: 'forest_leaves_04', scale: 3.5, color: C(0.28, 0.23, 0.16) },
  { name: 'rock', file: 'rock_face_03', scale: 7.0, color: C(0.33, 0.32, 0.30), triplanar: true },
  { name: 'sand', file: 'sand_01', scale: 4.0, color: C(0.70, 0.50, 0.34) },
  { name: 'trail', file: 'rocky_trail', scale: 2.5, color: C(0.42, 0.35, 0.27) },
  { name: 'strata', file: 'worn_rock_natural_01', scale: 9.0, color: C(0.62, 0.34, 0.20), triplanar: true },
  { name: 'snow', file: 'snow_02', scale: 5.0, color: C(0.86, 0.88, 0.92), triplanar: true },
  { name: 'basalt', file: 'dark_rock', scale: 6.0, color: C(0.14, 0.13, 0.13), triplanar: true },
  { name: 'autumn', file: 'dry_decay_leaves', scale: 3.0, color: C(0.46, 0.27, 0.12) },
  { name: 'limestone', file: 'marble_cliff_02', scale: 10.0, color: C(0.62, 0.61, 0.56), triplanar: true },
  { name: 'salt', file: 'mud_cracked_dry_03', scale: 5.0, color: C(0.88, 0.86, 0.82) },
  { name: 'moss', file: 'mossy_rock', scale: 5.0, color: C(0.26, 0.30, 0.16), triplanar: true },
  { name: 'steppe', file: 'withered_grass', scale: 3.0, color: C(0.50, 0.44, 0.26) },
  { name: 'pebbles', file: 'dry_river_pebbles', scale: 2.5, color: C(0.46, 0.44, 0.40) },
  { name: 'lichen', file: 'lichen_rock', scale: 8.0, color: C(0.42, 0.42, 0.38), triplanar: true },
  { name: 'cinder', file: 'dry_ground_rocks', scale: 3.5, color: C(0.24, 0.20, 0.18) },
];
export const L = Object.fromEntries(LAYERS.map((l, i) => [l.name, i]));
export const NLAYERS = LAYERS.length;
