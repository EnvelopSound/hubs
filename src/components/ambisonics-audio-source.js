//const components = [];
export class ambisonicsAudioSource extends THREE.Object3D {
  constructor(audioListener) {
    super();
    this.audioListener = audioListener;
    this.gain = 0;
    this.panner = 0; // coneInnerAngle, coneOuterAngle, coneOuterGain
    this.numLoudspeakers = 10;
    this.loudspeakers = [];
    console.log("ambisonics: constructing ambisonicsAudioSource!");

    this.constructLoudspeakers();
  }

  setNodeSource() {
    console.log("ambisonics: setNodeSource");
  }

  disconnect() {
    console.log("ambisonics: disconnect");
  }

  setDistanceModel(newDistanceModel) {
    for (const ls in this.loudspeakers)
      ls.distanceModel = newDistanceModel;
  }

  setRolloffFactor(newRolloffFactor) {
    for (const ls in this.loudspeakers)
      ls.rolloffFactor = newRolloffFactor;
  }

  setRefDistance(newRefDistance) {
    for (const ls in this.loudspeakers)
      ls.refDistance = newRefDistance;
  }

  setMaxDistance(newMaxDistance) {
    for (const ls in this.loudspeakers)
      ls.maxDistance = newMaxDistance;
  }

  constructLoudspeakers() {
    console.log("ambisonics: constructLoudspeakers")
    this.loudspeakers = [];
    for (let i = 0; i < this.numLoudspeakers; ++i)
      this.loudspeakers[i] = new THREE.PositionalAudio(this.audioListener);
  }
}

AFRAME.registerComponent("ambisonics-audio-source", {
  schema: {
    audioUrl: { default: "" },
    jsonSetupUrl: { default: "" }
  }
});
