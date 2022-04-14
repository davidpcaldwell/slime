//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
		var repository = jsh.tools.git.init({ pathname: directory.pathname });
		jsh.wf.requireGitIdentity({
			repository: repository,
			get: jsh.wf.requireGitIdentity.get.gui
		});
		var config = repository.config({
			arguments: ["--list"]
		});
		jsh.shell.console(JSON.stringify({
			name: config["user.name"],
			email: config["user.email"]
		}));
	}
//@ts-ignore
)(jsh)
