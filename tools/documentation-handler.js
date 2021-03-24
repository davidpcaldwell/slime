//@ts-check
(
	/**
	 * Implementation of the Typedoc documentation server. Currently relies on the `jsh` and `httpd` APIs, but probably could
	 * narrow dependencies on those.
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { (value: slime.tools.documentation.implementation) => void } $export
	 */
	function($api,jsh,$export) {
		$export(
			function(configuration) {
				var base = configuration.base;
				/** @type { slime.tools.documentation.factory } */

				var rv = function(httpd) {
					return httpd.Handler.series(
						//	Allows links to src/path/to/file.ext within Typedoc
						function(request) {
							var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/src\/(.*)/;
							var match = typedocPattern.exec(request.path);
							if (match) {
								var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
								return new httpd.Handler.Loader({
									loader: new jsh.file.Loader({ directory: src }),
									index: "index.html"
								})($api.Object.compose(request, { path: match[2] }))
							}
						},
						function(request) {
							var typedocPattern = /^(?:(.+)\/)?local\/doc\/typedoc\/((.*)\.html$)/;
							var match = typedocPattern.exec(request.path);
							if (match) {
								var src = (match[1]) ? base.getSubdirectory(match[1]) : base;
								var output = src.getRelativePath("local/doc/typedoc");
								if (!output.directory || configuration.watch) {
									jsh.wf.typescript.typedoc({
										project: src
									});
								}
								jsh.shell.console("Serving: " + request.path);
								return new httpd.Handler.Loader({
									loader: new jsh.file.Loader({ directory: src.getSubdirectory("local/doc/typedoc") }),
									index: "index.html"
								})($api.Object.compose(request, { path: match[2] }))
							}
						}
					)
				};
				return rv;
			}
		)
	}
//@ts-ignore
)($api,jsh,$export);
