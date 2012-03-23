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

if (!Array.prototype.filter) {
	Array.prototype.filter = function(f,target) {
		var rv = [];
		for (var i=0; i<this.length; i++) {
			if (f.call(target,this[i])) {
				rv.push(this[i]);
			}
		}
		return rv;
	}
}
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(f,target) {
		for (var i=0; i<this.length; i++) {
			f.call(target,this[i],i,this);
		}
	}
}
if (!Array.prototype.map) {
	Array.prototype.map = function(f,target) {
		var rv = [];
		for (var i=0; i<this.length; i++) {
			rv[i] = f.call(target,this[i],i,this);
		}
		return rv;
	}
}

if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
	}
}