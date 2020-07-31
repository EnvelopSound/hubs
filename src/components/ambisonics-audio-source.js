import defaultAmbiDecoderConfig from "../assets/ambisonics/cube.json";
import MatrixMultiplier from "../utils/matrix-multiplier.js";

export class ambisonicsAudioSource extends THREE.PositionalAudio {
  constructor(mediaEl) {
    super(mediaEl.sceneEl.audioListener);

    // create new entity for loudspeaker array and add to scene
    this.el = document.createElement("a-entity"); // entity for loudspeaker array
    document.querySelector("a-scene").appendChild(this.el);

    this.mediaEl = mediaEl; // entity for element containing audio / video player
    this.context = this.mediaEl.sceneEl.audioListener.context;
    this.audioListener = this.mediaEl.sceneEl.audioListener;
    this.loudspeakers = [];
    this.arrayCenter = this.mediaEl.object3D.position;
    this.masterGain = 1;
    console.log("ambisonics: constructing ambisonicsAudioSource!");
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

    this.arrayCenter = this.mediaEl.object3D.position;
    this.arrayCenter.x += this.loudspeakerArrayOffsetVector.x;
    this.arrayCenter.y += this.loudspeakerArrayOffsetVector.y;
    this.arrayCenter.z += this.loudspeakerArrayOffsetVector.z;

    this.loudspeakers = [];
    this.numLoudspeakers = 0;
    for (const lsp of this.LoudspeakerLayout) {
      if (!lsp.IsImaginary) {
        this.loudspeakers.push(new THREE.PositionalAudio(this.audioListener));

        // create threejs mesh objects as loudspeakers
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
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

        lspObject.position.x = positionCartesian.x + this.loudspeakerArrayOffsetVector.x;
        lspObject.position.y = positionCartesian.y + this.loudspeakerArrayOffsetVector.y;
        lspObject.position.z = positionCartesian.z + this.loudspeakerArrayOffsetVector.z;

        lspObject.lookAt(this.arrayCenter);
        cube.add(this.loudspeakers[this.numLoudspeakers]);

        cube.visible = this.loudspeakerVisible;
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

  setMasterGain(newMasterGain) {
    console.log("ambisonics: set master gain");
    this.masterGain = newMasterGain;

    for (const ls of this.loudspeakers)
      ls.gain.gain.value = newMasterGain;
  }

  setupConnectDecoder(mediaElementAudioSource) {
    console.log("ambisonics: setting up decoder");
    this.decoderNode = new MatrixMultiplier(this.context, this.decoderMatrix);

    // connect media to decoder
    mediaElementAudioSource.connect(this.decoderNode.in);

    // split decoder Output
    this.outSplit = this.context.createChannelSplitter(this.numLoudspeakers);
    this.decoderNode.out.connect(this.outSplit);

    // connect the decoder outputs to virtual speakers
    for (let i = 0; i < this.numLoudspeakers; ++i)
      this.outSplit.connect(this.loudspeakers[i].panner, i, 0);
  }

  setDistanceBasedAttenuation(newAvatarPosition, newMasterGain) {
    const positionA = new THREE.Vector3();

    for (const ls of this.loudspeakers) {
      ls.object3D.getWorldPosition(positionA);
      const distance = positionA.distanceTo(newAvatarPosition);
      const distanceBasedAttenuation = Math.min(1, 10 / Math.max(1, distance * distance));
      ls.gain.gain.value = newMasterGain * distanceBasedAttenuation;
    }
  }

  loadDecoderConfig(newDecoderConfigUrl, newLoudspeakerArrayOffset, loudspeakerShouldBeVisible) {
    if (this.decoderConfigUrl === newDecoderConfigUrl)
      return;

    console.log("ambisonics: loadDecoderConfig");
    this.decoderConfigUrl = newDecoderConfigUrl;

    this.decoderConfig = defaultAmbiDecoderConfig;

    this.LoudspeakerLayout = this.decoderConfig.LoudspeakerLayout.Loudspeakers;
    this.decoderMatrix = this.decoderConfig.Decoder.Matrix;

    this.loudspeakerArrayOffset = newLoudspeakerArrayOffset;
    this.loudspeakerVisible = loudspeakerShouldBeVisible;

    const offsetNormalVectorAzi = this.el.object3D.rotation._y;
    const offsetNormalVectorZen = Math.PI / 2 - this.el.object3D.rotation._x;

    this.loudspeakerArrayOffsetVector = new THREE.Vector3();
    this.loudspeakerArrayOffsetVector.setFromSphericalCoords(
      this.loudspeakerArrayOffset,
      offsetNormalVectorZen,
      offsetNormalVectorAzi
    );

    this.constructLoudspeakers();
  }
}
