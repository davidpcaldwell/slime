//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the js/object SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(element) {
		for (var i=0; i<this.length; i++) {
			if (this[i] == element) {
				return i;
			}
		}
		return -1;
	}
}
//	TODO	JS 1.6: Array.prototype.lastIndexOf()

if (!Array.prototype.filter) {
	Array.prototype.filter = function(f) {
		var rv = [];
		for (var i=0; i<this.length; i++) {
			if (f(this[i])) {
				rv.push(this[i]);
			}
		}
		return rv;
	}
}
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(f) {
		for (var i=0; i<this.length; i++) {
			f(this[i], i, this);
		}
	}
}
//	TODO	JS 1.6: Array.prototype.every()
if (!Array.prototype.map) {
	Array.prototype.map = function(f) {
		var rv = [];
		for (var i=0; i<this.length; i++) {
			rv[i] = f(this[i], i, this);
		}
		return rv;
	}
}
//	TODO	JS 1.6: Array.prototype.some()

//	TODO	JS 1.8: Array.prototype.reduce()
//	TODO	JS 1.8: Array.prototype.reduceRight()
//	TODO	JS 1.8.5: isArray()
