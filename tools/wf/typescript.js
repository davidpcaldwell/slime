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
	 * @param { slime.jsh.wf.internal.typescript.Context } $context
	 * @param { slime.loader.Export<slime.jsh.wf.internal.typescript.Exports> } $export
	 */
	function($api,$context,$export) {
		var VERSION = "5.6.3";

		var version = $api.fp.impure.Input.value(VERSION);

		var base = (
			function() {
				var filesystem = $api.fp.now.map(
					$context,
					$api.fp.Object.property.maybe("world", "filesystem"),
					$api.fp.Maybe.else($api.fp.impure.Input.value($context.library.file.world.filesystems.os))
				);

				/** @type { slime.$api.fp.Identity<slime.jsh.wf.Project> } */
				var asProject = $api.fp.identity;

				/** @type { slime.$api.fp.Identity<slime.jrunscript.file.Location> } */
				var asLocation = $api.fp.identity;

				return $api.fp.pipe(
					asProject,
					$api.fp.property("base"),
					function(pathname) {
						return {
							filesystem: filesystem,
							pathname: pathname
						}
					},
					asLocation
				);
			}
		)();

		/** @type { (path: string) => slime.$api.fp.Partial<slime.jsh.wf.Project, slime.jrunscript.file.world.Location> } */
		var getProjectConfigurationFile = function(path) {
			var exists = $api.fp.world.mapping($context.library.file.world.Location.file.exists.world());

			return function(project) {
				var at = $api.fp.now.invoke(
					base(project),
					$context.library.file.world.Location.relative(path)
				);
				var created = $api.fp.now.invoke(
					at,
					exists
				);
				return (created) ? $api.fp.Maybe.from.some(at) : $api.fp.Maybe.from.nothing();
			};
		};

		/** @type { slime.jsh.wf.internal.typescript.Exports["Project"]["version"] } */
		var Project_getTypescriptVersion = $api.fp.pipe(
			base,
			$api.fp.pipe(
				$context.library.file.Location.directory.relativePath("tsc.version"),
				$context.library.file.Location.file.read.string.maybe
			),
			$api.fp.Maybe.else(version)
		);

		var Project_getConfigurationFile = $api.fp.switch([
			getProjectConfigurationFile("tsconfig.json"),
			getProjectConfigurationFile("jsconfig.json")
		]);

		/** @type { slime.jsh.wf.internal.module.Exports["typescript"]["typedoc"] } */
		var typedoc = (
			function() {
				/**
				 *
				 * @param { string } pathname
				 * @param { string } relative
				 * @returns
				 */
				function getRelativePath(pathname, relative) {
					return $api.fp.result(
						pathname,
						$api.fp.pipe(
							$context.library.file.world.Location.from.os,
							$context.library.file.world.Location.relative(relative),
							$api.fp.property("pathname")
						)
					)
				}

				//	TODO	should be generalized and provided as library function; could use `eval()` version also.
				/**
				 * Parses a JSONC (JSON with comments) file.
				 */
				var parseJsonc = $api.fp.pipe(
					/**
					 *
					 * @param { string } s
					 * @returns string
					 */
					function removeComments(s) {
						return s.split("\n").filter(function(line) {
							if (!Boolean(line)) return false;
							if (/^\s*\/\/(.*)/.test(line)) return false;
							return true;
						}).join("\n")
					},
					JSON.parse
				)

				/**
				 * @type { (project: slime.jrunscript.file.Location) => { [x: string]: any } }
				 *
				 * Given a project location, returns the configuration object for TypeDoc as parsed from the project's `typedoc.json`.
				 */
				var getTypedocConfiguration = $api.fp.pipe(
					$context.library.file.Location.directory.relativePath("typedoc.json"),
					$api.fp.world.mapping($context.library.file.Location.file.read.string.world()),
					$api.fp.Maybe.map(parseJsonc),
					$api.fp.Maybe.else(
						/** @type { () => { [x: string]: any } } */
						function() { return {}; }
					)
				);

				var typedocVersionForTypescript = function(tsVersion) {
					if (tsVersion == "4.0.5") return "0.19.2";
					if (tsVersion == "4.5.4") return "0.22.11";
					if (tsVersion == "4.6.2") return "0.22.12";
					if (tsVersion == "4.6.3") return "0.22.15";
					if (tsVersion == "4.7.3") return "0.23.5";
					if (tsVersion == "4.8.4") return "0.23.19";
					if (tsVersion == "4.9.4") return "0.23.23";

					//	0.28.4 supports TypeScript 5, according to release notes
					if (/5\./.test(tsVersion)) return "0.28.4";

					throw new Error("Unspecified TypeDoc version for TypeScript " + tsVersion);
				};

				var parseTypedocVersion = $api.fp.pipe(
					$api.fp.string.split("."),
					$api.fp.Array.map(Number),
					function(parsed) {
						return {
							major: parsed[0],
							minor: parsed[1],
							patch: parsed[2]
						}
					}
				)

				/**
				 *
				 * @param { ReturnType<parseTypedocVersion> } version
				 * @returns
				 */
				function typedocVersionUsesEntryPoints(version) {
					if (version.major > 0) return true;
					if (version.minor > 22) return true;
					//	TODO	possible this should be used for lower versions than 0.22.11, but did not investigate
					if (version.minor == 22 && version.patch >= 11) return true;
					return false;
				}

				/** @type { slime.jsh.wf.internal.typescript.Exports["module"]["typedoc"]["invocation"] } */
				var invocation = function(p) {
					return function(events) {
						if (!p.configuration || !p.configuration.typescript || !p.configuration.typescript.version) {
							throw new TypeError("Required: p.configuration.typescript.version");
						}

						$context.library.node.require.simple();

						$api.fp.world.Action.now({
							action: $context.library.node.Installation.modules($context.library.node.installation)
								.require({ name: "typescript", version: p.configuration.typescript.version })
							,
						});

						var typedocVersion = $api.fp.now.invoke(
							p.configuration.typescript.version,
							$api.fp.pipe(
								typedocVersionForTypescript,
								parseTypedocVersion
							)
						);

						$api.fp.world.Action.now({
							action: $context.library.node.Installation.modules($context.library.node.installation).require({
								name: "typedoc",
								version: $api.fp.now.invoke(p.configuration.typescript.version, typedocVersionForTypescript)
							}),
							handlers: {
								found: function(e) {
									if (e.detail.present) {
										events.fire("found", e.detail.value.version);
									} else {
										events.fire("notFound");
									}
								},
								installing: function(e) {
									events.fire("installing", e.detail.version);
								},
								installed: function(e) {
									events.fire("installed", e.detail.version);
								}
							}
						});

						var project = $context.library.file.world.Location.from.os(p.project);

						var configuration = $api.fp.result(
							project,
							getTypedocConfiguration
						);

						/** @type { slime.jrunscript.tools.node.Intention } */
						var argument = {
							command: "typedoc",
							arguments: $api.Array.build(function(rv) {
								//	TODO	is this relative to tsconfig or to PWD?
								if (p.out) {
									rv.push("--out", p.out);
								} else if (!configuration.out) {
									rv.push("--out", getRelativePath(p.project, "local/doc/typedoc"));
								}

								rv.push("--tsconfig", p.configuration.typescript.configuration);

								if (typedocVersion.major == 0 && typedocVersion.minor < 20) {
									rv.push("--mode", "file");
									rv.push("--includeDeclarations");
								}

								//	TODO	dubious
								//rv.push("--excludeExternals");

								if (!configuration.readme) {
									var readme = (function(project) {
										var typedocIndexLocation = $api.fp.result(
											project,
											$context.library.file.world.Location.relative("typedoc-index.md")
										);
										var exists = $api.fp.world.now.question(
											$context.library.file.world.Location.file.exists.world(),
											typedocIndexLocation
										);
										return (exists) ? typedocIndexLocation.pathname : "none";
									})(project);
									rv.push("--readme", readme);
								}

								if (!configuration.entryPoints && typedocVersionUsesEntryPoints(typedocVersion)) {
									var entryPointLocation = $api.fp.result(project, $context.library.file.world.Location.relative("README.fifty.ts"));
									var exists = $api.fp.world.now.question(
										$context.library.file.world.Location.file.exists.world(),
										entryPointLocation
									);
									if (!exists) {
										throw new Error("Required: typedoc.json, or README.fifty.ts to use as TypeDoc entry point.");
									}
									rv.push("--entryPoints", entryPointLocation.pathname);
								}
							}),
							directory: project.pathname
						};

						var invocation = $context.library.node.Installation.Intention.question(argument);

						return invocation;
					}
				}

				return {
					invocation: invocation
				}
			}
		)();

		$export({
			module: {
				version: version,
				typedoc: typedoc
			},
			Project: {
				version: Project_getTypescriptVersion,
				configurationFile: Project_getConfigurationFile
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
