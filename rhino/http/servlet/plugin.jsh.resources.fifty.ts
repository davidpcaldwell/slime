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

		loader: any

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
	}


	export namespace internal {
		export namespace resources {
			export interface Context {
				getMimeType: (file: slime.jrunscript.file.File) => slime.mime.Type
				jsh: slime.jsh.Global
			}

			export type Exports = {
				new (): Resources
				Old: any
				NoVcsDirectory: any
				script: {
					(file: slime.jrunscript.file.File): any
					old: any
				}
			}

			export type Script = slime.loader.Script<Context,Exports>
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

			fifty.tests.script = {
				old: function() {
					var one: { loader: slime.old.Loader } = subject.script.old(
						fifty.jsh.file.object.getRelativePath("test/resource/1.old.js").file
					);
					var indexOf = function(value: string) {
						return function(p: (slime.old.loader.LoaderEntry | slime.old.loader.ResourceEntry)[]) {
							return p.map(function(entry) { return entry.path; }).indexOf(value);
						}
					};
					var read = function(p: Resource) {
						return p.read(String);
					}

					var verify = fifty.verify;
					verify(one,"one").is.type("object");
					verify(one).loader.Child("WEB-INF/generic/").list().length.is(1);
					verify(one).loader.Child("WEB-INF/generic/").list()[0].path.is("inonit");
					verify(one).loader.Child("WEB-INF/generic/inonit/script/servlet/").list().length.is(2);
					verify(one).loader.Child("WEB-INF/generic/inonit/script/servlet/").list().evaluate(indexOf("Servlet.java")).is.not.equalTo(-1);
					verify(one).loader.Child("WEB-INF/generic/inonit/script/servlet/").list().evaluate(indexOf("Nashorn.java")).is.not.equalTo(-1);
					verify(one).loader.Child("WEB-INF/generic/inonit/script/servlet/").list().evaluate(indexOf("JarJarBinks.java")).is(-1);
					verify(one).loader.Child("WEB-INF/").list().length.is(3);
					verify(one).loader.Child("WEB-INF/").list()[0].path.is("generic");
					verify(one).loader.Child("WEB-INF/").list()[1].path.is("mozilla");
					verify(one).loader.Child("WEB-INF/").list()[2].path.is("test");
					verify(one).loader.file("WEB-INF/test/1.file.js").is.not(null);
					verify(one).loader.get("WEB-INF/test/1.txt").evaluate(read).is("1\n");
				},
				resources: function() {
					var verify = fifty.verify;
					var jsh = fifty.global.jsh;
					verify(subject,"code").is.type("function");
					var one: { loader: slime.old.Loader, add: any } = new subject();
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
					verify(file,"file").is.not(null);
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
					verify(slime).list().evaluate(function(p) { return p.filter(byPath("jsh")) }).length.is(1);
					jsh.shell.echo(slime.list().map(function(item) { return item.path; }).join(","));

					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					mapping.build(tmpdir);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/.hg").is(null);
					verify(tmpdir).getFile("WEB-INF/slime/.git").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/.git").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/local").is(null);
					verify(tmpdir).getSubdirectory("WEB-INF/slime/jsh").is.not(null);
				}
			}

			fifty.tests.suite = function() {
				var type: string = typeof(subject);
				fifty.verify({ type: type }).type.is("function");
				fifty.run(fifty.tests.script.old);
				fifty.run(fifty.tests.script.resources);
				fifty.run(fifty.tests.script.noLocalOrVcs);
			}
		}
	//@ts-ignore
	)(fifty);
}
