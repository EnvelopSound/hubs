////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
//
//  Adapted for Hubs by Nils Meyer-Kahlen and Thomas Deppisch
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HOA ENCODER */
/////////////////
import { shEval } from "sh-eval.js";

export default class monoEncoder {
  constructor(audioCtx, order) {
    this.initialized = false;

    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.gains = new Array(this.nCh);
    this.gainNodes = new Array(this.nCh);
    this.in = this.ctx.createGain();
    this.in.channelCountMode = "explicit";
    this.in.channelCount = 1;
    this.out = this.ctx.createChannelMerger(this.nCh);
    // Initialize encoding gains
    for (let i = 0; i < this.nCh; i++) {
      this.gainNodes[i] = this.ctx.createGain();
      this.gainNodes[i].channelCountMode = "explicit";
      this.gainNodes[i].channelCount = 1;
    }
    this.updateGains();
    // Make audio connections
    for (let i = 0; i < this.nCh; i++) {
      this.in.connect(this.gainNodes[i]);
      this.gainNodes[i].connect(
        this.out,
        0,
        i
      );
    }

    this.initialized = true;
  }

  updateGains(newX, newY, newZ) {
    const g_enc = shEval(this.order, newX, newY, newZ);

    for (let i = 0; i < this.nCh; i++) {
      this.gains[i] = g_enc[i];
      this.gainNodes[i].gain.value = this.gains[i];
    }
  }
}
