//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a Git credential helper that can look up GitHub and GitLab tokens in the file system for a project. by (GitHub / GitLab)
 * user name. Tokens for users must be stored in the project's `local/git/credentials` directory, in a folder with the name of the
 * host containing a folder with the name of the user (so if your GitHub username is `foo`, your token would be pasted into
 * `local/git/credentials/github.com/foo`). (Note that you must be careful with your editor not to append a trailing newline.)
 *
 * The credential helper can be specified as `-c
 * credential.helper=[/path/to/slime]/rhino/tools/git/git-credential-tokens-directory.bash`.
 */
namespace slime.jrunscript.tools.git.credentials {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}
	}

	export interface Project {
		base: slime.jrunscript.file.Location
	}

	export interface Exports {
		helper: (p: {
			operation: string
			project: Project
			input: slime.jrunscript.runtime.io.InputStream
			output: slime.$api.fp.impure.Output<string>
			console: slime.$api.fp.impure.Output<string>
			debug?: slime.$api.fp.impure.Output<string>
		}) => void

		update: slime.$api.fp.world.Means<
			{
				project: Project
				host: string
				username: string
				token: string
			},
			{
				wrote: {
					username: string
					destination: slime.jrunscript.file.Location
				}
			}
		>
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("git-credential-tokens-directory.js");
			return script({
				library: {
					file: fifty.global.jsh.file
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.sandbox = fifty.test.Parent();

			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.sandbox.suite = function() {
				var base = fifty.jsh.file.temporary.directory();
				var wrote: { username: string, destination: slime.jrunscript.file.Location };
				$api.fp.world.now.action(
					subject.update,
					{
						project: {
							base: base
						},
						host: "example.com",
						username: "foo",
						token: "bar"
					},
					{
						wrote: function(e) {
							wrote = e.detail;
						}
					}
				);
				verify(wrote).is.not(void(0));
				verify(wrote).username.is("foo");

				var parseOutput = $api.fp.pipe(
					$api.fp.string.split("\n"),
					$api.fp.Array.map(function(line) {
						if (line.indexOf("=") != -1) {
							return [line.substring(0,line.indexOf("=")), line.substring(line.indexOf("=")+1)];
						} else if (!line) {
							return null;
						} else {
							throw new Error(line);
						}
					}),
					$api.fp.Array.filter(function(p) { return Boolean(p); }),
					function(entries) { return Object.fromEntries(entries); }
				)

				fifty.run(function success() {
					var output = "";
					subject.helper({
						operation: "get",
						project: { base: base },
						input: jsh.io.InputStream.from.string(
							$api.Array.build(function(lines) {
								lines.push("host=example.com");
								lines.push("username=foo");
							}).join("\n")
						),
						output: function(line) {
							output += line + "\n";
						},
						console: jsh.shell.console,
						debug: function(line) {
							jsh.shell.console("DEBUG: " + line);
						}
					});

					jsh.shell.console("output:");
					jsh.shell.console(output);
					var result = parseOutput(output);
					verify(result).evaluate.property("password").is("bar");
				});

				fifty.run(function notFound() {
					var output = "";
					subject.helper({
						operation: "get",
						project: { base: base },
						input: jsh.io.InputStream.from.string(
							$api.Array.build(function(lines) {
								lines.push("host=sub.example.com");
								lines.push("username=foo");
							}).join("\n")
						),
						output: function(line) {
							output += line + "\n";
						},
						console: jsh.shell.console,
						debug: function(line) {
							jsh.shell.console("DEBUG: " + line);
						}
					});
					var result = parseOutput(output);
					verify(result).evaluate.property("password").is(void(0));
				});
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
