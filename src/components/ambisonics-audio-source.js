import defaultAmbiDecoderConfig from "../assets/ambisonics/cube.json";
import MatrixMultiplier from "../utils/matrix-multiplier.js";

export class ambisonicsAudioSource extends THREE.Object3D {
  constructor(mediaEl) {
    super();
    this.el = mediaEl;
    this.context = this.el.sceneEl.audioListener.context;
    this.audioListener = this.el.sceneEl.audioListener;
    this.gain = { gain: { value: 1 } };
    this.panner = { coneInnerAngle: 0, coneOuterAngle: 0, coneOuterGain: 0 };
    this.loudspeakers = [];
    console.log("ambisonics: constructing ambisonicsAudioSource!");
  }

  setNodeSource(newMediaElementAudioSource) {
    console.log("ambisonics: setNodeSource");
    // todo: call setNodeSource on each loudspeaker with decoded stream
    this.loudspeakers[0].setNodeSource(newMediaElementAudioSource);
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

    if (!this.LoudspeakerLayout)
      console.error('no loudspeaker setup available!');

    this.numLoudspeakers = this.LoudspeakerLayout.length;
    console.log(this.numLoudspeakers);

    this.loudspeakers = [];
    for (let i = 0; i < this.numLoudspeakers; ++i)
      this.loudspeakers[i] = new THREE.PositionalAudio(this.audioListener);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const cube = new THREE.Mesh(geometry, material);

    this.el.setObject3D("lscube", cube);
    console.log(this.el.object3DMap.lscube);
    this.el.object3DMap.lscube.position.x = 10;
    this.el.object3DMap.lscube.position.y = 0;
    this.el.object3DMap.lscube.position.z = 10;
    cube.add(this.loudspeakers[0]);
  }

  updatePannerProperties() {
    console.log("ambsionics: updatePannerProperties");
    for (const ls of this.loudspeakers) {
      ls.panner.coneInnerAngle = this.panner.coneInnerAngle;
      ls.panner.coneOuterAngle = this.panner.coneOuterAngle;
      ls.panner.coneOuterGain = this.panner.coneOuterGain;
    }
  }

  loadDecoderConfig(newDecoderConfig) {
    console.log("ambisonics: loadDecoderConfig");

    // todo: load json from url (CORS!)

    // let loader = new THREE.FileLoader();
    // loader.load(
    //   newDecoderConfig,

    //   // onLoad callback
    //   function (data) {
    //     // output the text to the console
    //     console.log(data)
    //   },

    //   // onProgress callback
    //   function (xhr) {
    //     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    //   },

    //   // onError callback
    //   function (err) {
    //     console.error('An error happened');
    //   }
    // );

    this.decoderConfig = defaultAmbiDecoderConfig;

    console.log(this.decoderConfig);
    this.LoudspeakerLayout = this.decoderConfig.LoudspeakerLayout.Loudspeakers;
    this.decoderMatrix = this.decoderConfig.Decoder.Matrix;

    console.log(this.LoudspeakerLayout);
    console.log(this.decoderMatrix);

    this.constructLoudspeakers();
  }
}
