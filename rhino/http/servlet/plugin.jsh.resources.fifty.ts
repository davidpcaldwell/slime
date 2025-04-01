//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	export interface Resources {
		add: (m: { directory?: slime.jrunscript.file.Directory, loader?: slime.old.Loader, prefix: string }) => void

		/** @deprecated */
		map: {
			(prefix: string, pathname: slime.jrunscript.file.Pathname): void
			/** @deprecated Use the string, Pathname version */
			(prefix: string, pathname: slime.jrunscript.file.Directory): void
		}

		/**
		 * Allows the execution of mapping information stored in a separate file; Executes the given {@link resources.Mapping} with
		 * a {@link resources.Scope} created by combining information
		 * from the mapping with the given scope argument, if any.
		 */
		file: (
			file: resources.Mapping,
			scope?: { [x: string]: any }
		) => void

		loader: slime.old.Loader<slime.old.loader.Source, slime.Resource> | slime.old.Loader<any, slime.Resource> & { resource: any }

		build: (to: slime.jrunscript.file.Directory) => void
	}

	export namespace resources {
		export type Mapping = slime.jrunscript.file.File | LoaderMapping | CodeMapping

		export interface LoaderMapping {
			loader: slime.Loader
			path: string
		}

		export interface CodeMapping {
			/** File name to use when executing. */
			name: string
			/** Code to execute. */
			string: string
		}

		export interface Scope {
			$mapping: slime.jrunscript.file.File
			/** @deprecated */
			map: Resources["map"]
			add?: Resources["add"]
		}

		export interface Exports {
			Constructor: new () => Resources

			NoVcsDirectory: any

			script: {
				(...file: slime.jrunscript.file.File[]): any
				old: any
			}
		}
	}


	export namespace internal {
		export namespace resources {
			export interface Context {
				getMimeType: (file: slime.jrunscript.file.File) => slime.mime.Type
				jsh: {
					loader: slime.jsh.Global["loader"]
					io: slime.jrunscript.io.Exports
					file: slime.jrunscript.file.Exports
					shell: slime.jsh.Global["shell"]
				}
			}

			export type Script = slime.loader.Script<Context,slime.jsh.httpd.resources.Exports>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var code: internal.resources.Script = fifty.$loader.script("plugin.jsh.resources.js");

			var subject = code({
				getMimeType: fifty.global.jsh.httpd.nugget.getMimeType,
				jsh: fifty.global.jsh
			});

			const asObject = function(p: any) { return p as object; };

			fifty.tests.script = {
				resources: function() {
					var verify = fifty.verify;
					var jsh = fifty.global.jsh;
					verify(subject.Constructor,"code").is.type("function");
					var one: { loader: slime.old.Loader, add: any } = new subject.Constructor();
					var top = fifty.jsh.file.object.getRelativePath(".").directory;
					one.add({ prefix: "WEB-INF/generic/", directory: top.getSubdirectory("java") });
					one.add({ prefix: "WEB-INF/mozilla/", directory: top.getSubdirectory("rhino") });
					one.add({ prefix: "WEB-INF/test/", directory: top.getSubdirectory("test") });
					verify(one,"one").is.type("object");
		//			verify(one).loader().list({ path: "WEB-INF/generic/" }).length().is(1);
		//			verify(one).loader().list({ path: "WEB-INF/generic/" })[0]().path().is("inonit");
		//			verify(one).loader().list({ path: "WEB-INF/generic/" })[0]().loader().isNotEqualTo(null);
					var child = one.loader.Child("WEB-INF/generic/");
					verify(child).is.not(null);
					if (!jsh.shell.environment.SKIP_LOADER_LIST) {
						verify(child).list().is.not(null);
						var generic = one.loader.Child("WEB-INF/generic/");
						verify(generic,"generic").list().is.not(null);
						verify(generic,"generic").list().length.is(1);
						var servlet = one.loader.Child("WEB-INF/generic/inonit/script/servlet/");
						verify(servlet,"servlet").is.not(null);
						var list = servlet.list();
						verify(servlet,"servlet").list().is.not(null);
					}
					verify(servlet,"servlet").list().length.is(2);
					var servletList = servlet.list().sort(function(a,b) {
						if (a.path > b.path) return 1;
						if (b.path > a.path) return -1;
						return 0;
					});
					verify(servletList)[0].path.is("Nashorn.java");
					verify(servletList)[1].path.is("Servlet.java");
					var webinf = one.loader.Child("WEB-INF/");
					debugger;
					verify(webinf,"webinf").list().length.is(3);
					var list = webinf.list();
					if (list.length > 0) verify(webinf,"webinf").list()[0].path.is("generic");
					if (list.length > 1) verify(webinf,"webinf").list()[1].path.is("mozilla");
					if (list.length > 2) verify(webinf,"webinf").list()[2].path.is("test");
					var test = webinf.list().filter(function(entry) {
						return entry.path == "test";
					});
					verify(test,"test").is.not(null);
					verify(test,"test").length.is(1);
					var first = test[0] as slime.old.loader.LoaderEntry;
					verify(first).loader.is.not(null);
					var file = first.loader.file("resource/1.file.js");
					verify(file,"file").evaluate(asObject).is.not(null);
		//			verify(one).loader().file("WEB-INF/test/1.file.js").isNotEqualTo(null);
		//			verify(one).loader().resource("WEB-INF/test/1.txt").read(String).is("1");
				},
				noLocalOrVcs: function() {
					var verify = fifty.verify;
					var jsh = fifty.global.jsh;

					var mapping: { loader: slime.old.Loader, build: any } = subject.script(fifty.jsh.file.object.getRelativePath("test/resource/1.vcs.js").file);
					verify(mapping).is.not(null);
					verify(mapping).loader.is.not(null);
					verify(mapping).loader.evaluate.property("list").is.type("function");

					var slime = mapping.loader.Child("WEB-INF/slime/");
					var byPath = function(path) {
						return function(o) {
							return o.path == path;
						};
					};
					verify(slime).list().evaluate(function(p) { return p.filter(byPath(".hg")) }).length.is(0);
					verify(slime).list().evaluate(function(p) { return p.filter(byPath(".git")) }).length.is(0);
					verify(slime).list().evaluate(function(p) { return p.filter(byPath("loader")) }).length.is(1);
					verify(slime).list().evaluate(function(p) { return p.filter(byPath("jrunscript")) }).length.is(1);
					jsh.shell.echo(slime.list().map(function(item) { return item.path; }).join(","));

					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					mapping.build(tmpdir);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/.hg").is(null);
					verify(tmpdir).getFile("WEB-INF/slime/.git").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/.git").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/local").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/jrunscript").is.not(null);
				}
			}

			fifty.tests.suite = function() {
				var type1: string = typeof(subject);
				fifty.verify({ type: type1 }).type.is("object");
				var type2: string = typeof(subject.Constructor);
				fifty.verify({ type: type2 }).type.is("function");
				fifty.run(fifty.tests.script.resources);
				fifty.run(fifty.tests.script.noLocalOrVcs);
			}
		}
	//@ts-ignore
	)(fifty);
}
