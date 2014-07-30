//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	is there a better way in our error framework?
var newError = function(p) {
	var e = new Error();
	for (var x in p) {
		e[x] = p[x];
	}
	return e;
}

$exports.Application = function(o) {
	var toFunction = function(command) {
		if (command.getopts) {
			return function(globals) {
				var parameters = $context.getopts(command.getopts, globals.arguments);
				return command.run.call(this,
					$context.js.Object.set(
						{},
						{
							global: globals.options
						}, parameters
					)
				);
			}
		} else {
			throw new Error("Unsupported format: lacking getopts/command");
		}
	};

	this.run = function() {
		var globals = $context.getopts({
			options: o.options,
			unhandled: $context.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		}, arguments);

		if (globals.arguments.length == 0) {
			throw newError({ usage: true });
		}

		var command = globals.arguments.shift();
		var object = eval("o.commands." + command);
		if (typeof(object) != "object" || !object) {
			throw newError({ commandNotFound: command });
		}
		return toFunction(object).call(o, { options: globals.options, arguments: globals.arguments });
	};
};
