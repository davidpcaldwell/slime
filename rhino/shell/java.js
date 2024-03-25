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
		$export({
			Jdk: {
				from: {
					javaHome: function() {
						var home = $context.home();
						var javaHome = home.pathname;
						//	TODO	workaround for JDK 8. Really, we should figure out a better API for determining Java home directory
						//			under various versions.
						if (javaHome.basename == "jre") javaHome = javaHome.parent;
						return {
							base: javaHome.toString()
						};
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
