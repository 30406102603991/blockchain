"use strict";

const crypto = require('crypto');

const HASH_ALG = 'sha256';


// Returns 2 buffers of equal size, 'ciphertext' and 'key'
function makeOTP({string, buffer}) {
  if ((!string && !buffer) || (!!string && !!buffer)) {
    console.log(string);
    console.log(buffer);
    throw new Error("Either string or buffer should be specified, but not both");
  }
  // If a string was specified, convert it to a buffer.
  if (string) {
    buffer = Buffer.from(string);
  }
  let key = crypto.randomBytes(buffer.length);
  let ciphertext = Buffer.alloc(buffer.length);
  for (let i=0; i<buffer.length; i++) {
    ciphertext[i] = buffer[i] ^ key[i];
    //console.log(`${ciphertext[i]} = ${buffer[i]} ^ ${key[i]}`);
  }
  return { key, ciphertext };
}

// XORs the key with the ciphertext.  By default, this function
// returns a buffer, but 'string' or 'buffer' may be specified.
function decryptOTP({key, ciphertext, returnType}) {
  if (key.length !== ciphertext.length) {
    throw new Error("The length of the key must match the length of the ciphertext.");
  }
  let p = Buffer.alloc(key.length);
  for (let i=0; i<key.length; i++) {
    p[i] = key[i] ^ ciphertext[i];
  }
  if (!returnType || returnType === 'buffer') {
    return p;
  } else if (returnType === 'string') {
    return p.toString();
  } else {
    throw new Error(`${returnType} is not supported as a return type`);
  }
}

// Return a globally unique ID
function makeGUID() {
  return crypto.randomBytes(48).toString('hex');
}

function hash(s) {
  s = s.toString();
  return crypto.createHash(HASH_ALG).update(s).digest('hex');
}

const MAX_RANGE = 256;

// Returns a random number between 0 and 255.
function sample() {
  return crypto.randomBytes(1).readUInt8();
}

// Using rejection sampling,
// following http://dimitri.xyz/random-ints-from-random-bits/.
function randInt(range) {
  if (range > MAX_RANGE) {
    throw new Error(`Sorry, range cannot be more than ${MAX_RANGE}`);
  }

  // Calculating max allowable range
  let q = Math.floor(MAX_RANGE / range);
  let max = q * range;

  let n;
  do {
    n = sample();
  } while (n >= max);
  return n % range;
}

exports.makeOTP = makeOTP;
exports.decryptOTP = decryptOTP;
exports.makeGUID = makeGUID;
exports.hash = hash;
exports.randInt = randInt;

