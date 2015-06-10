//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.shell && jsh.unit;
	},
	load: function() {
		var ForkScenario = function(p) {
			return new jsh.unit.Scenario({
				name: p.name,
				execute: function(scope) {
					p.method(jsh.js.Object.set({}, p, {
						evaluate: function(result) {
							scope.test(function() {
								return {
									success: !result.status,
									message: "Exit status " + result.status
								}
							});
						}
					}))
				}
			});
		}

		jsh.unit.CommandScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.run
			}));
		};
		jsh.unit.ScriptScenario = function(p) {
			return new ForkScenario(jsh.js.Object.set({}, p, {
				method: jsh.shell.jsh
			}));
		};
	}
})