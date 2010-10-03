//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var $arguments = $context.$arguments;
var $filesystem = $context.$filesystem;
var $Pathname = $context.$Pathname;
var $workingDirectory = $context.$workingDirectory;

var PRESENT = {
	parser: function(name,array,rv) {
		rv.options[name] = true;
	},
	"default": false
}
var STRING = function(value) {
	return {
		parser: function(name,array,rv) {
			rv.options[name] = array.shift();
		},
		"default": value
	};
}
var NUMBER = function(value) {
	return {
		parser: function(name,array,rv) {
			rv.options[name] = Number( array.shift() );
		},
		"default": value
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
				rv.options[name] = pathname;
			} else {
				var pathname = $workingDirectory.getRelativePath(value);
				rv.options[name] = pathname;
			}
		}
		this["default"] = value;
	}
}
var getParser = function(type) {
	if (false) {
	} else if (type == String) {
		return STRING().parser;
	} else if (type == Number) {
		return NUMBER().parser;
	} else if (type == Boolean) {
		return PRESENT.parser;
	} else if (type == $Pathname) {
		return PATHNAME().parser;
	}
}
var ARRAY = function(type) {
	if (getParser(type)) {
		var typeFunction = { parser: getParser(type) };
	} else {
		throw "Unknown array type: " + type;
	}

	return new function() {
		var typeParser = typeFunction.parser;
		var values = [];

		this.parser = function(name,array,rv) {
			rv.options[name] = values;

			var STRING = "foo";
			var RV = { options: {} };

			typeParser(STRING,array,RV);

			values.push( RV.options[STRING] );
		};

		this["default"] = values;
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
	if (typeof(array) == "undefined") {
		if ($arguments) {
			array = $arguments;
		}
		if (typeof(array) == "undefined") {
			throw "Required: second argument to getopts containing array of arguments to process.";
		}
	}

	var Parser = function(settings) {
		if (!settings) settings = {};

		var switches = {};
		var defaults = {};

		var unhandled = getopts.UNEXPECTED_OPTION_PARSER.INTERPRET;

		if (settings.options) {
			for (var x in settings.options) {
				if (typeof(settings.options[x]) == "string") {
					var v = STRING(settings.options[x]);
					switches[x] = v.parser;
					defaults[x] = v["default"];
				} else if (typeof(settings.options[x]) == "number") {
					var v = NUMBER(settings.options[x]);
					switches[x] = v.parser;
					defaults[x] = v["default"];
				} else if (typeof(settings.options[x]) == "boolean" && !settings.options[x]) {
					var v = PRESENT;
					switches[x] = v.parser;
					defaults[x] = v["default"];
				} else if (typeof(settings.options[x]) == "boolean" && settings.options[x]) {
					throw "A boolean option declared to be true cannot be negated.";
				} else if (settings.options[x] instanceof $Pathname) {
					var v = PATHNAME(settings.options[x]);
					switches[x] = v.parser;
					defaults[x] = v["default"];
				} else if (getParser(settings.options[x])) {
					switches[x] = getParser(settings.options[x]);
				} else {
					switches[x] = settings.options[x].parser;
					defaults[x] = settings.options[x]["default"];
				}
			}
		}

		if (settings.unhandled) {
			unhandled = settings.unhandled;
		}

		var rv = {
			options: defaults,
			arguments: []
		};

		this.parse = function(array) {
			var next = array.shift();
			if (next.substring(0,1) == "-") {
				var name = next.substring(1);
				var handler;
				if (switches[name]) {
					handler = switches[name];
				} else {
					handler = unhandled;
				}
				handler(name,array,rv);
			} else {
				rv.arguments.push(next);
			}
		}

		this.parsed = function() {
			return rv;
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
		PRESENT.parser(name,array,rv);
	} else {
		STRING().parser(name,array,rv);
	}
}

$exports.getopts = getopts;
