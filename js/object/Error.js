//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the js/object SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Error = {};

$exports.Error.Type = function(name) {
	var rv = function(message,properties) {
		if (this instanceof arguments.callee) {
			this.name = name;
			this.message = message;
			var template = new Error();
			if (template.stack) {
				this.stack = template.stack;
			}
			for (var x in properties) {
				this[x] = properties[x];
			}
		} else {
			return new arguments.callee(message);
		}
	};
	rv.prototype = new Error();
	return rv;
};
