//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.java.Context } $context
	 * @param { slime.loader.Export<Pick<slime.jrunscript.shell.java.Exports,"Jdk">> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.jrunscript.shell.java.Exports["Jdk"]["from"]["base"] } */
		var fromBase = function(base) {
			if (base === null || typeof(base) == "undefined") {
				return $api.fp.Result.from.failure({
					type: "empty-base",
					missing: (base === null) ? "null" : "undefined"
				});
			}
			if (typeof(base) != "string") {
				throw new TypeError("Expected string base, got " + typeof(base));
			}
			var normalized = base.trim();
			if (normalized.length == 0) {
				return $api.fp.Result.from.failure({
					type: "empty-base",
					missing: "empty-string"
				});
			}
			return $api.fp.Result.from.success({ base: normalized });
		};

		$export({
			Jdk: {
				from: {
					base: fromBase,
					javaHome: function() {
						var home = $context.home();
						var javaHome = home.pathname;
						//	TODO	workaround for JDK 8. Really, we should figure out a better API for determining Java home directory
						//			under various versions.
						if (javaHome.basename == "jre") javaHome = javaHome.parent;
						var from = fromBase(javaHome.toString());
						if (from.ok === false) {
							throw new Error("Could not create Jdk from java.home: " + JSON.stringify(from.error));
						}
						return from.value;
					}
				},
				jrunscript: function(jdk) {
					return $context.getJrunscriptPathFromJdk(jdk.base);
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
