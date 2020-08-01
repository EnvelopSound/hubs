# Adding Ambisonic Streaming Support to Hubs
Ambisonic streaming support is provided by extending Audio Node and Video Vode by the AudioType **ambisonics**.

A video or audio element for an Ambisonics stream can be configured using the modified spoke editor [2].

When a video or audio element with AudioType ambisonics is added to the scene in Spoke, the url to a dash stream with ambisonics content is set. Such a stream can be created using OBS music edition [2] and multichannel RTMP to dash transcoding. Currently 16 channels are possible, which limits the ambisoncs order to 3. 

In hubs, a video or audio element with AudioType ambisonics creates an AmbisonicsAudioSource. The AmbisonicsAudioSource is initialized with a pre-defined loudspeaker setup, to which the Ambisonics stream is decoded to create one audio stream for each loudspeaker. 

These loudspeaker streams could be rendered using pannerNodes, but as an other option with better sound and larger flexibility, Ambisonics is used for this as well. Depending on the listener and the loudspeaker position, a gain and a direction is computed and the loudspeaker stream is again encoded into Ambisonics. The sum of all loudspeaker sources is then decoded to binaural audio using SH domain decoding filters, based on Magnitude Least squares decoder design [3]. 

Additionally, position independent room simulation can be added. 

## Ambisonics Settings

When creating a audio or video element with AudioType ambisonics in Spoke [1], the following can be specified: 

- Loudspeaker Setup: Select from a list of loudspeaker setups, new ones can be added in LoudspeakerSetups, corresponding decoder files need to be provided in the assets, which can be       created for example using the Allrad Decoder [4]. 

- Loudspeaker Visible: Toggles the visibility of the loudspeakers in hubs

- Array Offset: Moves the center of the loudspeaker array in the direction in which the Video or Audip Element is facing. (Usefull for placing the array in front of the screen on which the stream is playing)

- Rolloff Factor / Ref Distance: Control the distance dependend attenuation of the loudspeakers. The same as in AudioType pannernode, when inverse is selected as distance model

- Room Simulation Level

- Decoding Order: Controls the order for the binaural decoding of the spatialized loudspeaker Elements. Note that this is independent of the Ambisonics Stream order which is decoded to the loudspeakers. Here 4th order is default and maximum, due to Web Audio API channel limitations.

Set "Video" or "Audio" to the streaming URL. Depending on whether you create a video or audio element, a screen will be visible. 

[1] https://github.com/EnvelopSound/Spoke/tree/ambisonics

[2] https://github.com/pkviet/obs-studio/releases?fbclid=IwAR0I8JRR1WtN4sruTD_EHm1hEmsSJAV-2VCSF1qFHX6R_vzZMth06WHrhI4

[3] Schörkhuber, C., Zaunschirm, M. Höldrich, R., Rendering of Ambisonic Signals via Magnitude Least Squares

[4] https://plugins.iem.at/docs/allradecoder/

## Testing
You can follow the current development process by cloning this repository, checking out the branch "ambisonics", starting the local Hubs (npm run dev) and opening our development room under https://localhost:8080/hub.html?hub_id=fjTBUN2.

## [Mozilla Hubs](https://hubs.mozilla.com/)

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0) [![Build Status](https://travis-ci.org/mozilla/hubs.svg?branch=master)](https://travis-ci.org/mozilla/hubs) [![Discord](https://img.shields.io/discord/498741086295031808)](https://discord.gg/CzAbuGu)

The client-side code for [Mozilla Hubs](https://hubs.mozilla.com/), an online 3D collaboration platform that works for desktop, mobile, and VR platforms.

[Learn more about Hubs](https://hubs.mozilla.com/docs/welcome.html)

## Getting Started

If you would like to run Hubs on your own servers, check out [Hubs Cloud](https://hubs.mozilla.com/docs/hubs-cloud-intro.html).

If you would like to deploy a custom client to your existing Hubs Cloud instance please refer to [this guide](https://hubs.mozilla.com/docs/hubs-cloud-custom-clients.html).

If you would like to contribute to the main fork of the Hubs client please see the [contributor guide](./CONTRIBUTING.md).

If you just want to check out how Hubs works and make your own modifications continue on to our Quick Start Guide.

### Quick Start

[Install NodeJS](https://nodejs.org) if you haven't already. We recommend version 12 or above.

Run the following commands:

```bash
git clone https://github.com/mozilla/hubs.git
cd hubs
npm ci
npm run dev
```

Then visit https://localhost:8080 (note: HTTPS is required, you'll need to accept the warning for the self-signed SSL certificate)

> Note: When running the Hubs client locally, you will still connect to the development versions of our [Janus WebRTC](https://github.com/mozilla/janus-plugin-sfu) and [reticulum](https://github.com/mozilla/reticulum) servers. These servers do not allow being accessed outside of localhost. If you want to host your own Hubs servers, please check out [Hubs Cloud](https://hubs.mozilla.com/docs/hubs-cloud-intro.html).

## Documentation

The Hubs documentation can be found [here](https://hubs.mozilla.com/docs).

## Community

Join us on our [Discord Server](https://discord.gg/CzAbuGu) or [follow us on Twitter](https://twitter.com/MozillaHubs).

## Contributing

Read our [contributor guide](./CONTRIBUTING.md) to learn how you can submit bug reports, feature requests, and pull requests.

Contributors are expected to abide by the project's [Code of Conduct](./CODE_OF_CONDUCT.md) and to be respectful of the project and people working on it. 

## Additional Resources

* [Reticulum](https://github.com/mozilla/reticulum) - Phoenix-based backend for managing state and presence.
* [NAF Janus Adapter](https://github.com/mozilla/naf-janus-adapter) - A [Networked A-Frame](https://github.com/networked-aframe) adapter for the Janus SFU service.
* [Janus Gateway](https://github.com/meetecho/janus-gateway) - A WebRTC proxy used for centralizing network traffic in this client.
* [Janus SFU Plugin](https://github.com/mozilla/janus-plugin-sfu) - Plugins for Janus which enables it to act as a SFU.
* [Hubs-Ops](https://github.com/mozilla/hubs-ops) - Infrastructure as code + management tools for running necessary backend services on AWS.

## Privacy

Mozilla and Hubs believe that privacy is fundamental to a healthy internet. Read our [privacy policy](./PRIVACY.md) for more info.

## License

Hubs is licensed with the [Mozilla Public License 2.0](./LICENSE)
