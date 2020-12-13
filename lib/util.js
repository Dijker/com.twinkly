const Homey = require('homey');
const fetch = require('node-fetch');
const randomBytes = require('random-bytes');

exports.getDeviceInfo = function (address) {
  return new Promise(function (resolve, reject) {
    fetch('http://'+ address + '/xled/v1/gestalt', {
      method: 'GET',
    })
    .then(checkStatus)
    .then(res => res.json())
    .then(json => {
      return resolve(json);
    })
    .catch(err => {
      return reject(err);
    });
  })
}

exports.sendCommand = function (endpoint, token, type, payload, address, contenttype = 'application/json') {
  return new Promise(function (resolve, reject) {
    if (type == 'GET') {
      var options = {
        method: type,
        headers: {
          'X-Auth-Token': token,
          'Content-Type': contenttype
        }
      }
    } else if (type == 'POST') {
      var options = {
        method: type,
        body: payload,
        headers: {
          'X-Auth-Token': token,
          'Content-Type': contenttype,
          'Content-Length': payload.length
        }
      }
    }
    fetch('http://'+ address + endpoint, options)
    .then(checkStatus)
    .then(res => res.json())
    .then(json => {
      return resolve(json);
    })
    .catch(err => {
      return reject(err);
    });
  })
}

exports.returnToken = function (address) {
  return new Promise(function (resolve, reject) {
    const verify = async () => {
      try {
        const challenge = await randomBytes.sync(32);
        const tokendata = await getToken(address);

        if (tokendata) {
          const body = JSON.stringify( {"challenge-response": tokendata["challenge-response"].toString('base64') } );
          fetch('http://'+ address + '/xled/v1/verify', {
            method: 'POST',
            body: body,
            headers: {
              'X-Auth-Token': tokendata.authentication_token,
              'Content-Type': 'application/json',
              'Content-Length': 66
            },
          })
          .then(checkStatus)
          .then(res => res.json())
          .then(json => {
            return resolve(tokendata.authentication_token);
          })
          .catch(err => {
            return reject(err);
          });
        }
      } catch (err) {
        return reject(err);
      }
    }
    verify();
  })
}

exports.generateFullFrame = function (colour, lightCount) {
	const frame = []
	for (let x = 0; x < lightCount; x++) {
		frame.push({r: colour.r,g: colour.g,b: colour.b});
	}
	return frame;
}

exports.convertMovieFormat = function (movie) {
	const fullArray =[];
	const output = {
		bufferArray: undefined,
		frameCount: movie.frames.length,
		lightsCount: movie.frames[0].length
	}
	for (let x =0; x < movie.frames.length; x++) {
		if (movie.frames[x].length !== output.lightsCount) {
			throw new Error('Not all frames have the same number of lights!')
		}
		for (let y = 0; y < movie.frames[x].length; y++) {
			fullArray.push(movie.frames[x][y].r);
			fullArray.push(movie.frames[x][y].g);
			fullArray.push(movie.frames[x][y].b);
		}
	}
	output.bufferArray = new ArrayBuffer(fullArray.length);
	const longInt8View = new Uint8Array(output.bufferArray);

	for (let x =0; x < fullArray.length; x++) {
		longInt8View[x] = fullArray[x];
	}
	return output;
}

function getToken(address) {
  return new Promise(function (resolve, reject) {
    const token = async () => {
      try {
        const challenge = await randomBytes.sync(32);
        if (challenge) {
          const body = JSON.stringify( {"challenge": challenge.toString('base64') } );
          fetch('http://'+ address + '/xled/v1/login', {
            method: 'POST',
            body: body,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Content-Length': 61
            },
          })
          .then(checkStatus)
          .then(res => res.json())
          .then(json => {
            return resolve(json);
          })
          .catch(err => {
            return reject(err);
          });
        }
      } catch (err) {
        return reject(err);
      }
    }
    token();
  })
}

function checkStatus(res) {
  if (res.ok) {
    return res;
  } else {
    throw new Error(res.status);
  }
}

function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}
