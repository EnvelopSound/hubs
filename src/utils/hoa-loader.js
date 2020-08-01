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

////////////////
/* HOA LOADER */
////////////////

export default class HOAloader {
  constructor(context, order, urls, callback) {
    this.context = context;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.nChGroups = Math.ceil(this.nCh / 8);
    this.buffers = new Array();
    this.loadCount = 0;
    this.loaded = false;
    this.onLoad = callback;
    this.urls = urls;

    if (this.nChGroups > this.urls.length) {
      alert("Not enough Filters for the given order");
    }
  }

  loadBuffers(url, index) {
    // Load buffer asynchronously
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    const scope = this;

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      scope.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert("error decoding file data: " + url);
            return;
          }
          scope.buffers[index] = buffer;
          scope.loadCount++;
          if (scope.loadCount == scope.nChGroups) {
            scope.loaded = true;
            scope.concatBuffers();
            console.log("HOAloader: all buffers loaded and concatenated");
            scope.onLoad(scope.concatBuffer);
          }
        },
        function(error) {
          alert(
            "Browser cannot decode audio data:  " +
              url +
              "\n\nError: " +
              error +
              "\n\n(If you re using Safari and get a null error, this is most likely due to Apple's shady plan going on to stop the .ogg format from easing web developer's life :)"
          );
        }
      );
    };

    request.onerror = function() {
      alert("HOAloader: XHR error");
    };

    request.send();
  }

  load() {
    for (let i = 0; i < this.nChGroups; ++i) this.loadBuffers(this.urls[i], i);
  }

  concatBuffers() {
    if (!this.loaded) return;

    const nCh = this.nCh;
    const nChGroups = this.nChGroups;

    let length = this.buffers[0].length;
    this.buffers.forEach(b => {
      length = Math.max(length, b.length);
    });
    const srate = this.buffers[0].sampleRate;

    this.concatBuffer = this.context.createBuffer(nCh, length, srate);
    for (let i = 0; i < nChGroups; i++) {
      for (let j = 0; j < this.buffers[i].numberOfChannels; j++) {
        this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(j));
      }
    }
  }
}
