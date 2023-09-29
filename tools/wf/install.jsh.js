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
		var inputs = {
			PWD: $api.fp.impure.Input.value(jsh.shell.PWD.pathname.os.adapt()),
			slime: $api.fp.impure.Input.value(
				jsh.script.file.pathname.os.adapt(),
				jsh.file.Location.parent(),
				jsh.file.Location.parent(),
				jsh.file.Location.parent()
			)
		};

		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.fp.option.location({ longname: "project", default: inputs.PWD }),
				function(p) {
					var project = (function() {
						var rv = p.options.project();
						if (!rv.present) throw new Error("Unreachable.");
						return rv.value;
					})();

					var wfpath = $api.fp.impure.Input.map(
						inputs.slime,
						jsh.file.Location.directory.relativeTo(project)
					);

					$api.fp.now.invoke(
						project,
						jsh.file.Location.directory.relativePath("wf.path"),
						jsh.file.Location.file.write,
						$api.fp.property("string"),
						function(action) {
							$api.fp.world.now.action(
								action,
								{ value: wfpath() }
							)
						}
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
