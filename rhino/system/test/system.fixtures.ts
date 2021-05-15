//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(Packages: slime.jrunscript.Packages, jsh: slime.jsh.Global, $export: (value: slime.jrunscript.native.inonit.system.test.Fixtures) => void) {
		$export({
			OperatingSystem: {
				Environment: {
					create: function(p: { values: object, caseSensitive: boolean }): slime.jrunscript.native.inonit.system.OperatingSystem.Environment {
						return jsh.java.invoke({
							method: {
								class: Packages.inonit.system.OperatingSystem.Environment,
								name: "create",
								parameterTypes: [
									Packages.java.util.Map,
									Packages.java.lang.Boolean.TYPE
								]
							},
							arguments: [
								jsh.java.Map({ object: p.values }),
								p.caseSensitive
							]
						})
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages, jsh, $export);
