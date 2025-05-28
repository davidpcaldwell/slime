//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a Git credential helper that can look up passwords (or, in the case of modern services like GitHub and GitLab, tokens)
 * in the file system for a project by host and user name. Passwords for users must be stored in the project's
 * `local/git/credentials` directory, in a folder with the name of the host containing a folder with the name of the user (so if
 * your GitHub username is `foo`, your token would be pasted into `local/git/credentials/github.com/foo`). (Note that you must be
 * careful with your editor not to append a trailing newline.)
 *
 * The credential helper can be specified as `-c
 * credential.helper=[/path/to/slime]/rhino/tools/git/git-credential-tokens-directory.bash`.
 */
namespace slime.jrunscript.tools.git.credentials {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Project {
		base: slime.jrunscript.file.Location
	}

	export interface Exports {
		get: slime.$api.fp.world.Sensor<
			{
				project: Project
				host: string
				username: string
			},
			void,
			slime.$api.fp.Maybe<string>
		>

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

		user: {
			location: slime.$api.fp.Mapping<slime.$api.fp.world.Subject<Exports["user"]["get"]>,slime.jrunscript.file.Location>

			/**
			 * Given a user's home directory and associated information about the credentials needed, returns a potential git
			 * password.
			 */
			get: slime.$api.fp.world.Sensor<
				{
					/**
					 * A directory to search for credentials information.
					 */
					home?: slime.jrunscript.file.Location

					/**
					 * The host name for which credentials are needed; for example, `github.com`.
					 */
					host: string

					/**
					 * The username that pertains to retrieving the credentials.
					 */
					username: string
				},
				void,
				slime.$api.fp.Maybe<string>
			>
		}

		/**
		 * Implements the `git` [credential helper](https://git-scm.com/docs/gitcredentials) interface when the "operation" is
		 * passed to it as the `operation` property of its input.
		 *
		 * The only operation that is implemented is `get`, which looks up credentials in the project directory at a specified
		 * location.
		 *
		 * @param p
		 * @returns
		 */
		helper: (p: {
			operation: string
			project: Project
			input: slime.jrunscript.runtime.io.InputStream
			output: slime.$api.fp.impure.Output<string>
			console: slime.$api.fp.impure.Output<string>
			debug?: slime.$api.fp.impure.Output<string>
		}) => void
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("git-credential-tokens-directory.js");
			return script({
				library: {
					file: fifty.global.jsh.file,
					shell: fifty.global.jsh.shell
				}
			});
		//@ts-ignore
		})(fifty);

		export const helper = (function(fifty: slime.fifty.test.Kit) {
			return function(PWD: string) {
				var shell = Object.assign({}, fifty.global.jsh.shell);
				shell.PWD = fifty.global.jsh.file.Pathname(PWD).directory;
				var script: Script = fifty.$loader.script("git-credential-tokens-directory.js");
				return script({
					library: {
						file: fifty.global.jsh.file,
						shell: shell
					}
				});
			}
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		test: {
			getTokenLocation: (p: { store: slime.jrunscript.file.Location, host: string, username: string }) => slime.jrunscript.file.Location
			getProjectTokenLocation: (p: { project: slime.jrunscript.tools.git.credentials.Project, host: string, username: string }) => slime.jrunscript.file.Location
			getUserTokenLocation: (p: Parameters<slime.jrunscript.tools.git.credentials.Exports["user"]["get"]>[0]) => slime.jrunscript.file.Location
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.manual = function() {
				var tmp = fifty.jsh.file.temporary.location();

				var location = subject.test.getTokenLocation({ store: tmp, host: "git.example.com", username: "user" });
				jsh.shell.console("location: " + location.pathname);

				jsh.shell.console(subject.test.getProjectTokenLocation({ project: { base: fifty.jsh.file.relative("../../..") }, host: "git.example.com", username: "user" }).pathname );
				jsh.shell.console(subject.test.getUserTokenLocation({ host: "git.example.com", username: "user" }).pathname );
			}
		}
	//@ts-ignore
	)(fifty);

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

				var forHelper = test.helper(base.pathname);

				fifty.run(function success() {
					var output = "";
					forHelper.helper({
						operation: "get",
						project: { base: base },
						input: jsh.io.InputStream.string.default(
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
					forHelper.helper({
						operation: "get",
						project: { base: base },
						input: jsh.io.InputStream.string.default(
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
