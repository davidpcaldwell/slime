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

$exports.run = function(p) {
	var stdio = arguments.callee.stdio(p);
	var context = new JavaAdapter(
		Packages.inonit.system.Command.Context,
		new function() {
			this.getStandardOutput = function() {
				return (stdio && stdio.output) ? stdio.output.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};

			this.getStandardError = function() {
				return (stdio && stdio.error) ? stdio.error.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};

			this.getStandardInput = function() {
				return (stdio && stdio.input) ? stdio.input.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM;
			};

			this.getSubprocessEnvironment = function() {
				if (p.environment) {
					var rv = new Packages.java.util.HashMap();
					for (var x in p.environment) {
						rv.put( x, p.environment[x] );
					}
					return rv;
				} else {
					return $context._environment;
				}
			};

			this.getWorkingDirectory = function() {
				if (p.workingDirectory) {
					if (p.workingDirectory && p.workingDirectory.pathname) {
						return p.workingDirectory.pathname.java.adapt();
					}
				}
				return null;
			};
		}
	);

	var invocation = (function() {
		var rv = {
			configuration: {},
			result: {}
		};

		var toCommandToken = function(arg) {
			var index = (arguments.length > 1) ? arguments[1] : null;
			var label = (typeof(index) == "number") ? "token " + String(index) + " '" + arg + "'" : "'" + arg + "'";
			if (typeof(arg) == "undefined") {
				throw new TypeError(label + " cannot be undefined.");
			}
			if (arg === null) throw new TypeError(label + " cannot be null.");
			if (arg && typeof(arg) == "object") return String(arg);
			//	TODO	the below check does not allow the empty string to be a token
			if (arg && typeof(arg) == "string") return arg;
			throw new TypeError(label + " is not a string nor an object that can be converted to string.");
		}

		if (p.tokens) {
			//	TODO	ensure array
			if (p.tokens.length == 0) {
				throw new TypeError("tokens cannot be zero-length.");
			}
			//	Use a raw copy of the arguments for the callback
			rv.result.command = p.tokens[0];
			rv.result.arguments = p.tokens.slice(1);
			//	Convert the arguments to strings for invocation
			var configuration = p.tokens.map(toCommandToken);
			rv.configuration.command = configuration[0];
			rv.configuration.arguments = configuration.slice(1);
			return rv;
		} else if (typeof(p.command) != "undefined") {
			rv.result.command = p.command;
			rv.result.arguments = p.arguments;
			rv.configuration.command = toCommandToken(p.command);
			rv.configuration.arguments = (p.arguments) ? p.arguments.map(toCommandToken) : [];
			return rv;
		} else {
			throw new TypeError("Required: command property or tokens property");
		}
	})();

	var configuration = new JavaAdapter(
		Packages.inonit.system.Command.Configuration,
		new function() {
			this.getCommand = function() {
				return invocation.configuration.command;
			};

			this.getArguments = function() {
				return invocation.configuration.arguments;
			};
		}
	);
	var result = {
		command: invocation.result.command,
		arguments: invocation.result.arguments
	};
	if (p.environment) {
		result.environment = p.environment;
	}
	if (p.workingDirectory) {
		result.workingDirectory = p.workingDirectory;
	}

	var _listener = Packages.inonit.system.OperatingSystem.get().run( context, configuration );
	if (_listener.getLaunchException()) {
		result.error = _listener.getLaunchException();
	} else {
		result.status = Number( _listener.getExitStatus().intValue() );
	}
	var evaluate = (p.evaluate) ? p.evaluate : arguments.callee.evaluate;
	return evaluate(result);
};
$exports.run.evaluate = function(result) {
	if (result.error) throw result.error;
	if (result.status != 0) throw new Error("Exit code: " + result.status + " executing " + result.command + " " + result.arguments.join(" "));
	return result;
};
$exports.run.stdio = (function(p) {
	if (p.stdio) return p.stdio;
	if (p.stdin || p.stdout || p.stderr) return $api.deprecate(function() {
		return {
			input: p.stdin,
			output: p.stdout,
			error: p.stderr
		};
	})();
});

$exports.environment = (function() {
	var getter = function(value) {
		return function() {
			return value;
		};
	};

	var isCaseInsensitive = (function() {
		var jenv = Packages.java.lang.System.getenv();
		var i = jenv.keySet().iterator();
		while(i.hasNext()) {
			var name = String(i.next());
			var value = String(jenv.get(name));
			if (name != name.toUpperCase()) {
				return String(Packages.java.lang.System.getenv(name.toUpperCase())) == value;
			}
		}
		return function(){}();
	})();

	var jenv = ($context._environment) ? $context._environment : Packages.java.lang.System.getenv();
	var rv = {};
	var i = jenv.keySet().iterator();
	while(i.hasNext()) {
		var name = String(i.next());
		var value = String(jenv.get(name));
		if (isCaseInsensitive) {
			name = name.toUpperCase();
		}
		rv.__defineGetter__(name, getter(value));
	}
	return rv;
})();

//	TODO	Document $context._properties
var _properties = ($context._properties) ? $context._properties : Packages.java.lang.System.getProperties();
$exports.properties = $context.api.java.Properties.adapt(_properties);
$api.experimental($exports,"properties");