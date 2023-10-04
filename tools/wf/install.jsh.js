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
				jsh.script.cli.fp.option.location({ longname: "project" }),
				function(p) {
					var project = $api.fp.impure.Input.from.partial({
						if: p.options.project,
						else: inputs.PWD
					});

					var wfpath = $api.fp.impure.Input.map(
						$api.fp.impure.Input.compose({
							slime: inputs.slime,
							project: project
						}),
						function(inputs) {
							return jsh.file.Location.directory.relativeTo(inputs.project)(inputs.slime);
						}
					);

					/** @param { string } p */
					var mapStringToWriteArgument = function(p) { return { value: p }; }

					var fileWriteStringOutput = $api.fp.pipe(
						jsh.file.Location.file.write,
						$api.fp.property("string"),
						$api.fp.world.Action.pipe(mapStringToWriteArgument),
						$api.fp.world.Action.output()
					);

					var getWfPathDestination = $api.fp.impure.Input.map(
						project,
						jsh.file.Location.directory.relativePath("wf.path")
					);

					var output = $api.fp.pipe(
						fileWriteStringOutput,
						$api.fp.impure.Input.supply(wfpath),
						$api.fp.impure.now.process
					);

					$api.fp.impure.now.process(
						$api.fp.impure.Input.supply(getWfPathDestination)(output)
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
