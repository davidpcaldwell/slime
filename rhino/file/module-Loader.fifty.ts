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
			const { $api, jsh } = fifty.global;

			const fixtures = (function() {
				var script: internal.test.fixtures.Script = fifty.$loader.script("fixtures.ts");
				return script({
					fifty: fifty
				});
			})();

			const { module } = fixtures;

			const loader = new fixtures.module.Loader({ directory: fifty.jsh.file.object.getRelativePath(".").directory })

			fifty.tests.suite = function() {
				run(function brittleEntries() {
					//	Check whether file existence works
					verify(loader).get("module.js").is.not(null);
					verify(loader).get("foo.html").is(null);
					var list = loader.list();

					var map: {
						java: slime.old.loader.LoaderEntry
						"java.js": slime.old.loader.ResourceEntry
					} = (
						function() {
							var rv = {
								java: void(0),
								"java.js": void(0)
							};
							list.forEach(function(item) {
								rv[item.path] = item;
							});
							return rv;
						}
					)();

					var isLoaderEntry = function(p: any): p is slime.old.loader.LoaderEntry {
						return Boolean(p.loader);
					};

					var isResourceEntry = function(p): p is slime.old.loader.ResourceEntry {
						return Boolean(p.resource);
					};

					var directoryListing = $api.fp.world.Sensor.now({
						sensor: jsh.file.Location.directory.list.stream().wo,
						subject: fifty.jsh.file.relative(".")
					});

					//	TODO	this is pretty brittle
					verify(list,"number of entries in rhino/file").length.is($api.fp.Stream.collect(directoryListing).length);

					verify(map).java.evaluate(isLoaderEntry).is(true);
					if (isLoaderEntry(map.java)) {
						verify(map.java).evaluate.property("loader").is.not(void(0));
						verify(map.java).evaluate.property("resource").is(void(0));
					}

					verify(map["java.js"]).evaluate(isResourceEntry).is(true);
					if (isResourceEntry(map["java.js"])) {
						verify(map["java.js"]).evaluate.property("resource").is.not(void(0));
						verify(map["java.js"]).evaluate.property("loader").is(void(0));
					}
				});

				run(function oldResourceLength() {
					var api = loader.get("module.fifty.ts") as slime.jrunscript.runtime.old.Resource;
					verify(api).length.is.not.equalTo(null);
					verify(api).length.is.type("number");
				});

				run(function oldResourceMimeType() {
					var api = loader.get("module.js");
					var asMimeObject = function(p: any) { return p as slime.mime.Object; }
					verify(api).type.evaluate(asMimeObject).evaluate(function(p) { return p.is("application/javascript") }).is(true);
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
