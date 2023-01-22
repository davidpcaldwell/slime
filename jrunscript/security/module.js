//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.security.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.security.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		$export({
			certificates: function() {
				//	https://docs.oracle.com/javase/6/docs/technotes/guides/security/jsse/JSSERefGuide.html#InstallationAndCustomization
				var _file = new Packages.java.io.File(new Packages.java.io.File(Packages.java.lang.System.getProperty("java.home")), "lib/security/cacerts");
				var _input = new Packages.java.io.FileInputStream(_file);
				var _keystore = Packages.java.security.KeyStore.getInstance(Packages.java.security.KeyStore.getDefaultType());
				_keystore.load(_input, new Packages.java.lang.String("changeit").toCharArray());
				var _aliases = _keystore.aliases();
				/** @type { { alias: string }[] } */
				var rv = [];
				while(_aliases.hasMoreElements()) {
					var _alias = _aliases.nextElement();
					rv.push({
						alias: String(_alias)
					});
				}
				return rv;
			}
		})
	}
//@ts-ignore
)(Packages,$api,$context,$export);
