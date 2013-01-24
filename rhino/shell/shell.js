//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var Command = Packages.inonit.system.Command;
var OperatingSystem = Packages.inonit.system.OperatingSystem;
var Streams = Packages.inonit.script.runtime.io.Streams;

$exports.run = function(tokens,mode) {
	var stdout = (mode.stdout) ? mode.stdout : Streams.Null.OUTPUT_STREAM;
	var stderr = (mode.stderr) ? mode.stderr : Streams.Null.OUTPUT_STREAM;
	var stdin = (mode.stdin) ? mode.stdin : Streams.Null.INPUT_STREAM;
	var environment = (function() {
		if (mode.environment) {
			var rv = new Packages.java.util.HashMap();
			for (var x in mode.environment) {
				rv.put( x, mode.environment[x] );
			}
			return rv;
		} else {
			return null;
		}
	})();
	var work = (function(arg) {
		if (!arg) return null;
		if (typeof(arg) == "string") return arguments.callee(new Packages.java.io.File(arg));
		if (arg["class"] == Packages.java.io.File) {
			if (!arg.exists()) throw new Error("Working directory does not exist: " + arg.getCanonicalPath());
			if (!arg.isDirectory()) throw new Error("Working directory is file, not directory: " + arg.getCanonicalPath());
			return arg;
		}
		throw new Error("Unrecognized working directory: value=" + arg + " type=" + typeof(arg));
	})(mode.work);

	var onExit = (mode.onExit) ? mode.onExit : function(result) {
		if (result.error) throw result.error;
		if (result.status != 0) throw "Exit code: " + result.status;
	};

	var context = new JavaAdapter(
		Command.Context,
		{
			getStandardOutput: function() {
				return stdout;
			},
			getStandardError: function() {
				return stderr;
			},
			getStandardInput: function() {
				return stdin;
			},
			getSubprocessEnvironment: function() {
				return environment;
			},
			getWorkingDirectory: function() {
				return work;
			}
		}
	);

	var program = tokens.shift();
	var configuration = new JavaAdapter(
		Command.Configuration,
		{
			getCommand: function() {
				return program;
			},
			getArguments: function() {
				return tokens;
			}
		}
	);
	var result = {
		command: program,
		arguments: tokens
	};
	if (mode.environment) {
		result.environment = mode.environment;
	}
	if (mode.work) {
		result.workingDirectory = mode.work;
	}

	var listener = new JavaAdapter(
		Command.Listener,
		{
			finished: function() {
				result.status = Number( this.getExitStatus().intValue() );
			},
			threw: function(e) {
				result.error = e;
			}
		}
	);

	var runnable = OperatingSystem.get().run( context, configuration, listener );
	runnable.run();
	onExit(result);
}