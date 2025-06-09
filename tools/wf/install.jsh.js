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
						if: $api.fp.impure.Input.value(p.options.project),
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
						jsh.file.Location.file.write.old,
						$api.fp.property("string"),
						$api.fp.world.Action.pipe(mapStringToWriteArgument),
						$api.fp.world.Action.output()
					);

					var getWfPathDestination = $api.fp.impure.Input.map(
						project,
						jsh.file.Location.directory.relativePath("wf.path")
					);

					/**
					 * Writes the wf SLIME path to the given location.
					 */
					var outputWfPathTo = $api.fp.pipe(
						fileWriteStringOutput,
						$api.fp.impure.Input.supply(wfpath),
						$api.fp.impure.now.process
					);

					var writeWfPath = $api.fp.impure.Input.supply(getWfPathDestination)(outputWfPathTo);

					$api.fp.impure.now.process(
						writeWfPath
					);

					/**
					 * @typedef { object } TemplatedFile
					 * @property { string } template
					 * @property { slime.jrunscript.file.Location } destination
					 * @property { slime.$api.fp.Maybe<string> } existing
					 */

					/** @type { (path: string) => slime.$api.fp.impure.Input<TemplatedFile> } */
					var getTemplatedFileState = function(path) {
						var destination = $api.fp.impure.Input.map(
							project,
							jsh.file.Location.directory.relativePath(path)
						);

						/** @param { string } string */
						var removeMpl = function(string) {
							var lines = string.split("\n");
							var shebang = (lines[0].substring(0,2) == "#!");
							return (shebang)
								? lines.slice(0,1) + "\n" + lines.slice(7).join("\n") + "\n"
								: lines.slice(6).join("\n") + "\n"
							;
						};

						return $api.fp.impure.Input.compose({
							template: $api.fp.impure.Input.map(
								inputs.slime,
								jsh.file.Location.directory.relativePath("tools/wf/templates"),
								jsh.file.Location.directory.relativePath(path),
								$api.fp.Partial.impure.old.exception({
									try: $api.fp.world.mapping(jsh.file.Location.file.read.string.world()),
									nothing: function(location) { throw new Error("File not found at " + location.pathname); }
								}),
								removeMpl
							),
							destination: destination,
							existing: $api.fp.impure.Input.map(
								destination,
								$api.fp.world.mapping(jsh.file.Location.file.read.string.world())
							)
						})
					};

					/**
					 * @typedef { object } TemplatedFileHandler
					 * @property { slime.$api.fp.impure.Output<TemplatedFile> } same
					 * @property { slime.$api.fp.impure.Output<TemplatedFile> } different
					 * @property { slime.$api.fp.impure.Output<TemplatedFile> } missing
					 */

					/** @type { (p: TemplatedFileHandler) => slime.$api.fp.impure.Output<TemplatedFile> } */
					var getTemplatedFileHandler = function(p) {
						return function(inputs) {
							if (inputs.existing.present) {
								if (inputs.existing.value == inputs.template) {
									p.same(inputs);
								} else {
									p.different(inputs);
								}
							} else {
								p.missing(inputs);
							}
						}
					};

					/** @param { TemplatedFile } inputs */
					var writeTemplatedFile = function(inputs) {
						jsh.shell.console("Writing templated file to " + inputs.destination.pathname);
						fileWriteStringOutput(inputs.destination)(inputs.template);
					};

					/**
					 *
					 * @param { slime.$api.fp.Transform<slime.jrunscript.file.posix.Attributes> } update
					 */
					var updateTemplatedFileAttributes = function(update) {
						/**
						 * @param { TemplatedFile } file
						 */
						return function(file) {
							$api.fp.world.now.tell(
								jsh.file.Location.posix.attributes.update({
									location: file.destination,
									attributes: update
								})
							);
						}
					};

					$api.fp.impure.now.process(
						$api.fp.impure.Input.supply(
							getTemplatedFileState("wf")
						)(
							$api.fp.impure.Output.compose([
								getTemplatedFileHandler({
									same: function(t) {
										//	do nothing
									},
									different: writeTemplatedFile,
									missing: writeTemplatedFile
								}),
								updateTemplatedFileAttributes(
									jsh.file.Location.posix.attributes.Update.permissions.set.executable.all(true)
								)
							])
						)
					);

					$api.fp.impure.now.process(
						$api.fp.impure.Input.supply(
							getTemplatedFileState("wf.js")
						)(
							getTemplatedFileHandler({
								same: function(t) {
									//	do nothing
								},
								different: function(t) {
									jsh.shell.console("Not overwriting " + t.destination.pathname + "; files are different.");
								},
								missing: writeTemplatedFile
							})
						)
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
