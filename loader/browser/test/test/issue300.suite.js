//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var failure = false;
if (parameters.form) {
	for (var i=0; i<parameters.form.controls.length; i++) {
		if (parameters.form.controls[i].name == "failure") {
			failure = true;
		}
	}
}
suite.part("try", {
	execute: function(scope,verify) {
		verify(failure).is(false);
	}
});
