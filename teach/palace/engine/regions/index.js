// Region registry. Each region module exports: name, floor, floorNoise?, lift keyframes, height(),
// surface(), grass(), flora[], atmosphere{}, vignettes[] and optionally water. See forest.js for
// the contract.
import forest from './forest.js';
import taiga from './taiga.js';
import alpine from './alpine.js';
import glacial from './glacial.js';
import autumn from './autumn.js';
import karst from './karst.js';
import canyon from './canyon.js';
import saltflat from './saltflat.js';
import volcanic from './volcanic.js';
import steppe from './steppe.js';
import seacliffs from './seacliffs.js';
import pass from './pass.js';

export const REGIONS = { forest, taiga, alpine, glacial, autumn, karst, canyon, saltflat, volcanic, steppe, seacliffs, pass };
