// Evaluate Spherical Harmonics up to third order
// unit vector input

const sn3dToN3dWeights = [
  1.0,
  1.7321,
  1.7321,
  1.7321,
  2.2361,
  2.2361,
  2.2361,
  2.2361,
  2.2361,
  2.6458,
  2.6458,
  2.6458,
  2.6458,
  2.6458,
  2.6458,
  2.6458,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3
];

export function shEval(order, x, y, z) {
  // this uses a coordinate system as commonly used in ambisonics: +x front, +y left, +z up
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
    ysh[8] = 0.5463 * (x * x - y * y);
  }

  if (order >= 3) {
    ysh[9] = 0.5900 * (3 * x * x - y * y) * y;
    ysh[10] = 2.8906 * x * y * z;
    ysh[11] = 0.457 * y * (4 * z * z - x * x - y * y);
    ysh[12] = 0.3732 * z * (2 * z * z - 3 * x * x - 3 * y * y);
    ysh[13] = 0.4570 * x * (4 * z * z - x * x - y * y);
    ysh[14] = 1.4453 * (x * x - y * y) * z;
    ysh[15] = 0.5900 * (x * x - 3 * y * y) * x;
  }

  if (order >= 4) {
    ysh[16] = 2.5033 * x * y * (x * x - y * y);
    ysh[17] = 1.7701 * (3 * x * x - y * y) * y * z;
    ysh[18] = 0.9462 * x * y * (7 * z * z - 1);
    ysh[19] = 0.6690 * y * z * (7 * z * z - 3);
    ysh[20] = 0.1058 * (35 * z * z * z * z - 30 * z * z + 3);
    ysh[21] = 0.6690 * x * z * (7 * z * z - 3);
    ysh[22] = 0.4731 * (x * x - y * y) * (7 * z * z - 1);
    ysh[23] = 1.7701 * (x * x - 3 * y * y) * x * z;
    ysh[24] = 0.6258 * (x * x * (x * x - 3 * y * y) - y * y * (3 * x * x - y * y));
  }

  return ysh;
}

export function sn3dToN3d(ysh) {
  // converts a vector of ambi coefficients
  const order = Math.sqrt(ysh.length) - 1;
  for (let iSh = 0; iSh < (order + 1) * (order + 1); iSh++) {
    ysh[iSh] *= sn3dToN3dWeights[iSh];
  }
  return ysh;
}

export function n3dToSn3d(ysh) {
  // converts a vector of ambi coefficients
  const order = Math.sqrt(ysh.length) - 1;
  for (let iSh = 0; iSh < (order + 1) * (order + 1); iSh++) {
    ysh[iSh] /= sn3dToN3dWeights[iSh];
  }
  return ysh;
}

export function n3dToSn3dDecoderMatrix(decoderMatrix) {
  // converts a decoder matrix that expects n3d to expect sn3d
  const order = Math.sqrt(decoderMatrix[0].length) - 1;

  for (let iSpeaker = 0; iSpeaker < decoderMatrix.length; iSpeaker++) {
    for (let iSh = 0; iSh < (order + 1) * (order + 1); iSh++) {
      decoderMatrix[iSpeaker][iSh] *= sn3dToN3dWeights[iSh];
    }
  }

  return decoderMatrix;
}
