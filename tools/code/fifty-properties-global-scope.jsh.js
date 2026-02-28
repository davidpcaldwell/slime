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
		// TODO This would be a good script to improve to refine APIs; should be easier to do all of this.

		// TODO copied from metrics.jsh.js
		var existsFile = $api.fp.world.Sensor.old.mapping({
			sensor: jsh.file.Location.file.exists.world()
		});

		// TODO copied from metrics.jsh.js
		/** @type { (root: slime.jrunscript.file.Location) => slime.tools.code.metrics.Settings } */
		var getSettings = function(root) {
			var toFile = jsh.tools.code.File.from.location(root);

			var location = $api.fp.now.invoke(root, jsh.file.Location.directory.relativePath("metrics.js"));

			var set = existsFile(location);

			/** @type { slime.tools.code.metrics.Settings } */
			var defaults = {
				excludes: {
					descend: function(directory) {
						var basename = jsh.file.Location.basename(directory);
						if (basename == ".git") return false;
						if (basename == "local") return false;
						return true;
					},
					isSource: function(file) {
						return jsh.tools.code.File.isText.basic(toFile(file));
					}
				},
				isGenerated: function(file) {
					return false;
				}
			};

			if (set) {
				//	TODO	switch to new loader when new loader stuff is more mature and easier to use
				var loader = new jsh.file.Loader({ directory: jsh.file.Pathname(root.pathname).directory });
				/** @type { slime.tools.code.metrics.Script } */
				var script = loader.script("metrics.js");
				var settings = script();
				if (!settings.excludes) settings.excludes = defaults.excludes;
				if (!settings.excludes.descend) settings.excludes.descend = defaults.excludes.descend;
				if (!settings.excludes.isSource) settings.excludes.isSource = defaults.excludes.isSource;
				if (!settings.isGenerated) settings.isGenerated = defaults.isGenerated;
				return settings;
			} else {
				return defaults;
			}
		}

		// TODO copied from metrics.jsh.js
		var project = $api.fp.impure.Input.value(
			jsh.shell.PWD.pathname.os.adapt(),
			function(location) {
				var gitRepositoryLocation = $api.fp.now.invoke(location, jsh.file.Location.directory.relativePath(".git"));
				var existsDirectory = $api.fp.world.Sensor.old.mapping({
					sensor: jsh.file.Location.directory.exists.wo
				});
				return {
					root: location,
					git: existsFile(gitRepositoryLocation) || existsDirectory(gitRepositoryLocation)
				}
			},
			function(p) {
				var settings = getSettings(p.root);

				return (
					(p.git)
						//	TODO	this causes a crash when moving files, as files are still listed by git even if they do not
						//			exist anymore
						? jsh.tools.code.Project.from.git({
							root: p.root,
							submodules: false,
							excludes: settings.excludes
						})
						: jsh.tools.code.Project.from.directory({
							root: p.root,
							excludes: settings.excludes
						})
				);
			}
		);

		var projectRelativePath = jsh.file.Location.directory.relativeTo(project().base);

		// jsh.shell.console(project().base.pathname);
		// jsh.shell.console(project().files.map($api.fp.property("pathname")).map(String).join("\n"));

		/** @typedef { { relativePath: string, line: number } } match */

		/** @type { match[] } */
		var whitelist = [
			"jrunscript/host/threads.fifty.ts:915",
			"jrunscript/jsh/script/getopts.fifty.ts:218",
			"jrunscript/jsh/shell/jsh.fifty.ts:194",
			"jrunscript/tools/install/module.fifty.ts:610",
			"js/time/old.fifty.ts:318",
			"rhino/ip/module.fifty.ts:65",
			"rhino/shell/apple.fifty.ts:199",
			"rhino/jrunscript/api.fifty.ts:716",
			"rhino/http/servlet/server/loader.fifty.ts:263",
			"loader/api/old/unit.fifty.ts:737",
			"rhino/http/client/module.fifty.ts:476",
			"rhino/tools/git/module.fifty.ts:442",
			"rhino/tools/plugin.jsh.fifty.ts:50",
			"tools/fifty/test.fifty.ts:33",
			"loader/$api-Function.fifty.ts:331",
			"loader/$api.fifty.ts:183",
			"loader/$api-flag.fifty.ts:73",
			"loader/jrunscript/test/data/2/module.fifty.ts:28",
			"loader/expression.fifty.ts:835",
			"rhino/shell/run-old.fifty.ts:815",
			"tools/wf/plugin.jsh.fifty.ts:551"
		].map(function(string) {
			var parts = string.split(":");
			return { relativePath: parts[0], line: parseInt(parts[1]) };
		});

		var whitelisted = function(/** @type { match } */at) {
			return whitelist.some(function(listed) {
				return listed.relativePath == at.relativePath && listed.line == at.line;
			});
		};

		var stream = $api.fp.now(
			project().files,
			$api.fp.Stream.from.array,
			$api.fp.Stream.filter(
				$api.fp.pipe($api.fp.property("pathname"), $api.fp.RegExp.test(/\.fifty\.ts$/))
			),
			$api.fp.Stream.map(function(location) {
				return {
					location: location,
					content: jsh.file.Location.file.read.string.simple(location).split("\n").map(function(line, index) {
						return { number: index + 1, content: line };
					})
				}
			}),
			$api.fp.Stream.map(function(file) {
				for (var i=0; i<file.content.length; i++) {
					var line = file.content[i];
					if (/\@ts\-ignore/.test(line.content)) {
						var next = file.content[i+1];
						var at = { relativePath: projectRelativePath(file.location), line: next.number };
						if (whitelisted(at)) {
							//jsh.shell.console("Whitelisted: " + at.relativePath + ":" + at.line + "\n" + next.content + "\n");
							return $api.fp.Maybe.from.nothing();
						}
						var parameters = /\)\((.*)\)\;/;
						var matches = parameters.test(next.content);
						if (!matches) {
							return $api.fp.Maybe.from.some("Bad: " + projectRelativePath(file.location) + ":" + next.number + "\n" + next.content + "\n");
						} else {
							var match = parameters.exec(next.content);
							var delimited = match[1];
							var disallowed = delimited.split(",").map($api.fp.string.trim).filter(function(s) {
								return s != "fifty" && s != "$fifty" && s != "Packages" && s != "JavaAdapter" && s != "$platform";
							});
							if (disallowed.length > 0) {
								return $api.fp.Maybe.from.some("Check: " + projectRelativePath(file.location) + ":" + file.content[i+1].number + "\n" + match[1] + "\n");
							}
						}
					}
				}
				return $api.fp.Maybe.from.nothing();
			}),
			$api.fp.Stream.filter($api.fp.Maybe.present)
		);

		var count = 0;
		$api.fp.now(
			stream,
			$api.fp.impure.Stream.forEach(function(result) {
				if (result) {
					count++;
					jsh.shell.console(result.value);
				}
			})
		);
		jsh.shell.console("Total: " + count);
	}
//@ts-ignore
)($api,jsh);
