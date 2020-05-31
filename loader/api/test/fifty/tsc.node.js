/* eslint-env es6 */
const path = require("path");
const ts = require("typescript");

console.log(ts.getParsedCommandLineOfConfigFile);

//	Looking at tsc executeCommandLineWorker
var project = process.env.PROJECT;
console.log("project: " + project);
var normalized = path.resolve(ts.normalizePath(project))
console.log("path: " + normalized);

const configFileName = ts.findConfigFile(
	normalized,
	function (fileName) { return ts.sys.fileExists(fileName); },
	"jsconfig.json"
);

console.log("config = " + configFileName);
