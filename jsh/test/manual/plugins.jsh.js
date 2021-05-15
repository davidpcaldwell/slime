//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var exception = function() {
	try {
		throw new Error("Don't break");
	} catch (e) {
	}
};

var e2 = $api.debug.disableBreakOnExceptionsFor(exception);

//	should break
debugger;
exception();
//	should not break
debugger;
e2();

debugger;
//	Check for jsh.http, which currently should load in unbuilt shell because we search from public/slime/ for plugin.jsh.js
