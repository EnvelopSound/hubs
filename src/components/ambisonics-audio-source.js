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
    this.arrayCenter = this.el.object3D.position;
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

    this.loudspeakers = [];
    this.numLoudspeakers = 0;
    for (const lsp of this.LoudspeakerLayout) {
      if (!lsp.IsImaginary) {
        this.loudspeakers.push(new THREE.PositionalAudio(this.audioListener));

        // create threejs mesh objects as loudspeakers
        const geometry = new THREE.BoxGeometry(0.2, 0.5, 0.3);
        const material = new THREE.MeshNormalMaterial({ Color: 0x675d50 });
        const cube = new THREE.Mesh(geometry, material);

        const componentString = "ls" + this.numLoudspeakers;
        const positionCartesian = new THREE.Vector3();
        positionCartesian.setFromSphericalCoords(
          lsp.Radius,
          Math.PI / 2 - THREE.Math.degToRad(lsp.Elevation),
          THREE.Math.degToRad(lsp.Azimuth)
        );
        this.el.setObject3D(componentString, cube);
        const lspObject = this.el.getObject3D(componentString);
        lspObject.position.x = positionCartesian.x;
        lspObject.position.y = positionCartesian.y;
        lspObject.position.z = positionCartesian.z;
        lspObject.lookAt(this.arrayCenter);
        cube.add(this.loudspeakers[this.numLoudspeakers]);

        this.numLoudspeakers++;
      }
    }
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
