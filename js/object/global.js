//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the js/object SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Array = {};
$exports.String = {};
$exports.Array.indexOf = function(element) {
	for (var i=0; i<this.length; i++) {
		if (this[i] == element) {
			return i;
		}
	}
	return -1;
}
$exports.Array.filter = function(f,target) {
	var rv = [];
	for (var i=0; i<this.length; i++) {
		if (f.call(target,this[i])) {
			rv.push(this[i]);
		}
	}
	return rv;
}
$exports.Array.forEach = function(f,target) {
	for (var i=0; i<this.length; i++) {
		f.call(target,this[i],i,this);
	}
}
$exports.Array.map = function(f,target) {
	var rv = [];
	for (var i=0; i<this.length; i++) {
		rv[i] = f.call(target,this[i],i,this);
	}
	return rv;
}
$exports.String.trim = function() {
	return this.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
}
