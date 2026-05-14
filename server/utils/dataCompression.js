/**
 * Data Compression Module
 * Demonstrates: Compressing and Decompressing Data with Zlib
 */

const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Compress data using gzip
 */
async function compressData(data) {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = await gzip(jsonString);
    return compressed;
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

/**
 * Decompress data using gunzip
 */
async function decompressData(compressedData) {
  try {
    const decompressed = await gunzip(compressedData);
    const jsonString = decompressed.toString('utf8');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}

module.exports = {
  compressData,
  decompressData
};






