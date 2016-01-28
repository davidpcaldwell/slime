//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Handler = function(p) {
	throw new Error("Reserved for future use.");
};
$exports.Handler.series = function() {
	var delegates = arguments;
	return function(request) {
		for (var i=0; i<delegates.length; i++) {
			var handler = (function(argument) {
				if (typeof(argument) == "object") {
					return new $exports.Handler(argument);
				} else if (typeof(argument) == "function") {
					return argument;
				}
			})(delegates[i]);
			var rv = handler(request);
			if (typeof(rv) != "undefined") return rv;
		}
	}
};
$exports.Handler.Child = function(p) {
	if (typeof(p.filter) == "object" && p.filter instanceof RegExp) {
		return function(request) {
			var match = p.filter.exec(request.path);
			if (match) {
				var req = request;
				for (var x in request) {
					req[x] = request[x];
				}
				req.path = match[1];
				return p.handle(req);
			}
		};
	}
}
