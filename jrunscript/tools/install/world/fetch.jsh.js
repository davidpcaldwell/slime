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
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "url" }),
				jsh.script.cli.option.string({ longname: "format" }),
				function(p) {
					jsh.shell.console("url = " + p.options.url + " format = " + p.options.format);

					var destination = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
					destination.directory.remove();

					$api.fp.world.now.action(
						jsh.tools.install.Download.install,
						{
							download: {
								url: p.options.url,
								format: (p.options.format) ? jsh.tools.install.Download.Format[p.options.format] : void(0)
							},
							to: destination
						},
						{
							request: function(e) {
								jsh.shell.console("Requesting: " + jsh.web.Url.codec.string.encode(e.detail.url));
							},
							archive: function(e) {
								jsh.shell.console("Wrote archive to " + e.detail.pathname.toString());
							}
						}
					);

					jsh.shell.console("Downloaded to " + destination);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh,main);
