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
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "markup" })
			)
		);
		//	TODO	there should be jsh.loader.script
		var base = jsh.shell.jsh.src;
		var loader = new jsh.file.Loader({ directory: base });
		/** @type { slime.runtime.document.source.Script } */
		var script = loader.script("loader/document/source.js");
		var subject = script();
		jsh.shell.console("markup = " + invocation.options.markup);
		var markup = invocation.options.markup.file.read(String);
		jsh.shell.console("start = " + markup.substring(0,500));
		var success = subject.debug.fidelity({
			markup: markup,
			events: {
				console: function(e) {
					jsh.shell.console(e.detail);
				}
			}
		});
		jsh.shell.console("Success: " + success);
	}
//@ts-ignore
)($api,jsh);
