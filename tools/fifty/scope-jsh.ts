//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(jsh: slime.jsh.Global, $export: (value: (scope: { directory: slime.jrunscript.file.Directory }) => slime.fifty.test.kit["jsh"]) => void) {
		var tmp = {
			location: function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var rv = directory.pathname;
				directory.remove();
				return rv;
			},
			directory: function() {
				return jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
			}
		};

		$export(
			function(scope) {
				return {
					file: {
						object: {
							temporary: {
								location: tmp.location,
								directory: tmp.directory
							},
							getRelativePath: function(path) {
								return scope.directory.getRelativePath(path);
							}
						}
					},
					$slime: jsh.unit.$slime
				}
			}
		);
	}
//@ts-ignore
)(jsh, $export)
