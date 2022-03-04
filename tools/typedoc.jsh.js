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
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		$api.Function.pipe(
			//	TODO	this default is also stored in tools/wf/plugin.jsh.js
			jsh.script.cli.option.string({ longname: "ts:version" }),
			jsh.script.cli.option.pathname({ longname: "tsconfig", default: jsh.shell.PWD.getRelativePath("jsconfig.json") }),
			jsh.wf.cli.$f.option.pathname({ longname: "output" }),
			function(p) {
				if (!p.options["ts:version"]) throw new Error("Required: --ts:version <version>");
				jsh.shell.tools.rhino.require();
				jsh.shell.tools.tomcat.require();
				jsh.shell.tools.node.require();
				if (false) jsh.shell.console("Require TypeScript: " + p.options["ts:version"]);
				jsh.shell.tools.node["modules"].require({ name: "typescript", version: p.options["ts:version"] });
				var typedocVersion = (function(tsVersion) {
					if (tsVersion == "4.0.5") return "0.19.2";
					if (tsVersion == "4.5.4") return "0.22.11";
					if (tsVersion == "4.6.2") return "0.22.12";
					throw new Error("Unspecified TypeDoc version for TypeScript " + tsVersion);
				})(p.options["ts:version"])
				if (false) jsh.shell.console("Require TypeDoc: " + typedocVersion);
				jsh.shell.tools.node["modules"].require({ name: "typedoc", version: typedocVersion });
				if (false) jsh.shell.console("Dependencies satisfied.");
				var shell = jsh.script.file.parent.parent;
				var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames.concat([shell.getRelativePath("local/jsh/lib/node/bin")]));
				var environment = $api.Object.compose(jsh.shell.environment, {
					PATH: PATH.toString()
				});
				var project = p.options.tsconfig.parent.directory;
				var readme = (function(project) {
					var readme = project.getFile("typedoc-index.md");
					if (readme) return readme.toString();
					return "none";
				})(project);
				var result = jsh.shell.run({
					command: shell.getRelativePath("local/jsh/lib/node/bin/typedoc"),
					arguments: $api.Array.build(function(rv) {
						//	TODO	is this relative to tsconfig or to PWD?
						rv.push("--out", p.options.output);
						rv.push("--tsconfig", p.options.tsconfig);
						if (typedocVersion == "0.19.2") {
							rv.push("--mode", "file");
							rv.push("--includeDeclarations");
						}
						rv.push("--excludeExternals");
						rv.push("--readme", readme);
						//	TODO	add --name
						if (typedocVersion == "0.22.11" || typedocVersion == "0.22.12") {
							if (!project.getFile("typedoc.json")) {
								var entryPoint = project.getRelativePath("README.fifty.ts");
								if (!entryPoint.file) {
									jsh.shell.console("Required: typedoc.json, or README.fifty.ts to use as TypeDoc entry point.");
									jsh.shell.exit(1);
								}
								rv.push("--entryPoints", entryPoint);
							}
						}
					}),
					environment: environment,
					directory: project,
					evaluate: function(result) {
						jsh.shell.exit(result.status);
					}
				});
			}
		)({ options: {}, arguments: jsh.script.arguments })
	}
//@ts-ignore
)($api,jsh);
