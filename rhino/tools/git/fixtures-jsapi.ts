//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git.test.fixtures.jsapi {
	export type Context = void

	export interface Exports {
		remote: slime.jrunscript.tools.git.Repository
	}

	(
		function(jsh: slime.jsh.Global, $export: slime.loader.Export<Exports>) {
			var module = jsh.tools.git;

			var remotes = jsh.shell.TMPDIR.createTemporary({ directory: true });

			var daemon = module.oo.daemon({
				port: jsh.ip.getEphemeralPort().number,
				basePath: remotes.pathname,
				exportAll: true
			});

			//	TODO	use improved file, Git APIs for the below
			var dir = remotes.getRelativePath("RemoteRepository").createDirectory();

			jsh.shell.run({
				command: "git",
				arguments: ["init"],
				directory: remotes.getSubdirectory("RemoteRepository")
			});

			dir.getRelativePath("a").write("a", { append: false });
			var host = module.oo.Repository({ directory: dir });
			host.add({ path: "a" });
			module.program({ command: "git" }).repository(dir.pathname.toString()).command(
				{
					invocation: function(p) {
						return {
							command: "commit",
							arguments: [
								"--all",
								"--message", "RemoteRepository a"
							]
						}
					}
				}
			).argument({}).run({
				stdout: function(line) {
					jsh.shell.console("STDOUT: " + line);
				},
				stderr: function(line) {
					jsh.shell.console("STDERR: " + line);
				}
			});

			var remote = module.oo.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/RemoteRepository" });

			$export({
				remote: remote
			})
		}
	//@ts-ignore
	)(jsh, $export)

	export type Script = slime.loader.Script<Context,Exports>
}
