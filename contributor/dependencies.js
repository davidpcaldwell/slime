//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.project.dependencies.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.project.dependencies.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var data = {
			rhino: {
				// Current Rhino version is also referenced in:

				// build.gradle
				// jrunscript/jsh/launcher/api.html
				// jrunscript/jsh/tools/install/plugin.jsh.fifty.ts
				// jrunscript/jsh/tools/install/plugin.jsh.js

				version: "1.7.15"
			},
			nashorn: {
				standalone: {
					// Current standalone Nashorn version is also referenced in:

					// jsh

					version: "15.4"
				}
			},
			typedoc: {
				version: "0.28.4"
			}
		};

		var getTypedocIncludes = $api.fp.thunk.value(
			//	TODO	figure out better way to manage retrieval of non-code content; using older loader constructs for now
			$loader.get("dependencies.md").read(String),
			function(s) { return s.replace(/\{rhino\.version\}/, data.rhino.version ) },
			function(s) { return s.replace(/\{nashorn\.standalone\.version\}/, data.nashorn.standalone.version ) }
		);

		$export({
			data: data,
			typedoc: {
				generate: $api.fp.pipe(
					$api.fp.mapping.properties({
						to: $api.fp.identity,
						text: $api.fp.mapping.from.thunk(getTypedocIncludes)
					}),
					function(p) {
						var parent = $context.library.file.Location.parent()(p.to);
						var means = $context.library.file.Location.directory.require({ recursive: true });
						$api.fp.world.Means.now({
							means: means,
							order: parent
						});
						$api.fp.world.Action.now({
							action: $context.library.file.Location.file.write( p.to ).string({ value: p.text })
						});
					}
				)
			}
		});
	}
//@ts-ignore
)($api,$context,$loader,$export);
