'use strict';

// Titik masuk chaincode. Mendaftarkan kontrak PlasmaNutfahContract
// agar dapat dipanggil oleh Hyperledger Fabric.

const PlasmaNutfahContract = require('./lib/plasmaNutfahContract');

module.exports.PlasmaNutfahContract = PlasmaNutfahContract;
module.exports.contracts = [PlasmaNutfahContract];
