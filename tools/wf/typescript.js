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
		var parseTypedocVersion = $api.Function.pipe(
			$api.Function.string.split("."),
			$api.Function.Array.map(Number),
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

		/**
		 *
		 * @param { string } pathname
		 * @param { string } relative
		 * @returns
		 */
		function getRelativePath(pathname, relative) {
			return $api.Function.result(
				pathname,
				$api.Function.pipe(
					$context.library.file.world.Location.from.os,
					$context.library.file.world.Location.relative(relative),
					$api.Function.property("pathname")
				)
			)
		}

		/** @type { (project: slime.jrunscript.file.world.Location) => { [x: string]: any } } */
		var getTypedocConfguration = $api.Function.pipe(
			$context.library.file.world.Location.relative("typedoc.json"),
			$api.Function.world.question($context.library.file.world.Location.file.read.string()),
			$api.Function.Maybe.map(function removeComments(s) {
				return s.split("\n").filter(function(line) {
					if (!Boolean(line)) return false;
					if (/^\s*\/\/(.*)/.test(line)) return false;
					return true;
				}).join("\n")
			}),
			$api.Function.Maybe.map(function(s) {
				//Packages.java.lang.System.err.println(s);
				return JSON.parse(s);
			}),
			$api.Function.Maybe.else(
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
			throw new Error("Unspecified TypeDoc version for TypeScript " + tsVersion);
		};

		/** @type { slime.jsh.wf.internal.typescript.Exports["typedoc"]["run"] } */
		var typedoc_run = function(p) {
			return function(events) {
				if (!p.configuration || !p.configuration.typescript || !p.configuration.typescript.version) throw new TypeError("Required: p.configuration.typescript.version");

				$api.Function.world.now.action($context.library.node.require);

				$api.Function.world.now.action(
					$context.library.node.world.Installation.modules.require({ name: "typescript", version: p.configuration.typescript.version }),
					$context.library.node.installation
				);

				var typedocVersion = $api.Function.result(
					p.configuration.typescript.version,
					$api.Function.pipe(
						typedocVersionForTypescript,
						parseTypedocVersion
					)
				);

				$api.Function.world.now.action(
					$context.library.node.world.Installation.modules.require({
						name: "typedoc",
						version: $api.Function.result(p.configuration.typescript.version, typedocVersionForTypescript)
					}),
					$context.library.node.installation
				);

				var project = $context.library.file.world.Location.from.os(p.project);

				var configuration = $api.Function.result(
					project,
					getTypedocConfguration
				);

				/** @type { slime.jrunscript.node.internal.Argument } */
				var argument = {
					command: "typedoc",
					arguments: $api.Array.build(function(rv) {
						//	TODO	is this relative to tsconfig or to PWD?
						if (!configuration.out) {
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
								var typedocIndexLocation = $api.Function.result(
									project,
									$context.library.file.world.Location.relative("typedoc-index.md")
								);
								var exists = $api.Function.world.now.question(
									$context.library.file.world.Location.file.exists(),
									typedocIndexLocation
								);
								return (exists) ? typedocIndexLocation.pathname : "none";
							})(project);
							rv.push("--readme", readme);
						}

						if (!configuration.entryPoints && typedocVersionUsesEntryPoints(typedocVersion)) {
							var entryPointLocation = $api.Function.result(project, $context.library.file.world.Location.relative("README.fifty.ts"));
							var exists = $api.Function.world.now.question(
								$context.library.file.world.Location.file.exists(),
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

				var exit = $api.Function.world.now.question(
					$context.library.node.world.Installation.question(argument),
					$context.library.node.installation
				);

				return exit.status == 0;
			}
		}

		$export({
			typedoc: {
				run: typedoc_run
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
