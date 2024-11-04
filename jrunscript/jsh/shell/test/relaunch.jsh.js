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
	 */
	function($api,jsh) {
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "tmpdir" }),
				function(p) {
					var TMPDIR = jsh.file.os.temporary.directory();
					jsh.shell.jsh.relaunch(function(invocation) {
						return $api.Object.compose(
							invocation,
							{
								script: $api.fp.now(
									jsh.script.file.parent.pathname.toString(),
									jsh.file.Location.from.os,
									jsh.file.Location.directory.relativePath("../../test/jsh-data.jsh.js"),
									$api.fp.property("pathname")
								),
								arguments: ["1", "2", "3"],
								environment: function(was) {
									return $api.Object.compose(was, {
										"FOO": "bar"
									})
								},
								properties: {
									"foo.bar": "baz"
								},
								directory: p.options.tmpdir
							}
						)
					});
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
