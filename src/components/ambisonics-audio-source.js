import grazArray from "../assets/ambisonics/grazArray.json";
import grazArrayXL from "../assets/ambisonics/grazArrayXL.json";
import envelopSF from "../assets/ambisonics/envelopSF.json";
import envelopSFXL from "../assets/ambisonics/envelopSFXL.json";
import ico from "../assets/ambisonics/ico.json";
import MatrixMultiplier from "../utils/webaudio-matrix-multiplier.js";
import { decodingFilterUrls } from "../utils/import-decoding-filters.js";
import brir from "../assets/ambisonics/brir_hp_no_direct8192.wav";
import { n3dToSn3dDecoderMatrix } from "../utils/sh-eval";
import HOALoader from "../utils/hoa-loader.js";
import BinauralDecoder from "../utils/hoa-decoder.js";
import MonoEncoder from "../utils/ambi-monoEncoder.js";

export class AmbisonicsAudioSource extends THREE.Object3D {
  constructor(mediaEl, order) {
    super();

    // create new entity for loudspeaker array and add to scene
    this.el = document.createElement("a-entity"); // entity for loudspeaker array
    document.querySelector("a-scene").appendChild(this.el);

    this.mediaEl = mediaEl; // entity for element containing audio / video player
    this.context = this.mediaEl.sceneEl.audioListener.context;
    this.audioListener = this.mediaEl.sceneEl.audioListener;
    this.binauralDecodingOrder = order;
    this.panner = { coneInnerAngle: 0, coneOuterAngle: 0, coneOuterGain: 0 };
    this.loudspeakers = [];
    this.arrayCenter = this.mediaEl.object3D.position;
    this.masterGain = 1;
    this.refDistance = 1;
    this.roomSimulationLevel = 1;
    console.log("created new ambisonics audio source with binaural decoding order " + this.binauralDecodingOrder);
    this.decodingFilterUrls = decodingFilterUrls;
  }

  disconnect() {
    this.el.parentNode.removeChild(this.el);
    this.el.destroy();
  }

  setRolloffFactor(newRolloffFactor) {
    this.rolloffFactor = newRolloffFactor;
  }

  setRefDistance(newRefDistance) {
    this.refDistance = newRefDistance;
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
          THREE.Math.degToRad(lsp.Azimuth) + Math.PI // add pi because video screen looks in +z direction
        );

        this.el.setObject3D(componentString, lspObject);
        // const lspObject = this.el.getObject3D(componentString);

        // set to correct position
        lspObject.position.x = positionCartesian.x + this.arrayCenter.x;
        lspObject.position.y = positionCartesian.y + this.arrayCenter.y;
        lspObject.position.z = positionCartesian.z + this.arrayCenter.z;

        lspObject.lookAt(this.arrayCenter);
        lspObject.visible = this.loudspeakerVisible;

        // add gain nodes
        lspObject.gain = this.context.createGain();

        lspObject.setInitial = true;

        this.numLoudspeakers++;
      }
    }
  }

  setMasterGain(newMasterGain) {
    console.log("ambisonics: set master gain");
    this.masterGain = newMasterGain;
    if (this.gainOut) {
      this.gainOut.gain.value = this.masterGain;
    }
  }

  setInputOrder(newInputOrder) {
    this.inputStreamOrder = newInputOrder;
    this.checkInputOrder();
  }

  checkInputOrder() {
    if (
      this.loudspeakerDecoder &&
      this.inputStreamOrder &&
      this.loudspeakerDecoder.decoderOrder !== this.inputStreamOrder
    ) {
      console.warn("Warning: DASH stream order and Ambisonics decoding order are not the same!");
      console.log("loudspeaker decoder order: " + this.loudspeakerDecoder.decoderOrder);
      console.log("input stream order " + this.inputStreamOrder);
    }
  }

  setMediaElementAudioSource(newSource) {
    this.ambisonicsSource = newSource;
  }

  setRoomSimulationLevel(newLevel) {
    this.roomSimulationLevel = newLevel;
    if (this.context.roomGain) {
      this.context.roomGain.gain.value = this.roomSimulationLevel;
    }
  }

  setupAudioRoutingGraph() {
    // decoding to virtual loudspeakers
    console.log("ambisonics: setting up decoder");

    if (this.decoderExpectedInputNormalization === "n3d") {
      this.decoderMatrix = n3dToSn3dDecoderMatrix(this.decoderMatrix);
    }

    this.gainOut = this.context.createGain();
    this.loudspeakerDecoder = new MatrixMultiplier(this.context, this.decoderMatrix);
    this.loudspeakerDecoderOutSplitter = this.context.createChannelSplitter(this.numLoudspeakers);
    this.binauralDecoder = new BinauralDecoder(this.context, this.binauralDecodingOrder);
    this.hoaloader = new HOALoader(this.context, this.binauralDecodingOrder, this.decodingFilterUrls, loadedBuffer => {
      this.binauralDecoder.updateFilters(loadedBuffer);
    });
    this.hoaloader.load();

    // connect media to decoder
    this.ambisonicsSource.connect(this.loudspeakerDecoder.in);
    this.loudspeakerDecoder.out.connect(this.loudspeakerDecoderOutSplitter);

    // connect the decoder outputs to virtual loudspeakers
    for (let i = 0; i < this.numLoudspeakers; ++i) {
      const lsp = this.loudspeakers[i];
      lsp.encoder = new MonoEncoder(this.context, this.binauralDecodingOrder);
      this.loudspeakerDecoderOutSplitter.connect(
        lsp.gain,
        i,
        0
      );
      lsp.gain.connect(lsp.encoder.in);
      lsp.encoder.out.connect(this.binauralDecoder.in);
    }

    this.gainOut.gain.value = this.masterGain;
    this.binauralDecoder.out.connect(this.gainOut);

    // add additional BRIR path
    this.brirConvolver = this.context.createConvolver();
    this.brirConvolver.normalize = false;
    this.roomGain = this.context.createGain();
    this.roomGain.gain.value = this.roomSimulationLevel;
    this.loadBrir();
    this.binauralDecoder.in.connect(
      this.roomGain,
      0,
      0
    ); // connect only W channel
    this.roomGain.connect(this.brirConvolver);
    this.brirConvolver.connect(this.gainOut);

    this.gainOut.connect(this.context.destination);
  }

  loadDecoderConfig(newDecoderConfig, newLoudspeakerArrayOffset, loudspeakerShouldBeVisible) {
    if (
      this.decoderConfig === newDecoderConfig &&
      this.loudspeakerArrayOffset === newLoudspeakerArrayOffset &&
      this.loudspeakerVisible === loudspeakerShouldBeVisible
    )
      return;

    if (newDecoderConfig == "grazArray") {
      this.decoderConfig = grazArray;
    } else if (newDecoderConfig == "grazArrayXL") {
      this.decoderConfig = grazArrayXL;
    } else if (newDecoderConfig == "envelopSF") {
      this.decoderConfig = envelopSF;
    } else if (newDecoderConfig == "envelopSFXL") {
      this.decoderConfig = envelopSFXL;
    } else if (newDecoderConfig == "ico") {
      this.decoderConfig = ico;
    } else if (newDecoderConfig == "default") {
      this.decoderConfig = grazArray;
    }

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

  async loadBrir() {
    const response = await fetch(brir);
    const arrayBuffer = await response.arrayBuffer();
    this.brirConvolver.buffer = await this.context.decodeAudioData(arrayBuffer);
    console.log("ambisonics: loaded brir");
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

      const distance = avatarPosition.distanceTo(lsPosition);

      if (
        ls.setInitial ||
        Math.abs(distance - ls._lastDistance) > 0.01 ||
        Math.abs(encodingDirection.x - ls._lastEncodingDirection.x) > 0.01 ||
        Math.abs(encodingDirection.y - ls._lastEncodingDirection.y) > 0.01 ||
        Math.abs(encodingDirection.z - ls._lastEncodingDirection.z) > 0.01
      ) {
        ls.encoder.updateGains(encodingDirection.z, encodingDirection.x, encodingDirection.y);
        // use inverse distance law, implementation as in Firefox PannerNode
        const distanceBasedAttenuation =
          this.refDistance /
          (this.refDistance + this.rolloffFactor * (Math.max(distance, this.refDistance) - this.refDistance));

        ls.gain.gain.value = distanceBasedAttenuation;

        if (ls.setInitial) {
          ls.setInitial = false;
        }

        ls._lastDistance = distance;
        ls._lastEncodingDirection = { x: encodingDirection.x, y: encodingDirection.y, z: encodingDirection.z };
      }
    }
  }
}
