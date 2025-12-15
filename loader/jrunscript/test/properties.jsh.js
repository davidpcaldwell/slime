//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		jsh.shell.echo(
			JSON.stringify({
				"foo.bar": $api.jrunscript.properties.get("foo.bar"),
				"foo.baz": $api.jrunscript.properties.get("foo.baz"),
				"foo.bizzy": $api.jrunscript.properties.get("foo.bizzy")
			})
		);
	}
//@ts-ignore
)(Packages,$api,jsh);
