//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.tools.documentation.internal.asTextHandler.Context } $context
	 * @param { (value: slime.tools.documentation.internal.asTextHandler.Export) => void } $export
	 */
	function($context,$export) {
		$export(
			function(p) {
				/** @type { slime.loader.Source } */
				var asTextLoaderSource = {
					get: function(path) {
						var rv = p.loader.source.get(path);
						rv.type = "text/plain";
						return rv;
					}
				};
				var asTextLoader = new $context.httpd.io.Loader(asTextLoaderSource);

				/**
				 *
				 * @param { slime.servlet.Request } request
				 */
				function isAsTextRequest(request) {
					if (request.query) {
						var form = request.query.form(Object);
						var as = form.controls.filter(function(control) {
							return control.name == "as";
						})[0];
						if (as && as.value == "text") {
							return true;
						}
					}
					return false;
				}

				var standardHandler = $context.httpd.Handler.Loader(p);
				var asTextHandler = $context.httpd.Handler.Loader({ loader: asTextLoader, index: p.index });

				return function(request) {
					var handleWith = (isAsTextRequest(request)) ? asTextHandler : standardHandler;
					return handleWith(request);
				}
			}
		)
	}
//@ts-ignore
)($context,$export);
