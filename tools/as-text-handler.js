//@ts-check
(
	/**
	 *
	 * @param { { httpd: slime.servlet.httpd } } $context
	 * @param { (value: slime.servlet.httpd["Handler"]["Loader"]) => void } $export
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
