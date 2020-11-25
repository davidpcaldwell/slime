(
	function(jsh: jsh, $export: (value: slime.fifty.test.kit["jsh"]) => void) {
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
			}
		})
	}
//@ts-ignore
)(jsh, $export)