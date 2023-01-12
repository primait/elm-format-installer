var path = require("path");
var request = require('request');
var package = require('./package.json');
var zlib = require('zlib');
var tar = require('tar');


console.debug("elm-format installer via fork");

module.exports = function(callback)
{
  // figure out URL of binary
  const version = package.version.replace(/^(\d+\.\d+\.\d+).*$/, '$1'); // turn '1.2.3-alpha' into '1.2.3'
  const baseUrl = "https://github.com/primait/elm-format-installer/releases/download/" + version + "/elm-format-" + version;
  const urls = {
    "darwin-x64": baseUrl + "-mac-x64.tgz",
    "darwin-arm64": baseUrl + "-mac-x64.tgz",
    "linux-x64": baseUrl + "-linux-x64.tgz",
    "linux-arm64": baseUrl + "-linux-arm64.tgz",
    "win32-x64": baseUrl + "-win-x64.zip"
  };
  const url = urls[process.platform + '-' + process.arch];

  const binaryPath = path.resolve(__dirname, package.bin["elm-format"]) + (process.platform === 'win32' ? '.exe' : '');

  const decompress = zlib.Unzip()
      .on('error', reportDecompressError);

  const extract = tar.x({C: path.dirname(binaryPath)})
      .on('finish', callback)
      .on('error', reportExtractError);

  reportDownload(version, url);
  request(url)
      .on('error', reportDownloadFailure)
      .pipe(decompress)
      .pipe(extract)
}

// EXIT FAILURE
function exitFailure(url, message) {
  console.error(
      '-- ERROR -----------------------------------------------------------------------\n\n'
      + message
      + '\n\nNOTE: You can avoid npm entirely by downloading directly from:\n'
      + url + '\nAll this package does is download that file and put it somewhere.\n\n'
      + '--------------------------------------------------------------------------------\n'
  );
  process.exit(1);
}

// REPORT DOWNLOAD
function reportDownload(version, url) {
  console.log(
      '--------------------------------------------------------------------------------\n\n'
      + 'Downloading Elm-format ' + version + ' from GitHub.'
      + '\n\nNOTE: You can avoid npm entirely by downloading directly from:\n'
      + url + '\nAll this package does is download that file and put it somewhere.\n\n'
      + '--------------------------------------------------------------------------------\n'
  );
}

function reportDownloadFailure(error) {
  exitFailure(url,'Something went wrong while fetching the following URL:\n\n' + url + '\n\nIt is saying:\n\n' + error);
}

function reportDecompressError(error) {
  exitFailure(url, 'I ran into trouble decompressing the downloaded binary. It is saying:\n\n' + error);
}

function reportExtractError(error) {
  exitFailure(url, 'I had some trouble extracting the archive. It is saying:\n\n' + error);
}
