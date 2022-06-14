//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Exports {
		/**
		 * Creates a {@link slime.Loader | Loader} that loads resources from the filesystem.
		 */
		Loader: {
			new (p: {
				/**
				 * The directory to use as the base for loading resources.
				 */
				directory: Directory
				//	TODO	would be nice to get rid of string below, but right now it's unknown exactly how to access MimeType from
				//			jsh/browser/servlet environments
				type?: (path: slime.jrunscript.file.File) => (slime.mime.Type | string)
			}): slime.Loader<slime.jrunscript.runtime.Resource>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api } = fifty.global;

			const fixtures = (function() {
				var script: test.fixtures.Script = fifty.$loader.script("fixtures.ts");
				return script({
					fifty: fifty
				});
			})();

			const { module } = fixtures;

			const loader = new fixtures.module.Loader({ directory: fifty.jsh.file.object.getRelativePath("api.html").parent.directory })

			fifty.tests.suite = function() {
				run(function() {
					verify(loader).get("api.html").is.not(null);
					verify(loader).get("foo.html").is(null);
					var list = loader.list();
					var map: {
						java: loader.LoaderEntry & loader.ResourceEntry
						"java.js": loader.LoaderEntry & loader.ResourceEntry
					} = {
						java: void(0),
						"java.js": void(0)
					};
					list.forEach(function(item) {
						map[item.path] = item;
					});
					var isLoaderEntry = function(p) {
						return Boolean(p.loader);
					}
					var isResourceEntry = function(p) {
						return Boolean(p.resource);
					}
					//	TODO	this is pretty brittle
					verify(list,"number of entries in rhino/file").length.is(21);
					//	jsh.shell.echo(loader.list().map(function(item) { return item.path; }));
					verify(map).java.evaluate(isLoaderEntry).is(true);
					verify(map).java.evaluate(function() { return this.resource; }).is(void(0));
					verify(map).java.evaluate($api.Method.property("resource")).is(void(0));
					verify(map["java.js"]).evaluate(isResourceEntry).is(true);
					verify(map["java.js"]).evaluate($api.Method.property("loader")).is(void(0));
				});

				run(function() {
					var api = loader.get("api.html") as slime.jrunscript.runtime.Resource;
					verify(api).length.is.not.equalTo(null);
					verify(api).length.is.type("number");
				});

				run(function() {
					var api = loader.get("api.html");
					verify(api).type.evaluate(function() { return this.is("text/html") }).is(true);
				});

				run(function() {
					var api = loader.get("api.html") as slime.jrunscript.runtime.Resource;
					verify(api).modified.is.type("object");
				});

				run(function() {
					verify(module).evaluate(function() { return new module.Loader({ directory: null }) }).threw.type(Error);
				});
			}
		}
	//@ts-ignore
	)(fifty);

}
