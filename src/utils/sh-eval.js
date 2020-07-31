// Evaluate Spherical Harmonics up to third order
// unit vector input

export function shEval(order, vec) {
  const x = vec.x;
  const y = vec.y;
  const z = vec.z;

  const ysh = new Array((order + 1) * (order + 1));

  ysh[0] = 0.2821;

  ysh[1] = 0.4886 * y;
  ysh[2] = 0.4886 * z;
  ysh[3] = 0.4886 * x;

  if (order >= 2) {
    ysh[4] = 1.0925 * x * y;
    ysh[5] = 1.0925 * y * z;
    ysh[6] = 0.3154 * (3 * z * z - 1);
    ysh[7] = 1.0925 * z * x;
    ysh[8] = 1.0925 * (x * x - y * y);
  }

  if (order >= 3) {
    ysh[9] = 0.5900 * (3 * x * x - y * y) * y;
    ysh[10] = 2.8906 * x * y * z;
    ysh[11] = 0.457 * y * (4 * z * z - x * x - y * y);
    ysh[12] = 0.3732 * z * (2 * z * z - 3 * x * x - 3 * y * y);
    ysh[13] = 0.4570 * x * (4 * z * z - x * x - y * y);
    ysh[14] = 2.8906 * (x * x - y * y) * z;
    ysh[15] = 0.5900 * (x * x - 3 * y * y) * x;
  }

  return ysh; 
}