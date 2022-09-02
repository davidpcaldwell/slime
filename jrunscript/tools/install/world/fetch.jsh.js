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
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		main(
			$api.Function.pipe(
				jsh.script.cli.option.string({ longname: "url" }),
				jsh.script.cli.option.string({ longname: "format" }),
				function(p) {
					jsh.shell.console("url = " + p.options.url + " format = " + p.options.format);

					var fetch = $api.Function.world.question(
						jsh.http.world.Client.withFollowRedirects(jsh.http.world.request),
						{
							request: function(e) {
								jsh.shell.console("Requesting: " + jsh.web.Url.codec.string.encode(e.detail.url));
							}
						}
					);

					var response = fetch(
						jsh.http.world.Argument.request({
							url: p.options.url
						})
					);

					jsh.shell.console("HTTP " + response.status.code);

					//	TODO	no world-oriented equivalent
					var archive = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("archive." + p.options.format);
					var write = jsh.file.world.Location.file.write.stream({ input: response.stream });
					$api.Function.world.now.action(write, archive.os.adapt());
					jsh.shell.console("Wrote archive to " + archive.os.adapt().pathname);

					/** @type { slime.jrunscript.tools.install.Format } */
					var format = jsh.tools.install.format[p.options.format];
					var expanded = jsh.shell.TMPDIR.createTemporary({ directory: true });
					//	TODO	no world-oriented equivalent
					format.extract(archive.file, expanded);
					jsh.shell.console("Expanded archive to " + expanded);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh,main);
