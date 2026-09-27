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
				var manifest = jsh.file.Pathname(firstPathname).directory.getRelativePath(".jsh-loader-cache.json");
				var original = manifest.file.read(String);
				try {
					manifest.write("{", { append: false });

					var third = run();
					verify(third).is.not(first);
					verify(third.substring(0, expectedPrefix.length)).is(expectedPrefix);
					verify(third.substring(expectedPrefix.length)).evaluate(function(path) {
						return /^[0-9a-f]{64}\.\d+\/$/.test(path);
					}).is(true);
				} finally {
					manifest.write(original, { append: false });
				}
			}

			fifty.tests.unbuilt.moduleClassCache = function() {
				var temporary = jsh.shell.TMPDIR.createTemporary({ directory: true });
				try {
					var shellClasses = temporary.getRelativePath("shell-classes").createDirectory();
					var cache = shellClasses.getRelativePath("modules");
					var source = temporary.getRelativePath("source").createDirectory();
					var sourcePathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "source").getCanonicalPath());
					var dependencySource = temporary.getRelativePath("dependency/cachetest/Dependency.java");
					var dependencyClasses = temporary.getRelativePath("dependency-classes").createDirectory();
					var dependencyClassesPathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "dependency-classes").getCanonicalPath());
					var jarFile = new Packages.java.io.File(temporary.pathname.java.adapt(), "dependency.jar");
					var jarPathname = String(jarFile.getCanonicalPath());
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

					var writeJar = function(value: number) {
						var zip = new Packages.java.util.zip.ZipOutputStream(new Packages.java.io.FileOutputStream(jarFile));
						try {
							zip.putNextEntry(new Packages.java.util.zip.ZipEntry("root#resource.txt"));
							zip.write(new Packages.java.lang.String(String(value)).getBytes("UTF-8"));
							zip.closeEntry();
						} finally {
							zip.close();
						}
					}

					script.write(
						[
						"var source = new Packages.java.io.File(" + JSON.stringify(sourcePathname) + ");",
						"var loader = { source: Packages.inonit.script.engine.Code.Loader.create(source) };",
							"jsh.loader.java.add({ src: { loader: loader } });",
							"jsh.loader.java.add(jsh.file.Pathname(" + JSON.stringify(dependencyClassesPathname) + "));",
							"jsh.loader.java.add(jsh.file.Pathname(" + JSON.stringify(jarPathname) + "));",
							"jsh.shell.echo(String(Packages.cachetest.Value.value()));"
						].join("\n"),
						{ append: false }
					);

					var run = function() {
						var intention = test.shells.unbuilt().invoke({
							script: scriptPathname,
							environment: function(environment) {
								return $api.Object.compose(
									environment,
									{ JSH_SHELL_CLASSES: shellClasses.pathname.toString() }
								);
							},
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
					writeJar(1);
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

					writeJar(2);
					verify(run()).is("1");
					var jarChanged = valueClassCaches();
					if (jarChanged.length != 2) throw new Error("Expected root-level JAR edit to create second cache, found " + jarChanged.length + ": " + jarChanged.join(","));

					writeDependency(2);
					verify(run()).is("1");
					var second = valueClassCaches();
					if (second.length != 3) throw new Error("Expected dependency edit to create third cache, found " + second.length + ": " + second.join(","));

					writeJava(2);
					verify(run()).is("2");
					var third = valueClassCaches();
					if (third.length != 4) throw new Error("Expected source edit to create fourth cache, found " + third.length + ": " + third.join(","));
				} finally {
					temporary.remove();
				}
			}

			fifty.tests.unbuilt.automaticModuleClassCache = function() {
				var temporary = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var addedCaches: string[] = [];
				try {
					var source = temporary.getRelativePath("source").createDirectory();
					var sourcePathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "source").getCanonicalPath());
					var script = temporary.getRelativePath("load.jsh.js");
					var scriptPathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "load.jsh.js").getCanonicalPath());
					var cache = new Packages.java.io.File(
						jsh.shell.jsh.src.pathname.java.adapt(),
						"local/jsh/lib/module-classes"
					);
					var value = new Date().getTime();

					source.getRelativePath("java/cacheflag/Value.java").write(
						"package cacheflag; public class Value { public static long value() { return " + value + "L; } }",
						{ append: false, recursive: true }
					);
					script.write(
						[
							"var source = new Packages.java.io.File(" + JSON.stringify(sourcePathname) + ");",
							"var loader = { source: Packages.inonit.script.engine.Code.Loader.create(source) };",
							"jsh.loader.java.add({ src: { loader: loader } });",
							"jsh.shell.echo(String(Packages.cacheflag.Value.value()));"
						].join("\n"),
						{ append: false }
					);

					var caches = function(): string[] {
						var files = cache.listFiles();
						if (files == null) return [];
						return Array.prototype.slice.call(files).filter(function(file) {
							var classFile: any = new Packages.java.io.File(file, "classes/cacheflag/Value.class");
							return classFile.isFile();
						}).map(function(file) {
							return String(file.getCanonicalPath());
						}).sort();
					}

					var run = function(enabled: boolean) {
						var intention = test.shells.unbuilt().invoke({
							script: scriptPathname,
							environment: enabled ? function(environment) {
								return $api.Object.compose(
									environment,
									{ JSH_SHELL_MODULE_CLASS_CACHE: "true" }
								);
							} : void(0),
							stdio: { output: "string" }
						});
						var result = $api.fp.world.Sensor.now({
							sensor: jsh.shell.subprocess.question,
							subject: intention
						});
						verify(result).status.is(0);
						verify(result.stdio.output.replace(/\s+$/,"")).is(String(value));
					}

					var before = caches();
					run(false);
					var afterDefault = caches();
					addedCaches = afterDefault.filter(function(path) {
						return before.indexOf(path) == -1;
					});
					verify(afterDefault.join("\n")).is(before.join("\n"));

					run(true);
					var after = caches();
					addedCaches = after.filter(function(path) {
						return before.indexOf(path) == -1;
					});
					verify(addedCaches.length).is(1);
				} finally {
					addedCaches.forEach(function(path) {
						jsh.file.Pathname(path).directory.remove();
					});
					temporary.remove();
				}
			}

			fifty.tests.unbuilt.moduleClassCacheTransaction = function() {
				var temporary = jsh.shell.TMPDIR.createTemporary({ directory: true });
				try {
					var cache = temporary.getRelativePath("cache").createDirectory();
					cache.getRelativePath("cachetest/A.class").write("A", { append: false, recursive: true });
					var storeType = Packages.java.lang.Class.forName("inonit.script.engine.Java$Store");
					var factory = storeType.getDeclaredMethod("file", [Packages.java.lang.Class.forName("java.io.File")]);
					factory.setAccessible(true);
					var store: any = factory.invoke(null, [cache.pathname.java.adapt()]);
					var storeClass = store.getClass();
					var begin = storeClass.getDeclaredMethod("beginCompile");
					var finish = storeClass.getDeclaredMethod("finishCompile", [Packages.java.lang.Boolean.TYPE]);
					var read = storeClass.getDeclaredMethod("readAt", [Packages.java.lang.Class.forName("java.lang.String")]);
					var write = storeClass.getDeclaredMethod("createOutputStreamAt", [Packages.java.lang.Class.forName("java.lang.String")]);
					[begin, finish, read, write].forEach(function(method) { method.setAccessible(true); });
					var readByte = function(resource: any) {
						var stream = resource.getInputStream();
						try {
							return Number(stream.read());
						} finally {
							stream.close();
						}
					}

					begin.invoke(store, []);
					try {
						var published: any = read.invoke(store, [new Packages.java.lang.String("cachetest/A.class")]);
						verify(readByte(published)).is(65);

						var output: any = write.invoke(store, [new Packages.java.lang.String("cachetest/A.class")]);
						try {
							output.write(66);
						} finally {
							output.close();
						}
						var pending: any = read.invoke(store, [new Packages.java.lang.String("cachetest/A.class")]);
						verify(readByte(pending)).is(66);
					} finally {
						finish.invoke(store, [new Packages.java.lang.Boolean(false)]);
					}
					var after: any = read.invoke(store, [new Packages.java.lang.String("cachetest/A.class")]);
					verify(readByte(after)).is(65);
				} finally {
					temporary.remove();
				}
			}

			fifty.tests.unbuilt.moduleClassCacheClasspathMutation = function() {
				var temporary = jsh.shell.TMPDIR.createTemporary({ directory: true });
				try {
					var shellClasses = temporary.getRelativePath("shell-classes").createDirectory();
					var source = temporary.getRelativePath("source").createDirectory();
					var dependency = temporary.getRelativePath("dependency-classes").createDirectory();
					var sourcePathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "source").getCanonicalPath());
					var dependencyPathname = String(dependency.pathname.java.adapt().getCanonicalPath());
					var script = temporary.getRelativePath("load.jsh.js");
					var scriptPathname = String(new Packages.java.io.File(temporary.pathname.java.adapt(), "load.jsh.js").getCanonicalPath());
					["First", "Second"].forEach(function(name, index) {
						source.getRelativePath("java/cachetest/" + name + ".java").write(
							"package cachetest; public class " + name + " { public static int value() { return " + (index + 1) + "; } }",
							{ append: false, recursive: true }
						);
					});
					script.write(
						[
							"var source = new Packages.java.io.File(" + JSON.stringify(sourcePathname) + ");",
							"var loader = { source: Packages.inonit.script.engine.Code.Loader.create(source) };",
							"jsh.loader.java.add({ src: { loader: loader } });",
							"jsh.shell.echo(String(Packages.cachetest.First.value()));",
							"jsh.loader.java.add(jsh.file.Pathname(" + JSON.stringify(dependencyPathname) + "));",
							"jsh.shell.echo(String(Packages.cachetest.Second.value()));"
						].join("\n"),
						{ append: false }
					);
					var intention = test.shells.unbuilt().invoke({
						script: scriptPathname,
						environment: function(environment) {
							return $api.Object.compose(
								environment,
								{ JSH_SHELL_CLASSES: shellClasses.pathname.toString() }
							);
						},
						stdio: { output: "string" }
					});
					var result = $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					});
					verify(result).status.is(0);
					verify(result.stdio.output.replace(/\s+$/,"")).is("1\n2");

					var caches = new Packages.java.io.File(shellClasses.pathname.java.adapt(), "modules").listFiles();
					var cacheFor = function(name: string) {
						return Array.prototype.slice.call(caches).filter(function(cache) {
							var classFile: any = new Packages.java.io.File(cache, "classes/cachetest/" + name + ".class");
							return classFile.isFile();
						}).map(function(cache) {
							return String(cache.getCanonicalPath());
						});
					}
					var first = cacheFor("First");
					var second = cacheFor("Second");
					if (first.length != 1 || second.length != 1 || first[0] == second[0]) {
						throw new Error("Expected separate cache keys before and after classpath mutation: First=" + first + ", Second=" + second);
					}
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
