//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.tools.documentation.wiki.Context } $context
	 * @param { slime.loader.Export<slime.tools.documentation.wiki.Export> } $export
	 */
	function($api,$context,$export) {
		$export(
			$context.httpd.Handler.series(
				function(request) {
					var pattern = /^(?:(.+)\/)?local\/wiki\/(.*)/;
					var match = pattern.exec(request.path);
					if (match) {
						var base = (match[1]) ? $context.base.getSubdirectory(match[1]) : $context.base;
						var loader = new $context.library.file.Loader({ directory: base });
						var path = match[2];
						//	Markdown Preview Plus apparently uses the file extension to determine whether to handle the request as
						//	Markdown
						//	Not totally sure; here's some probably-pertinent code:
						//	https://github.com/volca/markdown-preview/blob/230d3bd984c8bc4a4028a0584bf7e44ee9038fc0/manifest.json#L13-L30
						if (loader.get(path + ".md")) {
							return $context.httpd.http.Response.SEE_OTHER({
								location: path + ".md"
							});
						}
					}
				}
			)
		)
	}
//@ts-ignore
)($api,$context,$export);
