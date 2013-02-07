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
	var context = new JavaAdapter(
		Packages.inonit.system.Command.Context,
		new function() {
			this.getStandardOutput = function() {
				return (p.stdout) ? p.stdout.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};
			
			this.getStandardError = function() {
				return (p.stderr) ? p.stderr.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM;
			};
			
			this.getStandardInput = function() {
				return (p.stdin) ? p.stdin.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM;
			};
			
			this.getSubprocessEnvironment = function() {
				if (p.environment) {
					var rv = new Packages.java.util.HashMap();
					for (var x in p.environment) {
						rv.put( x, p.environment[x] );
					}
					return rv;
				} else {
					return null;
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

	var configuration = new JavaAdapter(
		Packages.inonit.system.Command.Configuration,
		new function() {
			var command;
			var args;
			if (p.tokens) {
				command = p.tokens.shift();
				if (typeof(command) == "undefined") {
					throw new TypeError("token 0 cannot be undefined.");
				}
				if (typeof(command) == "object" && command) {
					command = String(command);
				}
				args = p.tokens.slice(0);
				for (var i=0; i<args.length; i++) {
					if (typeof(args[i]) == "object" && args[i]) {
						args[i] = String(args[i]);
					}
				}
			}
			
			this.command = command;
			this.arguments = args;
			
			this.getCommand = function() {
				return command;
			};
			
			this.getArguments = function() {
				return args;
			};
		}
	);
	var result = {
		command: configuration.delegee.command,
		arguments: configuration.delegee.arguments
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
	var evaluate = (p.evaluate) ? p.evaluate : function(result) {
		if (result.error) throw result.error;
		if (result.status != 0) throw new Error("Exit code: " + result.status + " executing " + result.command + " " + result.arguments.join(" "));
		return result;
	};
	return evaluate(result);
};

$exports.environment = (function() {
	var getter = function(value) {
		return function() {
			return value;
		};
	};
	
	var jenv = Packages.java.lang.System.getenv();
	var rv = {};
	var i = jenv.keySet().iterator();
	while(i.hasNext()) {
		var name = String(i.next());
		rv.__defineGetter__(name, getter(String(jenv.get(name))));
	}
	return rv;
})();

//	TODO	Document $context.$properties
var $properties = ($context.$properties) ? $context.$properties : Packages.java.lang.System.getProperties();
$exports.properties = $context.api.java.Properties.adapt($properties);
$api.experimental($exports,"properties");