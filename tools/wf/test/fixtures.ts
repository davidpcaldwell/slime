//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.test {
	export interface Fixtures {
		clone: (p: {
			src: slime.jrunscript.file.world.Pathname
			commit?: {
				message: string
			}
		}) => slime.jrunscript.tools.git.repository.Local
		configure: (repository: slime.jrunscript.tools.git.repository.Local) => void
	}

	export type Script = slime.loader.Script<void, Fixtures>

	(
		function(
			$api: slime.$api.Global,
			jsh: slime.jsh.Global,
			$export: slime.loader.Export<Fixtures>
		) {
			$export({
				clone: function(p) {
					var clone: slime.jrunscript.tools.git.Command<{ repository: string, to: string }, void> = {
						invocation: function(p) {
							return {
								command: "clone",
								arguments: $api.Array.build(function(rv) {
									rv.push(p.repository);
									if (p.to) rv.push(p.to);
								})
							}
						}
					};
					var src = p.src;
					var destination = (() => {
						var object = tmp.directory();
						return jsh.file.world.filesystems.os.pathname(object.toString());
					})();
					jsh.tools.git.program({ command: "git" }).command(clone).argument({
						repository: src.pathname,
						to: destination.pathname
					}).run();
					//	copy code so that we get local modifications in our "clone"
					jsh.file.object.directory(src).copy(jsh.file.object.pathname(destination), {
						filter: function(p) {
							//	TODO	need to review copy implementation; how do directories work?
							if (p.entry.path == ".git") return false;
							if (p.entry.path == "local") return false;

							//	If we are a directory but the clone contains a file, remove the directory and overwrite
							if (p.exists && !p.exists.directory && p.entry.node.directory) {
								p.exists.remove();
								return true;
							}

							return true;
						}
					});
					var rv = jsh.tools.git.Repository({ directory: jsh.file.Pathname(destination.pathname).directory });
					if (p.commit && rv.status().paths) {
						rv.commit({
							all: true,
							message: p.commit.message
						});
					}
					return rv;
					//	good utility functions for git module?
					// function unset(repository,setting) {
					// 	jsh.shell.console("Unset: " + repository.directory);
					// 	jsh.shell.run({
					// 		command: "git",
					// 		arguments: ["config", "--local", "--unset", setting],
					// 		directory: repository.directory
					// 	});
					// }
					// var gitdir = (function() {
					// 	if (src.getSubdirectory(".git")) {
					// 		return src.getSubdirectory(".git");
					// 	}
					// 	if (src.getFile(".git")) {
					// 		var parsed = /^gitdir\: (.*)/.exec(src.getFile(".git").read(String));
					// 		var relative = (parsed) ? parsed[1] : null;
					// 		return (relative) ? src.getRelativePath(relative).directory : void(0);
					// 	}
					// })();
				},
				configure: function(repository) {
					repository.config({ set: { name: "user.name", value: "foo" }});
					repository.config({ set: { name: "user.email", value: "bar@example.com" }});
				}
			})
		}
	//@ts-ignore
	)($api,jsh,$export);
}
