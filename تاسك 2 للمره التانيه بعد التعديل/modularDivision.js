"use strict";


function modInverse(b, m) {
  let [g, x, y] = gcdExtended(b, m);
  if (g !== 1) {
    return undefined;
  }

  return (x%m + m) % m;
}

// Returns a triple where the first
// item is the greatest common divisor
function gcdExtended(a, b) {
  debugger;
  if (a === 0) {
    return [b,0,1];
  }
  let [gcd, x1, y1] = gcdExtended(b%a, a);
  let x = y1 - Math.floor(b/a) * x1;
  let y = x1;
  return [gcd, x, y];
}

function modDivide(a, b, m) {
  a = a % m;
  let inv = modInverse(b,m);
  if (inv === undefined) {
    return inv;
  } else {
    return (inv * a) % m;
  }
}

exports.modDivide = modDivide;
