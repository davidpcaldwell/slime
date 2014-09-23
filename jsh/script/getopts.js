//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var $arguments = $context.$arguments;
var $filesystem = $context.$filesystem;
var $Pathname = $context.$Pathname;
var $workingDirectory = $context.$workingDirectory;

var PRESENT = function() {
	return new function() {
		this.parser = function(name,array,rv) {
			this.value = true;
		};
		this.value = false;
	}
};
var STRING = function(value) {
	return {
		parser: function(name,array,rv) {
			this.value = array.shift();
		},
		value: value
	};
}
var NUMBER = function(value) {
	return {
		parser: function(name,array,rv) {
			this.value = Number( array.shift() );
		},
		value: value
	}
}
var PATHNAME = function(value) {
	var filesystem = $filesystem;

	var isAbsolute = function(string) {
		//	Cover UNIX case, Windows network drive, UNIX network drive
		var start = string.substring(0,1);
		if (start == filesystem.$jsh.PATHNAME_SEPARATOR) return true;
		if (filesystem.$jsh.PATHNAME_SEPARATOR == "\\") {
			if (string.substring(1,2) == ":" || string.substring(2,3) == filesystem.$jsh.PATHNAME_SEPARATOR) {
				return true;
			}
			//	Cover Windows drive letter
		}
		if (start == "/" || start == "\\") {
			//	using wrong path separator character, we handle as error
			throw "Path separator for this platform is " + filesystem.$jsh.PATHNAME_SEPARATOR;
		}
		return false;
	}

	return new function() {
		this.parser = function(name,array,rv) {
			var value = array.shift();
			if (isAbsolute(value)) {
				var pathname = $filesystem.Pathname(value);
				this.value = pathname;
			} else {
				var pathname = $workingDirectory.getRelativePath(value);
				this.value = pathname;
			}
		}
		this.value = value;
	}
}
var getOption = function(type) {
	if (false) {
	} else if (type == String) {
		return STRING();
	} else if (type == Number) {
		return NUMBER();
	} else if (type == Boolean) {
		return PRESENT();
	} else if (type == $Pathname) {
		return PATHNAME();
	}
}
var ARRAY = function(type) {
	if (getOption(type)) {
		var typeParser = getOption(type);
	} else {
		throw new TypeError("Unknown array type: " + type);
	}

	return new function() {
		var values = [];

		this.parser = function(name,array,rv) {
			//	Seems unneeded, so commenting out to see
//			rv.options[name] = values;

			//	TODO	the below code is unclear
			var STRING = "foo";
			var RV = { options: {} };

			typeParser.parser(STRING,array,RV);

			values.push( typeParser.value );
		};

		this.value = values;
	}
};
var OBJECT = function(type) {
	var parser = getOption(type);
	if (!parser) throw new TypeError("Unknown type for OBJECT argument: " + type);
	return new function() {
		var values = {};

		this.parser = function(name,array,rv) {
			throw new Error("Unimplemented.");
		};

		this.value = values;
	}
}

var getopts = function(settings,array) {
	if (settings instanceof Array) {
		warning("DEPRECATED: invoking getopts with (array,settings)");
		//	deprecated
		var tmp = array;
		array = settings;
		settings = tmp;
	}
	if (arguments.length == 2 && array == null) {
		throw new Error("Required: second argument to getopts containing array of arguments to process.");
	}
	if (typeof(array) == "undefined") {
		if ($arguments) {
			array = $arguments;
		}
		if (typeof(array) == "undefined") {
			throw "Required: second argument to getopts containing array of arguments to process.";
		}
	}
	//	Make this work with the arguments object
	array = Array.prototype.slice.call(array,0);

	var Parser = function(settings) {
		if (!settings) settings = {};

		var options = {};

		var unhandled = getopts.UNEXPECTED_OPTION_PARSER.INTERPRET;

		if (settings.options) {
			for (var x in settings.options) {
				if (typeof(settings.options[x]) == "string") {
					var v = STRING(settings.options[x]);
					options[x] = v;
				} else if (typeof(settings.options[x]) == "number") {
					var v = NUMBER(settings.options[x]);
					options[x] = v;
				} else if (typeof(settings.options[x]) == "boolean" && !settings.options[x]) {
					var v = PRESENT();
					options[x] = v;
				} else if (typeof(settings.options[x]) == "boolean" && settings.options[x]) {
					throw new Error("A boolean option declared to be true cannot be negated.");
				} else if (
						settings.options[x].java && settings.options[x].java.adapt
						&& String(settings.options[x].java.adapt().getClass().getName()) == "java.io.File"
					)
				{
					//	TODO	the check above is a workaround for the fact that instanceof and the constructor property for
					//			Pathname does not work; we should be doing instanceof $Pathname
					var v = PATHNAME(settings.options[x]);
					options[x] = v;
				} else if (getOption(settings.options[x])) {
					options[x] = getOption(settings.options[x]);
				} else {
					options[x] = settings.options[x];
				}
			}
		}

		if (settings.unhandled) {
			unhandled = settings.unhandled;
		}

		var others = [];

		this.parse = function(array) {
			var next = array.shift();
			if (next.substring(0,1) == "-") {
				var name = next.substring(1);
				var handler;
				if (options[name]) {
					handler = options[name];
				} else {
					handler = {
						parser: unhandled
					};
				}
				handler.parser(name,array,null);
			} else {
				others.push(next);
			}
		}

		this.parsed = function() {
			return {
				options: (function() {
					var rv = {};
					for (var x in options) {
						rv[x] = options[x].value;
					}
					return rv;
				})(options),
				arguments: others
			};
		}
	}

	var parser = new Parser(settings);

	while(array.length > 0) {
		parser.parse(array);
	}

	return parser.parsed();
}

getopts.ARRAY = ARRAY;

getopts.UNEXPECTED_OPTION_PARSER = {};
getopts.UNEXPECTED_OPTION_PARSER.ERROR = function(name,array,rv) {
	throw "Unrecognized option -" + name;
}
getopts.UNEXPECTED_OPTION_PARSER.IGNORE = function(name,array,rv) {
	if (array.length == 0 || array[0].substring(0,1) == "-") {
	} else {
		array.shift();
	}
}
getopts.UNEXPECTED_OPTION_PARSER.SKIP = function(name,array,rv) {
	rv.arguments.push("-" + name);
	if (array.length == 0 || array[0].substring(0,1) == "-") {
	} else {
		rv.arguments.push(array.shift());
	}
}
getopts.UNEXPECTED_OPTION_PARSER.INTERPRET = function(name,array,rv) {
	if (array.length == 0 || array[0].substring(0,1) == "-") {
		PRESENT().parser(name,array,rv);
	} else {
		STRING().parser(name,array,rv);
	}
}

$exports.getopts = getopts;