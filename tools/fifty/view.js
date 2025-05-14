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
	 * @param { slime.fifty.view.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.fifty.view.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		/** @type { (p: { httpd: slime.servlet.httpd, base: slime.jrunscript.file.Directory, watch: boolean }) => slime.servlet.Script } */
		var createServletScript = function(p) {
			var code = {
				/** @type { slime.tools.documentation.internal.asTextHandler.Script } */
				asTextHandler: $loader.script("as-text-handler.js"),
				/** @type { slime.tools.documentation.Script } */
				documentationHandler: $loader.script("documentation-handler.js"),
				/** @type { slime.tools.documentation.wiki.Script } */
				wiki: $loader.script("wiki-handler.js")
			};
			var asTextHandler = code.asTextHandler({
				httpd: p.httpd
			});
			/** @type { slime.tools.documentation.Export } */
			var documentationHandler = code.documentationHandler();
			var documentationFactory = documentationHandler({
				base: p.base,
				watch: p.watch
			});
			var wikiHandler = code.wiki({
				httpd: p.httpd,
				library: {
					file: $context.library.file
				},
				base: p.base.getSubdirectory("local/wiki")
			});
			return {
				handle: p.httpd.Handler.series(
					documentationFactory.handler(p.httpd),
					wikiHandler,
					asTextHandler({
						loader: new $context.library.file.Loader({ directory: p.base })
					})
				),
				destroy: function() {
					documentationFactory.stop();
				}
			}
		}

		/** @type { slime.fifty.view.Exports } */
		function createServer(p) {
			var server = $context.library.httpd.tomcat.Server.from.configuration({
				servlet: {
					load: function(scope) {
						var servlet = createServletScript({
							httpd: scope.httpd,
							base: p.base,
							watch: p.watch
						});
						scope.$exports.handle = servlet.handle;
						scope.$exports.destroy = servlet.destroy;
					}
				}
			});
			server.start();
			return server;
		}

		$export(createServer);
	}
//@ts-ignore
)($api,$context,$loader,$export);
