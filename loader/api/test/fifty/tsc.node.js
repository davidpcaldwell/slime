/* eslint-env es6 */
const path = require("path");
const ts = require("typescript");
const { Console } = require("console");

var output = global.console;
var console = new Console(process.stderr);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

var kinds = (function() {
	const rv = {};
	for (var x in ts.SyntaxKind) {
		rv[ts.SyntaxKind[x]] = x;
	}
	return rv;
})();

const debug = {
	code: function(node) {
		return printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile())
	},
	kind: function(node) {
		return kinds[node.kind];
	},
	qname: function(node,program) {
		var rv = [];
		var symbol = program.getTypeChecker().getSymbolAtLocation(node.name);
		rv.push(symbol.name);
		var parent = symbol.parent;
		while(parent) {
			rv.unshift(parent.name);
			parent = parent.parent;
		}
		return rv.join(".");
	}
}
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

function performCompilation(sys, cb, reportDiagnostic, config, fileName) {
	var fileNames = config.fileNames, options = config.options, projectReferences = config.projectReferences;
	var host = ts.createCompilerHostWorker(options, undefined, sys);
	var currentDirectory = host.getCurrentDirectory();
	var getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
	ts.changeCompilerHostLikeToUseCache(host, function (fileName) { return ts.toPath(fileName, currentDirectory, getCanonicalFileName); });
	enableStatistics(sys, options);
	var programOptions = {
		rootNames: (fileName) ? [fileName] : fileNames,
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

//	See https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#using-the-type-checker
const generateDocumentation = function(program) {
	// Get the checker, we will use it to find more about classes
	let checker = program.getTypeChecker();
	let output = [];

	// Visit every sourceFile in the program
	for (const sourceFile of program.getSourceFiles()) {
		console.log("sourceFile = " + sourceFile.fileName);
		if (sourceFile.fileName.indexOf("node_modules") != -1) {
			console.log("Skipping.");
			continue;
		}
		if (true || !sourceFile.isDeclarationFile) {
			// Walk the tree to search for classes
			ts.forEachChild(sourceFile, visit);
		}
	}

	// // print out the doc
	// fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

	return output;

	/** visit nodes finding exported classes */
	function visit(node) {
		const qname = function() {
			return debug.qname(node, program);
		}

		const type = function() {
			return checker.getTypeOfSymbolAtLocation( checker.getSymbolAtLocation(node.name), node );
		}

		// Only consider exported nodes
		if (false && !isNodeExported(node)) {
			console.log("Not exported: " + node);
			return;
		}

		if (ts.isClassDeclaration(node) && node.name) {
			// This is a top level class, get its symbol
			let symbol = checker.getSymbolAtLocation(node.name);
			if (symbol) {
				output.push(serializeClass(symbol));
			}
			// No need to walk any further, class expressions/inner declarations
			// cannot be exported
		} else if (ts.isModuleDeclaration(node)) {
			// This is a namespace, visit its children
			ts.forEachChild(node, visit);
		} else if (ts.isModuleBlock(node)) {
			// This is a namespace, visit its children
			ts.forEachChild(node, visit);
		} else if (ts.isInterfaceDeclaration(node)) {
			node.members.forEach(visit);
		} else {
			const kind = kinds[node.kind];
			const code = debug.code(node, node.getSourceFile());
			//	PropertySignature: checker.typeToString( checker.getTypeOfSymbolAtLocation( checker.getSymbolAtLocation(node.name), node ) )
			console.log("kind = " + kind);
			debugger;
		}
	}

	/** Serialize a symbol into a json object */
	function serializeSymbol(symbol) {
		return {
			name: symbol.getName(),
			documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
			type: checker.typeToString(
				checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
			)
		};
	}

	/** Serialize a class symbol information */
	function serializeClass(symbol) {
		let details = serializeSymbol(symbol);

		// Get the construct signatures
		let constructorType = checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration
		);
		details.constructors = constructorType
			.getConstructSignatures()
			.map(serializeSignature);
		return details;
	}

	/** Serialize a signature (call or construct) */
	function serializeSignature(signature) {
		return {
			parameters: signature.parameters.map(serializeSymbol),
			returnType: checker.typeToString(signature.getReturnType()),
			documentation: ts.displayPartsToString(signature.getDocumentationComment(checker))
		};
	}

	/** True if this is visible outside this file, false otherwise */
	function isNodeExported(node) {
		return (
			(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
			(!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
		);
	}
}

const main = function(args) {
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
			var documentation = generateDocumentation(program);
			output.log(JSON.stringify(documentation, void(0), 2));
			debugger;
			//console.log(program.getRootFileNames());
			//	TODO	now that we have the program, see:
			//			https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#using-the-type-checker
			//			for reference on how we might proceed
			//			see also potentially https://github.com/ktsn/ts-compiler-api-examples/blob/master/src/3-type-checking.ts
		},
		reportDiagnostic,
		configParseResult,
		args[0]
	)

	console.log("Finished with exit status: " + status);
}

main(process.argv.slice(2));
