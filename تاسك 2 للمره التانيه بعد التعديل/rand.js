"use strict";

let crypto = require('crypto');

const MAX_RANGE = 256;

// Returns a random number between 0 and 255.
function sample() {
  return crypto.randomBytes(1).readUInt8();
}

// Using rejection sampling,
// following http://dimitri.xyz/random-ints-from-random-bits/.
exports.nextInt = function(range) {
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