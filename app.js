"use strict";

const Homey = require('homey');
const tinycolor = require("tinycolor2");
const util = require('/lib/util.js');

class TwinklyApp extends Homey.App {

  onInit() {
    this.log('Initializing Twinkly App ...');

    new Homey.FlowCardAction('changeSingleColor')
      .register()
      .registerRunListener(async (args, state) => {
        let rgbcolor = tinycolor(args.color).toRgb();
        let frames = [await util.generateFullFrame({r: Number(rgbcolor.r), g: Number(rgbcolor.g), b: Number(rgbcolor.b)}, args.device.getStoreValue("number_of_led"))];
        let movieFormat = await util.convertMovieFormat({frames: frames, delay: 5000});
        await util.sendCommand('/xled/v1/led/mode', args.device.getStoreValue("token"), 'POST', JSON.stringify({"mode":"off"}), args.device.getSetting('address'));
        util.sendCommand('/xled/v1/led/movie/full', args.device.getStoreValue("token"), 'POST', movieFormat.bufferArray, args.device.getSetting('address'), 'application/octet-stream');
        util.sendCommand('/xled/v1/led/movie/config', args.device.getStoreValue("token"), 'POST', JSON.stringify({frame_delay: 5000, leds_number: movieFormat.lightsCount, frames_number: movieFormat.frameCount}), args.device.getSetting('address'));
        return util.sendCommand('/xled/v1/led/mode', args.device.getStoreValue("token"), 'POST', JSON.stringify({"mode":"movie"}), args.device.getSetting('address'));
      })

    new Homey.FlowCardAction('switchDemoMode')
      .register()
      .registerRunListener(async (args, state) => {
        if (args.mode == 'on') {
          return util.sendCommand('/xled/v1/led/mode', args.device.getStoreValue("token"), 'POST', JSON.stringify({"mode":"demo"}), args.device.getSetting('address'));
        } else {
          return util.sendCommand('/xled/v1/led/mode', args.device.getStoreValue("token"), 'POST', JSON.stringify({"mode":"movie"}), args.device.getSetting('address'));
        }
      })

  }

}

module.exports = TwinklyApp;
