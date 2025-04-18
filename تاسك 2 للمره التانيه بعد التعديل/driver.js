"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();

// 1. Prepare 10 documents
let coverNames = [
  "James Bond", "Ethan Hunt", "Jason Bourne", 
  "Jack Ryan", "Natasha Romanoff", "Alec Trevelyan",
  "Nikita Mears", "Sydney Bristow", "Michael Westen",
  "Sarah Walker"
];

let originalDocs = coverNames.map(makeDocument);

// 2. Blind each document
let blindDocs = [];
let blindingFactors = [];

for (let i = 0; i < originalDocs.length; i++) {
  let blinded = blind(originalDocs[i], agency.n, agency.e);
  blindDocs.push(blinded.blinded);
  blindingFactors.push(blinded.r);
}

// 3. Have the agency sign one document
agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  // Prepare verification arrays
  let factorsToVerify = blindingFactors.map((factor, index) => 
    index === selected ? undefined : factor
  );
  
  let docsToVerify = originalDocs.map((doc, index) =>
    index === selected ? undefined : doc
  );

  try {
    // Get the blinded signature
    let blindedSig = verifyAndSign(factorsToVerify, docsToVerify);
    
    // Unblind the signature
    let signature = unblind(blindingFactors[selected], blindedSig, agency.n);
    
    // Verify the signature
    let result = blindSignatures.verify({
      unblinded: signature,
      N: agency.n,
      E: agency.e,
      message: originalDocs[selected],
    });
    
    if (result) {
      console.log("Success! The signature is valid for:", originalDocs[selected]);
      console.log("Signature:", signature);
    } else {
      console.log("Error: The signature is invalid!");
    }
  } catch (error) {
    console.error("Verification failed:", error.message);
  }
});