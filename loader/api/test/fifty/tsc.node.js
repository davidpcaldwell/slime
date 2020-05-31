/* eslint-env es6 */
const path = require("path");
const ts = require("typescript");

//	Shims supporting copy-pasted functions

function shouldBePretty(sys, options) {
	return true;
}

function enableStatistics() {
}

function reportStatistics(sys, program) {
}

//	Copy-pasted from tsc

function createReportErrorSummary(sys, options) {
	return shouldBePretty(sys, options) ?
		function (errorCount) { return sys.write(ts.getErrorSummaryText(errorCount, sys.newLine)); } :
		undefined;
}

function performCompilation(sys, cb, reportDiagnostic, config) {
	var fileNames = config.fileNames, options = config.options, projectReferences = config.projectReferences;
	var host = ts.createCompilerHostWorker(options, undefined, sys);
	var currentDirectory = host.getCurrentDirectory();
	var getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
	ts.changeCompilerHostLikeToUseCache(host, function (fileName) { return ts.toPath(fileName, currentDirectory, getCanonicalFileName); });
	enableStatistics(sys, options);
	var programOptions = {
		rootNames: fileNames,
		options: options,
		projectReferences: projectReferences,
		host: host,
		configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config)
	};
	var program = ts.createProgram(programOptions);
	var exitStatus = ts.emitFilesAndReportErrorsAndGetExitStatus(program, reportDiagnostic, function (s) { return sys.write(s + sys.newLine); }, createReportErrorSummary(sys, options));
	reportStatistics(sys, program);
	cb(program);
	return sys.exit(exitStatus);
}

//	Mimic basic flow of tsc.js: executeCommandLine, executeCommandLineWorker

var project = process.env.PROJECT;
var normalized = path.resolve(ts.normalizePath(project))

//	TODO	can we invoke the logic that calculates the name of the config file, rather than hard=coding?
const configFileName = ts.findConfigFile(
	normalized,
	function (fileName) { return ts.sys.fileExists(fileName); },
	"jsconfig.json"
);

const commandLine = ts.parseCommandLine([], function (path) { return system.readFile(path); });
const commandLineOptions = ts.convertToOptionsWithAbsolutePaths(commandLine.options, function (fileName) { return ts.getNormalizedAbsolutePath(fileName, currentDirectory); });
const reportDiagnostic = ts.createDiagnosticReporter(ts.sys);

const configParseResult = ts.parseConfigFileWithSystem(
	configFileName,
	commandLineOptions,
	commandLine.watchOptions,
	ts.sys,
	reportDiagnostic
);

const status = performCompilation(
	Object.assign({}, ts.sys, {
		exit: function(status) {
			return status;
		}
	}),
	function(program) {
		console.log(program);
		const typeChecker = program.getTypeChecker();
		console.log(typeChecker);
		debugger;
		//console.log(program.getRootFileNames());
		//	TODO	now that we have the program, see:
		//			https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#using-the-type-checker
		//			for reference on how we might proceed
	},
	reportDiagnostic,
	configParseResult
)

console.log("Finished with exit status: " + status);
