//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Does "Pause on caught exceptions" work?
try {
	throw new Error();
} catch (e) {
}

//	What about pausing on *uncaught* exceptions?

(function() {
	var x = {};
	x.foo();
})();
