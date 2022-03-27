//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(jsh: slime.jsh.Global, $export: (value: slime.fifty.test.kit["jsh"]) => void) {
		$export({
			file: {
				location: function() {
					var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var rv = directory.pathname;
					directory.remove();
					return rv;
				},
				directory: function() {
					return jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
				}
			},
			$slime: jsh.unit.$slime
		})
	}
//@ts-ignore
)(jsh, $export)
