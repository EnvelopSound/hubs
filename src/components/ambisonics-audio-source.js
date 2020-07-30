import defaultAmbiDecoderConfig from "../assets/ambisonics/cube.json";
import MatrixMultiplier from "../utils/matrix-multiplier.js";
import { subset } from "semver";
import { Spherical } from "three";

export class ambisonicsAudioSource extends THREE.Object3D {
  constructor(mediaEl) {
    super();
    this.el = mediaEl;

    console.log("element after scale reset"); 
    console.log(this.el); 

    this.context = this.el.sceneEl.audioListener.context;
    this.audioListener = this.el.sceneEl.audioListener;
    this.panner = { coneInnerAngle: 0, coneOuterAngle: 0, coneOuterGain: 0 };
    this.loudspeakers = [];
    this.arrayCenter = this.el.object3D.position;
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
     
    console.log("Array center before"); 
    console.log(this.arrayCenter); 

    this.arrayCenter = this.el.object3D.position;
    this.arrayCenter.x += this.loudspeakerArrayOffsetVector.x;
    this.arrayCenter.y += this.loudspeakerArrayOffsetVector.y;
    this.arrayCenter.z += this.loudspeakerArrayOffsetVector.z;
   
    console.log("Array center after"); 
    console.log(this.arrayCenter); 

    const centerMarkerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const centerMarkerMaterial = new THREE.MeshBasicMaterial();
    const centerMarkerCube = new THREE.Mesh(centerMarkerGeometry, centerMarkerMaterial);

    

    this.el.setObject3D("centerMarker", centerMarkerCube);
    const centerMarker = this.el.getObject3D("centerMarker");

    centerMarker.position.x = this.arrayCenter.x;
    centerMarker.position.y = this.arrayCenter.y;
    centerMarker.position.z = this.arrayCenter.z; 

    centerMarker.scale.x = 1 / 3; 

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

        lspObject.scale.x = 1 / 3;

        lspObject.position.x = positionCartesian.x + this.loudspeakerArrayOffsetVector.x;
        lspObject.position.y = positionCartesian.y + this.loudspeakerArrayOffsetVector.y;
        lspObject.position.z = positionCartesian.z + this.loudspeakerArrayOffsetVector.z;

        lspObject.lookAt(this.arrayCenter);
   
        console.log(lspObject);

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

  loadDecoderConfig(newDecoderConfigUrl, newloudspeakerArrayOffset, newloudspeakerVisible) {
    console.log("ambisonics: loadDecoderConfig");

    if (this.decoderConfigUrl === newDecoderConfigUrl)
      return;
    
    this.decoderConfigUrl = newDecoderConfigUrl;

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

    this.loudspeakerArrayOffset = newloudspeakerArrayOffset;
    this.loudspeakerVisible = newloudspeakerVisible;

    console.log(this.LoudspeakerLayout);
    console.log(this.decoderMatrix);

    const theta = this.el.object3D.rotation._y;
    const phi =  Math.PI / 2 - this.el.object3D.rotation._x;

    this.loudspeakerArrayOffsetVector = new THREE.Vector3();
    this.loudspeakerArrayOffsetVector.setFromSphericalCoords(this.loudspeakerArrayOffset, phi, theta);

    console.log("array offset vector is "); 
    console.log(this.loudspeakerArrayOffsetVector);

    this.constructLoudspeakers();
  }
}
