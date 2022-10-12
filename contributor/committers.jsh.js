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
		var repository = jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent });
		var log = repository.log();
		var byCommitter = $api.fp.Array.groupBy({
			/**
			 *
			 * @param { slime.jrunscript.tools.git.Commit } v
			 */
			group: function(v) {
				return v.committer.name + " <" + v.committer.email + ">";
			}
		});
		var byAuthor = $api.fp.Array.groupBy({
			/**
			 *
			 * @param { slime.jrunscript.tools.git.Commit } v
			 */
			group: function(v) {
				return v.author.name + " <" + v.author.email + ">";
			}
		});

		var report = function(groups) {
			groups.forEach(function(group) {
				jsh.shell.console(group.group + " " + group.array.length);
			});
		};

		jsh.shell.console("commits = " + log.length);
		jsh.shell.console("");
		jsh.shell.console("Author:");
		report(byAuthor(log));
		jsh.shell.console("");
		jsh.shell.console("Committer:");
		report(byCommitter(log));
	}
//@ts-ignore
)($api,jsh);
