//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var state;

$exports.state = function() {
	state = arguments[0];
}

$exports.Location = new function() {
	this.encode = function(p) {
		return p;
	};

	this.decode = function(p) {
		var rv = inonit.js.Object.set({}, p);
		rv.read.GET = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.read.GET);
		rv.write.POST = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.write.POST);
		return rv;
	}
};

$exports.Reference = new function() {
	this.encode = function(p) {
		return p;
	}

	this.decode = function(p) {
		var rv = inonit.js.Object.set({}, p);
		rv.PUT = (function(underlying) {
			return function(tell) {
				var use = underlying;
				if (state.session) {
					use = use.headers({ Authorization: "Firebase " + state.session.firebaseAuthToken });
				}
				return use.apply(this,arguments);
			}
		})(rv.PUT);
		return rv;
	}
}