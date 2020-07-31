import defaultAmbiDecoderConfig from "../assets/ambisonics/cube.json";
import MatrixMultiplier from "../utils/webaudio-matrix-multiplier.js";
import irsMagLs_01to08ch from "../assets/ambisonics/irsMagLs_01-08ch.wav";
import irsMagLs_09to16ch from "../assets/ambisonics/irsMagLs_09-16ch.wav";
import { n3dToSn3dDecoderMatrix } from "../utils/sh-eval";
import HOAloader from "../utils/hoa-loader.js";
import BinauralDecoder from "../utils/hoa-decoder.js";
import monoEncoder from "../utils/ambi-monoEncoder.js";

export class ambisonicsAudioSource extends THREE.Object3D {
  constructor(mediaEl, order) {
    super();

    // create new entity for loudspeaker array and add to scene
    this.el = document.createElement("a-entity"); // entity for loudspeaker array
    document.querySelector("a-scene").appendChild(this.el);

    this.mediaEl = mediaEl; // entity for element containing audio / video player
    this.context = this.mediaEl.sceneEl.audioListener.context;
    this.audioListener = this.mediaEl.sceneEl.audioListener;
    this.order = order;
    this.panner = { coneInnerAngle: 0, coneOuterAngle: 0, coneOuterGain: 0 };
    this.loudspeakers = [];
    this.arrayCenter = this.mediaEl.object3D.position;
    this.masterGain = 1;
    this.refDistance = 1;
    console.log("ambisonics: constructing ambisonicsAudioSource!");
    this.hrirUrls = [irsMagLs_01to08ch, irsMagLs_09to16ch];
  }

  disconnect() {
    console.log("ambisonics: disconnect");
  }

  setDistanceModel(newDistanceModel) {
    // todo: unused
    this.distanceModel = newDistanceModel;
  }

  setRolloffFactor(newRolloffFactor) {
    this.rolloffFactor = newRolloffFactor;
  }

  setRefDistance(newRefDistance) {
    this.refDistance = newRefDistance;
  }

  setMaxDistance(newMaxDistance) {
    // todo: unused
    this.maxDistance = newMaxDistance;
  }

  constructLoudspeakers() {
    console.log("ambisonics: constructLoudspeakers");

    if (!this.LoudspeakerLayout) console.error("no loudspeaker setup available!");

    this.arrayCenter = this.mediaEl.object3D.position;
    this.arrayCenter.x += this.loudspeakerArrayOffsetVector.x;
    this.arrayCenter.y += this.loudspeakerArrayOffsetVector.y;
    this.arrayCenter.z += this.loudspeakerArrayOffsetVector.z;

    this.loudspeakers = [];
    this.numLoudspeakers = 0;
    for (const lsp of this.LoudspeakerLayout) {
      if (!lsp.IsImaginary) {
        // create threejs mesh objects as loudspeakers
        const geometry = new THREE.BoxGeometry(0.3, 0.6, 0.4);
        const material = new THREE.MeshNormalMaterial();
        const lspObject = new THREE.Mesh(geometry, material);
        this.loudspeakers.push(lspObject);

        const componentString = "ls" + this.numLoudspeakers;
        const positionCartesian = new THREE.Vector3();
        positionCartesian.setFromSphericalCoords(
          lsp.Radius,
          Math.PI / 2 - THREE.Math.degToRad(lsp.Elevation),
          THREE.Math.degToRad(lsp.Azimuth)
        );

        this.el.setObject3D(componentString, lspObject);
        // const lspObject = this.el.getObject3D(componentString);

        // set to correct position
        lspObject.position.x = positionCartesian.x + this.loudspeakerArrayOffsetVector.x;
        lspObject.position.y = positionCartesian.y + this.loudspeakerArrayOffsetVector.y;
        lspObject.position.z = positionCartesian.z + this.loudspeakerArrayOffsetVector.z;

        lspObject.lookAt(this.arrayCenter);
        lspObject.visible = this.loudspeakerVisible;

        // add gain nodes
        lspObject.gain = this.context.createGain();

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
  }

  setMediaElementAudioSource(newSource) {
    this.ambisonicsSource = newSource;
  }

  setupAudioRoutingGraph() {
    // decoding to virtual loudspeakers
    console.log("ambisonics: setting up decoder");

    if (this.decoderExpectedInputNormalization == "n3d"){
      this.decoderMatrix = n3dToSn3dDecoderMatrix(this.decoderMatrix);
    }

    this.loudspeakerDecoder = new MatrixMultiplier(this.context, this.decoderMatrix);
    this.loudspeakerDecoderOutSplitter = this.context.createChannelSplitter(this.numLoudspeakers);
    this.binauralDecoder = new BinauralDecoder(this.context, this.order);
    this.hoaloader = new HOAloader(this.context, this.order, this.hrirUrls, loadedBuffer => {
      this.binauralDecoder.updateFilters(loadedBuffer);
    });
    this.hoaloader.load();

    // connect media to decoder
    this.ambisonicsSource.connect(this.loudspeakerDecoder.in);
    this.loudspeakerDecoder.out.connect(this.loudspeakerDecoderOutSplitter);

    // connect the decoder outputs to virtual loudspeakers
    for (let i = 0; i < this.numLoudspeakers; ++i) {
      const lsp = this.loudspeakers[i];
      lsp.encoder = new monoEncoder(this.context, this.order);
      this.loudspeakerDecoderOutSplitter.connect(
        lsp.gain,
        i,
        0
      );
      lsp.gain.connect(lsp.encoder.in);
      lsp.encoder.out.connect(this.binauralDecoder.in);
    }

    this.binauralDecoder.out.connect(this.context.destination);
  }

  loadDecoderConfig(newDecoderConfigUrl, newLoudspeakerArrayOffset, loudspeakerShouldBeVisible) {
    if (
      this.decoderConfigUrl === newDecoderConfigUrl &&
      this.loudspeakerArrayOffset === newLoudspeakerArrayOffset &&
      this.loudspeakerVisible === loudspeakerShouldBeVisible
    )
      return;

    console.log("ambisonics: loadDecoderConfig");
    this.decoderConfigUrl = newDecoderConfigUrl;

    this.decoderConfig = defaultAmbiDecoderConfig;

    this.LoudspeakerLayout = this.decoderConfig.LoudspeakerLayout.Loudspeakers;
    this.decoderMatrix = this.decoderConfig.Decoder.Matrix;

    this.decoderExpectedInputNormalization = this.decoderConfig.Decoder.ExpectedInputNormalization;

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
    this.setupAudioRoutingGraph();
  }

  // eslint-disable-next-line no-unused-vars
  updateMatrixWorld(_force) {
    const lsPosition = new THREE.Vector3();
    const lsQuaternion = new THREE.Quaternion();
    const lsScale = new THREE.Vector3();
    //const lsOrientation = new THREE.Vector3();
    const avatarPosition = new THREE.Vector3();
    const avatarLookingDirectionCartesian = new THREE.Vector3();
    const avatarLookingDirectionSpherical = new THREE.Spherical();
    const avatarToLoudspeakerDirectionCartesian = new THREE.Vector3();
    const avatarToLoudspeakerDirectionSpherical = new THREE.Spherical();
    const encodingDirection = new THREE.Vector3();
    this.mediaEl.sceneEl.camera.getWorldDirection(avatarLookingDirectionCartesian);
    this.mediaEl.sceneEl.camera.getWorldPosition(avatarPosition);
    avatarLookingDirectionSpherical.setFromVector3(avatarLookingDirectionCartesian);

    for (const ls of this.loudspeakers) {
      ls.matrixWorld.decompose(lsPosition, lsQuaternion, lsScale);
      avatarToLoudspeakerDirectionCartesian.subVectors(lsPosition, avatarPosition);
      avatarToLoudspeakerDirectionSpherical.setFromVector3(avatarToLoudspeakerDirectionCartesian);
      encodingDirection.setFromSphericalCoords(
        1,
        avatarToLoudspeakerDirectionSpherical.phi - avatarLookingDirectionSpherical.phi + Math.PI / 2,
        avatarToLoudspeakerDirectionSpherical.theta - avatarLookingDirectionSpherical.theta
      );

      ls.encoder.updateGains(encodingDirection.z, encodingDirection.x, encodingDirection.y);

      // todo: use orientation to apply loudspeaker directivity
      // lsOrientation.set(0, 0, 1).applyQuaternion(lsQuaternion);

      const distance = avatarPosition.distanceTo(lsPosition);
      // use inverse distance law, implementation as in Firefox PannerNode
      const distanceBasedAttenuation =
        this.refDistance /
        (this.refDistance + this.rolloffFactor * (Math.max(distance, this.refDistance) - this.refDistance));

      ls.gain.gain.value = this.masterGain * distanceBasedAttenuation;

      // if (ls === this.loudspeakers[0]) {
      //   // console.log("azi: " + 180 / Math.PI * (avatarToLoudspeakerDirectionSpherical.theta - avatarLookingDirectionSpherical.theta));
      //   // console.log("zen: " + -180 / Math.PI * (avatarToLoudspeakerDirectionSpherical.phi - avatarLookingDirectionSpherical.phi));
      //   console.log(encodingDirection);
      // }

      // Need to update the position on this node if either the listener moves or this node moves,
      // because otherwise there are audio artifacts in Chrome.
      // if (
      //   setInitial ||
      //   Math.abs(position.x - this._lastPosition.x) > Number.EPSILON ||
      //   Math.abs(position.y - this._lastPosition.y) > Number.EPSILON ||
      //   Math.abs(position.z - this._lastPosition.z) > Number.EPSILON ||
      //   Math.abs(orientation.x - this._lastOrientation.x) > Number.EPSILON ||
      //   Math.abs(orientation.y - this._lastOrientation.y) > Number.EPSILON ||
      //   Math.abs(orientation.z - this._lastOrientation.z) > Number.EPSILON ||
      //   (listener.positionX && Math.abs(listener.positionX.value - this._lastListenerPosition.x) > Number.EPSILON) ||
      //   (listener.positionY && Math.abs(listener.positionY.value - this._lastListenerPosition.y) > Number.EPSILON) ||
      //   (listener.positionZ && Math.abs(listener.positionZ.value - this._lastListenerPosition.z) > Number.EPSILON)
      // ) {
      //   panner.setPosition(position.x, position.y, position.z);
      //   panner.setOrientation(orientation.x, orientation.y, orientation.z);

      //   this._lastPosition.x = position.x;
      //   this._lastPosition.y = position.y;
      //   this._lastPosition.z = position.z;

      //   this._lastOrientation.x = orientation.x;
      //   this._lastOrientation.y = orientation.y;
      //   this._lastOrientation.z = orientation.z;

      //   if (listener.positionX && listener.positionY && listener.positionZ) {
      //     this._lastListenerPosition.x = listener.positionX.value;
      //     this._lastListenerPosition.y = listener.positionY.value;
      //     this._lastListenerPosition.z = listener.positionZ.value;
      //   }
      // }
    }
  }
}
