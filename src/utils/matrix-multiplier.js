///////////////////////
/* Matrix Multiplier */
///////////////////////

export default class MatrixMultiplier {
  constructor(audioCtx, decoderMatrix) {
    this.ctx = audioCtx;
    this.nChOut = decoderMatrix.length;
    this.nChIn = decoderMatrix[0].length;

    console.log("MatrixMultiplier:: Input chans" + this.nChIn);
    console.log("MatrixMultiplier:: Output chans" + this.nChOut);

    this.mtx = decoderMatrix;

    //this.initializeMatrix();

    // Input and output nodes
    this.in = this.ctx.createChannelSplitter(this.nChIn);
    this.out = this.ctx.createChannelMerger(this.nChOut);

    this.gain = new Array(this.nChOut);

    for (let row = 0; row < this.nChOut; row++) {
      this.gain[row] = new Array(this.nChIn)
      for (let col = 0; col < this.nChIn; col++) {
        this.gain[row][col] = this.ctx.createGain();
        this.gain[row][col].gain.value = this.mtx[row][col];

        this.in.connect(this.gain[row][col], col, 0);
        this.gain[row][col].connect(this.out, 0, row);
      }
    }

    console.log("First Gain Node:");
    console.log(this.gain[0][0]);

  }


  updateMtx(mtx) {
    this.mtx = mtx;

    for (let row = 0; row < this.nChOut; row++) {
      //outputs
      for (let col = 0; col < this.nChIn; col++) {
        //inputs
        this.gain[row][col].gain.value = this.mtx[row][col]; //set new gains
      }
    }
  }

  printGainMtx() {
    console.log(this);
  }

  initializeMatrix() {
    this.mtx = new Array(this.nChOut);
    for (let row = 0; row < this.nChOut; row++) {
      this.mtx[row] = new Array(this.nChIn);
    }
    for (let row = 0; row < this.nChOut; row++) {
      //outputs
      for (let col = 0; col < this.nChIn; col++) {
        //inputs
        if (row == col) {
          this.mtx[row][col] = 1;
        } else {
          this.mtx[row][col] = 0; //set new gains
        }
      }
    }
  }
}
