//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "foo" }),
				jsh.script.cli.option.number({ longname: "exit" }),
				function(p) {
					jsh.shell.console("Hello, World!");
					jsh.shell.console("foo: " + p.options.foo);
					if (typeof(p.options.exit) == "number") return p.options.exit;
				}
			)
		);
	}
//@ts-ignore
)($api,jsh,main);
