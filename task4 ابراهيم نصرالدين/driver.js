"use strict";
const blindSignatures = require('blind-signatures');
const BigInteger = require('jsbn').BigInteger;
const crypto = require('crypto');

const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require('./coin.js');
const utils = require('./utils.js');

// 1. تعديل إنشاء المفتاح مع معالجة الأخطاء
let BANK_KEY;
try {
  BANK_KEY = blindSignatures.keyGeneration({ b: 512 }); // تقليل حجم المفتاح للتأكد من العمل
  if (!BANK_KEY?.keyPair) {
    throw new Error('Failed to generate valid key pair');
  }
  console.log('Bank key generated successfully');
} catch (e) {
  console.error('Bank key generation failed:', e.message);
  process.exit(1);
}

// 2. تعديل تعريف N و E مع التحقق
const N = new BigInteger(BANK_KEY.keyPair.n.toString());
const E = new BigInteger(BANK_KEY.keyPair.e.toString());

// 3. تحسين دالة signCoin
function signCoin(blindedCoinHash) {
  if (!blindedCoinHash) {
    throw new Error('Blinded hash is required');
  }

  try {
    const blindedBigInt = new BigInteger(blindedCoinHash.toString());
    return blindSignatures.sign({
      blinded: blindedBigInt,
      key: BANK_KEY
    }).toString();
  } catch (e) {
    console.error('Signing failed:', e.message);
    throw new Error('Coin signing failed');
  }
}

// 4. تعديل دالة verifySignature
function verifySignature(coin) {
  try {
    return blindSignatures.verify({
      unblinded: new BigInteger(coin.signature.toString()),
      N: N,
      E: E,
      message: coin.toString()
    });
  } catch (e) {
    console.error('Verification error:', e.message);
    return false;
  }
}

// 5. تحسين دالة acceptCoin
function acceptCoin(coin) {
  if (!verifySignature(coin)) {
    throw new Error('Invalid coin signature: Potential forgery detected');
  }

  const [leftHashes, rightHashes] = parseCoin(coin.toString());
  const risElements = [];

  for (let i = 0; i < COIN_RIS_LENGTH; i++) {
    const selectLeft = crypto.randomInt(0, 2) === 0;
    const element = coin.getRis(selectLeft, i);
    const expectedHash = selectLeft ? leftHashes[i] : rightHashes[i];
    
    if (utils.hash(element) !== expectedHash) {
      throw new Error(`RIS validation failed at position ${i}`);
    }
    
    risElements.push({
      position: i,
      isLeft: selectLeft,
      value: element,
      hash: expectedHash
    });
  }

  return risElements;
}

// 6. تحسين دالة determineCheater
function determineCheater(guid, ris1, ris2) {
  if (!Array.isArray(ris1) || !Array.isArray(ris2)) {
    throw new Error('Invalid RIS data format');
  }

  for (let i = 0; i < COIN_RIS_LENGTH; i++) {
    if (ris1[i].value !== ris2[i].value) {
      try {
        const decrypted = utils.decryptOTP({
          key: Buffer.from(ris1[i].value),
          ciphertext: Buffer.from(ris2[i].value),
          returnType: 'string'
        });

        if (decrypted.startsWith(IDENT_STR)) {
          const purchaser = decrypted.split(':')[1];
          console.log(`\n[FRAUD DETECTED] Coin ${guid} was double-spent by: ${purchaser}`);
          return purchaser;
        }
      } catch (e) {
        console.error('Decryption failed:', e.message);
      }
    }
  }

  console.log(`\n[MERCHANT FRAUD] Attempted to double-deposit coin ${guid}`);
  return 'merchant';
}

// 7. الدالة الرئيسية مع معالجة الأخطاء
async function main() {
  try {
    console.log('\n=== Creating New Coin ===');
    const coin = new Coin('alice', 20, N.toString(), E.toString());
    
    console.log('\n=== Signing Coin ===');
    coin.signature = signCoin(coin.blinded);
    coin.unblind();
    console.log('Coin signed successfully');

    console.log('\n=== Merchant 1 Accepting Coin ===');
    const ris1 = acceptCoin(coin);
    console.log('Merchant 1 accepted coin');

    console.log('\n=== Merchant 2 Accepting Coin ===');
    const ris2 = acceptCoin(coin);
    console.log('Merchant 2 accepted coin');

    console.log('\n=== Fraud Detection ===');
    determineCheater(coin.guid, ris1, ris2);
    determineCheater(coin.guid, ris1, ris1); // Test merchant fraud case

  } catch (error) {
    console.error('\n[SYSTEM ERROR]', error.message);
    process.exit(1);
  }
}

// تنفيذ البرنامج
main();