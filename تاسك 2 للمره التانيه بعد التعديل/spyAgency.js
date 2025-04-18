"use strict";

// to install run --> npm install blind-signatures
let blindSignatures = require('blind-signatures');
let BigInteger = require('jsbn').BigInteger;

let rand = require('./rand.js');

const COPIES_REQUIRED = 10;


class SpyAgency {
  constructor() {
    this.key = blindSignatures.keyGeneration({b: 2048}); // Setting key length
  }

  // Verifies that the hash and the blinding factor
  // match the blind hash.
  consistent(blindHash, factor, hash) {
    let n = this.key.keyPair.n;
    let e = new BigInteger(this.key.keyPair.e.toString());
    blindHash = blindHash.toString();
    let bigHash = new BigInteger(hash, 16);
    let b = bigHash.multiply(factor.modPow(e, n)).mod(n).toString();    //  ( hash *(factor ^ e % n) ) % n
    let result = blindHash === b;
    return result;
  }

  // Returns true if the originalDoc matches expectations,
  // if its hash matches what was specified previously, and
  // if the blinded document matches the hash and blinding factor.
  verifyContents(blindHash, blindingFactor, originalDoc) {
    if (!originalDoc.match(/^The bearer of this signed document, .*, has full diplomatic immunity.$/)) {
      return false;
    }
    let h = blindSignatures.messageToHash(originalDoc);
    if (!this.consistent(blindHash, blindingFactor, h)) {
      return false;
    }
    return true;
  }

  signDocument(blindDocs, response) {
    if (blindDocs.length !== COPIES_REQUIRED) {
      throw new Error(`There must be ${COPIES_REQUIRED} documents, but I only received ${blindDocs.length}`);
    }
    // Cloning documents, in case the spy tries to change them after submission.
    blindDocs = blindDocs.slice();
    let selected = rand.nextInt(blindDocs.length);
    console.log(`Agency selected ${selected}`);
    response(selected, (blindingFactors, originalDocs) => {
      blindDocs.forEach((doc, i) => {
        // No blinding factor is expected for the selected identity.
        if (i === selected) return;
        if (!this.verifyContents(blindDocs[i], blindingFactors[i], originalDocs[i])) {
          throw new Error(`Document ${i} is invalid`);
        }
      });
      // If we made it here, all looked good.
      return blindSignatures.sign({
          blinded: blindDocs[selected],
          key: this.key,
      });
    });
  }

  get n() {
    return this.key.keyPair.n.toString();
  }

  get e() {
    return this.key.keyPair.e.toString();
  }
}


exports.SpyAgency = SpyAgency;
