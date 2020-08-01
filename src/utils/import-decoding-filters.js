import decodingFiltersOrder1Chan1to4 from "../assets/ambisonics/irsMagLs_o1_ch_1to4.wav";

import decodingFiltersOrder2Chan1to8 from "../assets/ambisonics/irsMagLs_o2_ch_1to8.wav";
import decodingFiltersOrder2Chan9to9 from "../assets/ambisonics/irsMagLs_o2_ch_9to9.wav";

import decodingFiltersOrder3Chan1to8 from "../assets/ambisonics/irsMagLs_o3_ch_1to8.wav";
import decodingFiltersOrder3Chan9to16 from "../assets/ambisonics/irsMagLs_o3_ch_9to16.wav";

import decodingFiltersOrder4Chan1to8 from "../assets/ambisonics/irsMagLs_o4_ch_1to8.wav";
import decodingFiltersOrder4Chan9to16 from "../assets/ambisonics/irsMagLs_o4_ch_9to16.wav";
import decodingFiltersOrder4Chan17to24 from "../assets/ambisonics/irsMagLs_o4_ch_17to24.wav";
import decodingFiltersOrder4Chan25to25 from "../assets/ambisonics/irsMagLs_o4_ch_25to25.wav";

export const decodingFilterUrls = [
  [decodingFiltersOrder1Chan1to4],
  [decodingFiltersOrder2Chan1to8, decodingFiltersOrder2Chan9to9],
  [decodingFiltersOrder3Chan1to8, decodingFiltersOrder3Chan9to16],
  [
    decodingFiltersOrder4Chan1to8,
    decodingFiltersOrder4Chan9to16,
    decodingFiltersOrder4Chan17to24,
    decodingFiltersOrder4Chan25to25
  ]
];
