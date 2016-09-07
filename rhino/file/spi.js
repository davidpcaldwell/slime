//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.canonicalize = function(string,separator) {
	var tokens = string.split(separator);
	var rv = [];
	for (var i=0; i<tokens.length; i++) {
		var name = tokens[i];
		if (name == ".") {
			//	do nothing
		} else if (name == "..") {
			rv.pop();
		} else {
			rv.push(name);
		}
	}
	return rv.join(separator);
};

//	TODO	Factor these implementations out by filesystem
$exports.getParentPath = function(path,separator) {
	var tokens = path.split(separator);
	tokens.pop();
	if (tokens.length == 1) {
		if (separator == "/") {
			return "/";
		} else {
			return tokens[0] + separator;
		}
	} else {
		return tokens.join(separator);
	}
};

if (true && typeof(Packages.inonit.script.runtime.io.Filesystem.Optimizations) == "function") {
	var _spi = Packages.inonit.script.runtime.io.Filesystem.Optimizations.INSTANCE;
	$exports.canonicalize = function(string,separator) {
		return String(_spi.canonicalize(string,separator));
	}
	$exports.getParentPath = function(string,separator) {
		return String(_spi.getParentPath(string,separator));
	}
}