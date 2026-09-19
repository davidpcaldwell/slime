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

		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.fp.option.location({ longname: "whitelist" }),
				function(program) {
					/** @typedef { { relativePath: string, line: number } } match */

					/** @type { match[] } */
					var whitelist = (function(option) {
						if (option.present) {
							return $api.fp.now(
								option.value,
								jsh.file.Location.file.read.string.simple,
								$api.fp.string.split("\n"),
								$api.fp.Array.filter(function(line) { return line.trim().length > 0; }),
								$api.fp.Array.map(function(line) {
									var parts = line.split(":");
									return { relativePath: parts[0], line: parseInt(parts[1]) };
								})
							)
						}
						return [];
					})(program.options.whitelist);

					var project = jsh.tools.code.Project.from.root({ root: jsh.shell.PWD.pathname.os.adapt(), git: { submodules: false } });

					var projectRelativePath = jsh.file.Location.directory.relativeTo(project.base);

					var whitelisted = function(/** @type { match } */at) {
						return whitelist.some(function(listed) {
							return listed.relativePath == at.relativePath && listed.line == at.line;
						});
					};

					var stream = $api.fp.now(
						project.files,
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
			)
		)
	}
//@ts-ignore
)($api,jsh);
