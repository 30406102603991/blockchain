"use strict";

function encrypt(message, pubKey) {
  let ciphertext = message ** pubKey.e % pubKey.modulus;    // c = m ^ e % m
  return ciphertext;
}

function decrypt(ciphertext, privKey) {
  let message = ciphertext ** privKey.d % privKey.modulus;  // m = c ^ d % m 
  return message;
}

function sign(message, privKey) {
  return decrypt(message, privKey);
}

function verify(message, sig, pubKey) {
  let m = encrypt(sig, pubKey);
  return m === message;
}

// Setting up key pair
let mod = 33;
let pub = { modulus: mod, e: 3 };
let priv = { modulus: mod, d: 7 };

// Choose any message less than the modulus.
let m = 18;
let c = encrypt(m, pub);
console.log(`${m} encrypted returns ${c}`);
let m1 = decrypt(c, priv);
console.log(`${c} decrypted returns ${m1}`);
console.log();

// Signing now -- note that it is a bad idea to
// use the same key pair for signing and encrypting,
// but the math works out just fine.
m = 24;
let sig = sign(m, priv);
console.log(`${m} signed returns signature ${sig}`);
let b = verify(m, sig, pub);
console.log(`${sig} ${b ? "is" : "is not" } a valid signature for ${m}`);
