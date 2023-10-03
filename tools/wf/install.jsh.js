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

					var getRelativeToProject = $api.fp.impure.Input.map(
						project,
						jsh.file.Location.directory.relativeTo
					);

					var wfpath = $api.fp.impure.Input.map(
						inputs.slime,
						getRelativeToProject()
					);

					var Output = {
						/** @type { <P,R>(m: slime.$api.fp.Mapping<P,R>) => (o: slime.$api.fp.impure.Output<R>) => slime.$api.fp.impure.Output<P> } */
						map: function(m) {
							return function(f) {
								return function(p) {
									return f(m(p));
								}
							}
						}
					}

					var writeStringContentToFile = $api.fp.pipe(
						jsh.file.Location.file.write,
						$api.fp.property("string"),
						$api.fp.world.Action.output(),
						Output.map(
							/** @param { string } p */
							function(p) { return { value: p }; }
						)
					);

					$api.fp.now.invoke(
						project(),
						jsh.file.Location.directory.relativePath("wf.path"),
						writeStringContentToFile,
						function(f) { f(wfpath()) }
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
