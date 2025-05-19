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

				version: function() {
					if (/^1\.8/.test($context.java.version)) {
						return {
							number: "1.7.15",
							id: "mozilla/1.7.15"
						};
					} else {
						return {
							number: "1.8.0",
							id: "mozilla/1.8.0"
						};
					}
				},
				versions: {
					jdk8: "1.7.15",
					default: "1.8.0"
				},
				sources: {
					"mozilla/1.7.13": {
						url: "https://github.com/mozilla/rhino/releases/download/Rhino1_7_13_Release/rhino-1.7.13.jar",
						format: "jar"
					},
					"mozilla/1.7.14": {
						url: "https://github.com/mozilla/rhino/releases/download/Rhino1_7_14_Release/rhino-1.7.14.jar",
						format: "jar"
					},
					"mozilla/1.7.15": {
						url: "https://github.com/mozilla/rhino/releases/download/Rhino1_7_15_Release/rhino-1.7.15.jar",
						format: "jar"
					},
					"mozilla/1.8.0": {
						url: "https://repo1.maven.org/maven2/org/mozilla/rhino-all/1.8.0/rhino-all-1.8.0.jar",
						format: "jar"
					}
				}
			},
			nashorn: {
				standalone: {
					//	Not stored here; parsed from jsh launcher
					version: $api.fp.now(
						$loader.get("../../jsh"),
						$api.fp.Maybe.from.value,
						$api.fp.Maybe.map(
							$api.fp.pipe(
								function(file) { return file.read(String); },
								$api.fp.string.split("\n"),
								$api.fp.Stream.from.array,
								$api.fp.Stream.flatMap(
									$api.fp.pipe(
										$api.fp.RegExp.exec(/^\s*NASHORN_VERSION=(\S+)/),
										/** @returns { slime.$api.fp.Stream<string> } */
										function(match) {
											if (match.present) return $api.fp.Stream.from.array([match.value[1]]);
											return $api.fp.Stream.from.array([]);
										}
									)
								),
								$api.fp.Stream.first,
								function(it) {
									if (!it.present) throw new Error();
									return it.value;
								}
							)
						),
						$api.fp.Maybe.else($api.fp.thunk.value(null))
					)
				}
			},
			typedoc: {
				version: "0.28.4"
			}
		};

		var getTypedocIncludes = $api.fp.thunk.value(
			//	TODO	figure out better way to manage retrieval of non-code content; using older loader constructs for now
			$loader.get("dependencies.md").read(String),
			function(s) { return s.replace(/\{rhino\.version\.number}/, data.rhino.versions.default ) },
			function(s) { return s.replace(/\{rhino\.version\.jdk8\.number}/, data.rhino.versions.jdk8 ) },
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
