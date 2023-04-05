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
			}): slime.old.Loader<slime.jrunscript.runtime.internal.CustomSource,slime.jrunscript.runtime.old.Resource>
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
				run(function brittleEntries() {
					verify(loader).get("module.fifty.ts").is.not(null);
					verify(loader).get("foo.html").is(null);
					var list = loader.list();
					var map: {
						java: slime.old.loader.LoaderEntry & slime.old.loader.ResourceEntry
						"java.js": slime.old.loader.LoaderEntry & slime.old.loader.ResourceEntry
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
					verify(list,"number of entries in rhino/file").length.is(28);
					//	jsh.shell.echo(loader.list().map(function(item) { return item.path; }));
					verify(map).java.evaluate(isLoaderEntry).is(true);
					verify(map).java.evaluate(function() { return this.resource; }).is(void(0));
					verify(map).java.evaluate($api.fp.property("resource")).is(void(0));
					verify(map["java.js"]).evaluate(isResourceEntry).is(true);
					verify(map["java.js"]).evaluate($api.fp.property("loader")).is(void(0));
				});

				run(function oldResourceLength() {
					var api = loader.get("module.fifty.ts") as slime.jrunscript.runtime.old.Resource;
					verify(api).length.is.not.equalTo(null);
					verify(api).length.is.type("number");
				});

				run(function oldResourceMimeType() {
					var api = loader.get("module.js");
					verify(api).type.evaluate(function() { return this.is("application/javascript") }).is(true);
				});

				run(function oldResourceLastModified() {
					var api = loader.get("module.fifty.ts") as slime.jrunscript.runtime.old.Resource;
					verify(api).modified.is.type("object");
				});

				run(function nullDirectoryFails() {
					verify(module).evaluate(function() { return new module.Loader({ directory: null }) }).threw.type(Error);
				});
			}
		}
	//@ts-ignore
	)(fifty);

}
