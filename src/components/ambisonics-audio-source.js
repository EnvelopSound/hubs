//const components = [];
export class ambisonicsAudioSource extends THREE.Object3D {
  constructor(audioListener) {
    super();
    this.audioListener = audioListener;
    this.gain = 0;
    this.panner = { coneInnerAngle: 0, coneOuterAngle: 0, coneOuterGain: 0 };
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
    for (const ls of this.loudspeakers)
      ls.distanceModel = newDistanceModel;
  }

  setRolloffFactor(newRolloffFactor) {
    for (const ls of this.loudspeakers)
      ls.rolloffFactor = newRolloffFactor;
  }

  setRefDistance(newRefDistance) {
    for (const ls of this.loudspeakers)
      ls.refDistance = newRefDistance;
  }

  setMaxDistance(newMaxDistance) {
    for (const ls of this.loudspeakers)
      ls.maxDistance = newMaxDistance;
  }

  constructLoudspeakers() {
    console.log("ambisonics: constructLoudspeakers");
    this.loudspeakers = [];
    for (let i = 0; i < this.numLoudspeakers; ++i)
      this.loudspeakers[i] = new THREE.PositionalAudio(this.audioListener);
  }

  updatePannerProperties() {
    console.log("ambsionics: updatePannerProperties");
    for (const ls of this.loudspeakers) {
      ls.panner.coneInnerAngle = this.panner.coneInnerAngle;
      ls.panner.coneOuterAngle = this.panner.coneOuterAngle;
      ls.panner.coneOuterGain = this.panner.coneOuterGain;
    }
  }
}
