//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export namespace test {
		export const shells = (function(fifty: slime.fifty.test.Kit) {
			var script: slime.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script();
			return fixtures.shells(fifty);
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var jshDataScript = fifty.jsh.file.relative("../test/jsh-data.jsh.js").pathname;
				var packaged = test.shells.packaged(jshDataScript);
				var classpathOsLocation = packaged.package;
				var classpathUri = String(jsh.file.Pathname(classpathOsLocation).java.adapt().getCanonicalFile().toURI().toString());
				var intention = packaged.invoke({
					stdio: {
						output: "string"
					}
				});
				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: intention
				});
				var data: { shellClasspath: string } = JSON.parse(result.stdio.output);

				verify(data).shellClasspath.is(classpathUri);

				fifty.run(fifty.tests.unbuilt);

				fifty.load("launcher.fifty.ts");

				fifty.load("test/suite.fifty.ts");
			}

			fifty.tests.unbuilt = fifty.test.Parent();

			fifty.tests.unbuilt.loaderCache = function() {
				var cache = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/loader").directory;
				if (cache.pathname.java.adapt().exists()) cache.remove();

				var script = fifty.jsh.file.relative("../test/jsh-data.jsh.js").pathname;

				var run = function() {
					var intention = test.shells.unbuilt().invoke({
						script: script,
						stdio: {
							output: "string"
						}
					});
					var result = $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					});
					verify(result).status.is(0);
					var data: { shellClasspath: string } = JSON.parse(result.stdio.output);
					return data.shellClasspath;
				}

				var first = run();
				var second = run();
				var expectedPrefix = String(cache.pathname.java.adapt().getCanonicalFile().toURI().toString());
				if (!/\/$/.test(expectedPrefix)) expectedPrefix += "/";

				verify(first).is(second);
				verify(first.substring(0, expectedPrefix.length)).is(expectedPrefix);
				verify(first.substring(expectedPrefix.length)).evaluate(function(path) {
					return /^[0-9a-f]{64}\.\d+\/$/.test(path);
				}).is(true);

				var firstPathname = first.substring("file:".length).replace(/\/$/,"");
				jsh.file.Pathname(firstPathname).directory.getRelativePath(".jsh-loader-cache.json").write(
					"{",
					{ append: false }
				);

				var third = run();
				verify(third).is.not(first);
				verify(third.substring(0, expectedPrefix.length)).is(expectedPrefix);
				verify(third.substring(expectedPrefix.length)).evaluate(function(path) {
					return /^[0-9a-f]{64}\.\d+\/$/.test(path);
				}).is(true);
			}

			fifty.tests.unbuilt.moduleClassCache = function() {
				var cache = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/module-classes");
				if (cache.java.adapt().exists()) cache.directory.remove();

				var temporary = jsh.shell.TMPDIR.createTemporary({ directory: true });
				try {
					var source = temporary.getRelativePath("source").createDirectory();
					var sourcePathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "source").getCanonicalPath());
					var dependencySource = temporary.getRelativePath("dependency/cachetest/Dependency.java");
					var dependencyClasses = temporary.getRelativePath("dependency-classes").createDirectory();
					var dependencyClassesPathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "dependency-classes").getCanonicalPath());
					var script = temporary.getRelativePath("load.jsh.js");
					var scriptPathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "load.jsh.js").getCanonicalPath());

					var writeJava = function(value: number) {
						source.getRelativePath("java/cachetest/Value.java").write(
							[
								"package cachetest;",
								"public class Value {",
								"  public static int value() { return " + value + "; }",
								"}"
							].join("\n"),
							{ append: false, recursive: true }
						);
					}

					var writeDependency = function(value: number) {
						dependencySource.write(
							[
								"package cachetest;",
								"public class Dependency {",
								"  public static final int VALUE = " + value + ";",
								"}"
							].join("\n"),
							{ append: false, recursive: true }
						);
						jsh.java.tools.javac({
							destination: dependencyClasses.pathname,
							arguments: [dependencySource]
						});
					}

					script.write(
						[
						"var source = new Packages.java.io.File(" + JSON.stringify(sourcePathname) + ");",
						"var loader = { source: Packages.inonit.script.engine.Code.Loader.create(source) };",
							"jsh.loader.java.add({ src: { loader: loader } });",
							"jsh.loader.java.add(jsh.file.Pathname(" + JSON.stringify(dependencyClassesPathname) + "));",
							"jsh.shell.echo(String(Packages.cachetest.Value.value()));"
						].join("\n"),
						{ append: false }
					);

					var run = function() {
						var intention = test.shells.unbuilt().invoke({
							script: scriptPathname,
							stdio: {
								output: "string"
							}
						});
						var result = $api.fp.world.Sensor.now({
							sensor: jsh.shell.subprocess.question,
							subject: intention
						});
						verify(result).status.is(0);
						return result.stdio.output.replace(/\s+$/,"");
					}

					var valueClassCaches = function() {
						var root = cache.java.adapt();
						if (!root.exists()) return [];
						var files = root.listFiles();
						return Array.prototype.slice.call(files).filter(function(file) {
							var classFile: any = new Packages.java.io.File(file, "classes/cachetest/Value.class");
							return classFile.isFile();
						}).map(function(file) {
							return String(file.getCanonicalPath());
						}).sort();
					}

					writeDependency(1);
					writeJava(1);
					verify(run()).is("1");
					var first = valueClassCaches();
					if (first.length != 1) throw new Error("Expected one cache for Value.class, found " + first.length + ": " + first.join(","));

					verify(run()).is("1");
					var again = valueClassCaches();
					if (again.join("\n") != first.join("\n")) throw new Error("Expected second run to reuse " + first.join(",") + ", found " + again.join(","));

					var classes = new Packages.java.io.File(first[0], "classes");
					var valueClass = new Packages.java.io.File(classes, "cachetest/Value.class");
					var corrupt = new Packages.java.io.FileOutputStream(valueClass);
					try {
						corrupt.write(0);
					} finally {
						corrupt.close();
					}
					var journal = new Packages.java.io.FileOutputStream(new Packages.java.io.File(first[0], ".classes.publish"));
					try {
						var journalPath = "cachetest/Value.class";
						[0, 0, 0, 1, 0, journalPath.length].forEach(function(byte) {
							journal.write(byte);
						});
						for (var i=0; i<journalPath.length; i++) journal.write(journalPath.charCodeAt(i));
					} finally {
						journal.close();
					}
					verify(run()).is("1");
					var recovered = valueClassCaches();
					if (recovered.join("\n") != first.join("\n")) throw new Error("Expected interrupted publication recovery to reuse " + first.join(",") + ", found " + recovered.join(","));

					writeDependency(2);
					verify(run()).is("1");
					var second = valueClassCaches();
					if (second.length != 2) throw new Error("Expected dependency edit to create second cache, found " + second.length + ": " + second.join(","));

					writeJava(2);
					verify(run()).is("2");
					var third = valueClassCaches();
					if (third.length != 3) throw new Error("Expected source edit to create third cache, found " + third.length + ": " + third.join(","));
				} finally {
					temporary.remove();
				}
			}

			fifty.tests.manual = function() {
				const { jsh } = fifty.global;

				jsh.shell.console("jsh = " + jsh.internal.bootstrap["jsh"]);
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}
