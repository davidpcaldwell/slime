//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.file = $loader.file("Loader.file.js");

var grandchild = $loader.module("Loader/module.js");

$exports.resource = function(path) {
	return $loader.get(path);
};
$exports.grandchildResource = function(path) {
	return grandchild.resource(path);
}
