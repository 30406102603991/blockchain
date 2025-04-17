"use strict";

const blindSignatures = require('blind-signatures');

const utils = require('./utils.js');

const COIN_RIS_LENGTH = 20;
const IDENT_STR = "IDENT";
const BANK_STR = "ELECTRONIC_PIGGYBANK";

class Coin {
  /**
   * Constructor for making a new digicash-like coin.
   *
   * @constructor
   *
   * @param purchaser - the identity of the purchaser
   * @param amount - the amount of currency this coin represents
   * @param n - public key modulus
   * @param e - public key exponent
   */
  constructor(purchaser, amount, n, e) {
    this.amount = amount;
    this.n = n;
    this.e = e;

    this.guid = utils.makeGUID();
    this.leftIdent = [];
    this.rightIdent = [];

    let leftHashes = [];
    let rightHashes = [];

    for (let i=0; i<COIN_RIS_LENGTH; i++) {
      // Making an OTP for the identity string.
      let { key, ciphertext } = utils.makeOTP({string: `${IDENT_STR}:${purchaser}`});

      this.leftIdent.push(key);
      leftHashes.push(utils.hash(key));

      this.rightIdent.push(ciphertext);
      rightHashes.push(utils.hash(ciphertext));
    }

    this.coinString = `${BANK_STR}-${this.amount}-${this.guid}-${leftHashes.join(',')}-${rightHashes.join(',')}`;

    this.blind();
  }

  /**
   * Makes a blinded hash of the coin's string representation.
   * The blinded hash is stored as this.blinded, with the blinding
   * factor stored as this.blindingFactor.
   */
  blind() {
    let { blinded, r } = blindSignatures.blind({
        message: this.toString(),
        N: this.n,
        E: this.e,
    });
    this.blinded = blinded;
    this.blindingFactor = r;
  }

  /**
   * Removes the blinding factor from the signature, while still maintaining
   * the signatures validity.
   */
  unblind() {
    this.signature = blindSignatures.unblind({
        signed: this.signature,
        N: this.n,
        r: this.blindingFactor,
    });
  }

  toString() {
    return this.coinString;
  }

  /**
   * Returns EITHER the left or right half of the identity
   * for the specified position.  Alone, the identity half
   * reveals nothing about the owner of the coin.  Combined,
   * the two halves reveal the owner's identity.
   */
  
  getRis(isLeft, i) {
    if (isLeft) {
      return this.leftIdent[i];
    } else {
      return this.rightIdent[i];
    }
  }

}

exports.Coin = Coin;
exports.COIN_RIS_LENGTH = COIN_RIS_LENGTH;
exports.IDENT_STR = IDENT_STR;
exports.BANK_STR = BANK_STR;
