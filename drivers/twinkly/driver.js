"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');
const dgram = require('dgram');
const message = Buffer.from('\x01discover');

var devices = [];
var added_devices = [];

class TwinklyDriver extends Homey.Driver {

  async onPairListDevices(data, callback) {
    try {
      let devices = await this.discoverDevices();
      callback(null, devices);
    } catch (error) {
      callback(error, false);
    }
  }

  discoverDevices() {
    return new Promise(async (resolve, reject) => {
      try {
        let client = dgram.createSocket('udp4');

        client.bind(5555, () => {
          client.setBroadcast(true);
          client.setMulticastTTL(255);
        });

        var broadcast = () => client.send(message, 0, message.length, 5555, "255.255.255.255");
        var broadcastInterval = setInterval(broadcast, 5000);
        broadcast();

        client.on('message', (message, address) => {
          process.nextTick(() => {
            var string = message.toString('utf8');
            if (!string.includes('discover')) {
              var json = message.toJSON();
              var ip = json.data[3]+'.'+json.data[2]+'.'+json.data[1]+'.'+json.data[0];
              var hostname = message.toString('utf-8', 6, 20);
              if (!added_devices.hasOwnProperty(hostname)) {
                devices.push({
                  name: hostname,
                  data: {
                    id: hostname
                  },
                  settings: {
                    address: ip,
                    polling: 5
                  }
                });
                added_devices[hostname] = hostname;
              }
            }
          });
        });

        setTimeout(() => {
          clearInterval(broadcastInterval);
          client.close();
          return resolve(devices);
        }, 6000);
      } catch (error) {
        return reject(error);
      }
    })
  }

}

module.exports = TwinklyDriver;
