//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.Scope["Packages"] } Packages
	 * @param { slime.runtime.internal.scripts.Scope["$engine"] } $engine
	 * @param { slime.runtime.internal.scripts.Scope["fp"] } fp
	 * @param { slime.loader.Export<slime.runtime.internal.scripts.Exports> } $export
	 */
	function(Packages,$engine,fp,$export) {
		/** @type { slime.runtime.Platform } */
		var $platform = (
			/**
			 *
			 * @param { slime.runtime.Engine } $engine
			 */
			function($engine) {
				/** @type { slime.runtime.Platform } */
				var $exports = {};

				var global = (function() { return this; })();
				if (global && global.XML && global.XMLList) {
					$exports.e4x = {};
					$exports.e4x.XML = global.XML;
					$exports.e4x.XMLList = global.XMLList;
				}

				(
					/**
					 * @this { slime.runtime.Platform }
					 */
					function() {
						var getJavaClass = function(name) {
							try {
								if (typeof(Packages) == "undefined") return null;
								var rv = Packages[name];
								if (typeof(rv) == "function") {
									//	In the Firefox Java plugin, JavaPackage objects have typeof() == "function". They also have the
									//	following format for their String values
									try {
										var prefix = "[Java Package";
										if (String(rv).substring(0, prefix.length) == prefix) {
											return null;
										}
									} catch (e) {
										//	The string value of Packages.java.lang.Object and Packages.java.lang.Number throws a string (the
										//	below) if you attempt to evaluate it.
										if (e == "java.lang.NullPointerException") {
											return rv;
										}
									}
									return rv;
								}
								return null;
							} catch (e) {
								return null;
							}
						}

						if (getJavaClass("java.lang.Object")) {
							this.java = new function() {
								this.getClass = function(name) {
									return getJavaClass(name);
								}
							};
						}
					}
				).call($exports);

				try {
					if (typeof($engine) != "undefined") {
						if ($engine.MetaObject) {
							$exports.MetaObject = $engine.MetaObject;
						}
					}
				} catch (e) {
					//	MetaObject will not be defined
				}

				return $exports;
			}
		)($engine);

		/**
		 * @type { slime.$api.Global["scripts"]["Compiler"]["from"]["simple"] }
		 */
		var Transpiler = function(p) {
			return function(script) {
				if (p.accept(script)) {
					var code = p.read(script);
					return fp.Maybe.from.some({
						name: p.name(script),
						js: p.compile(code)
					});
				} else {
					return fp.Maybe.from.nothing();
				}
			}
		};

		var Code = (
			function() {
				/** @type { slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.runtime.loader.Code>> } */
				var isMimeType = function(string) {
					//	TODO	is there no standard, available API that does this?
					/**
					 *
					 * @type { slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.mime.Type>> }
					 */
					function mimeTypeIs(string) {
						/**
						 *
						 * @param { slime.mime.Type } type
						 */
						function rv(type) {
							return (type.media + "/" + type.subtype) == string;
						}
						return rv;
					}

					return function(script) {
						return mimeTypeIs(string)(script.type());
					}
				};

				var JavascriptCompiler = Transpiler({
					accept: fp.Predicate.or(
						isMimeType("application/javascript"),
						isMimeType("application/x-javascript"),
						//	TODO	unclear whether text/javascript should be accepted, but we had a situation where it was being passed
						//			here and was causing crashes, so inserting acceptance as a workaround for now
						isMimeType("text/javascript")
					),
					name: function(code) { return code.name; },
					read: function(code) { return code.read(); },
					compile: function(s) { return s; }
				});

				var GlobalCompiler = function() {
					/** @type { slime.runtime.loader.Compiler<slime.runtime.loader.Code> } */
					var compiler = JavascriptCompiler;

					return {
						/** @type { slime.runtime.Exports["compiler"]["update"] } */
						update: function(transform) {
							compiler = transform(compiler);
						},
						/** @type { slime.runtime.loader.Compiler<slime.runtime.loader.Code> } */
						compile: function(code) {
							return compiler(code);
						}
					}
				};

				return {
					isMimeType: isMimeType,
					global: GlobalCompiler()
				}
			}
		)();

		/**
		 * @type { slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"] }
		 */
		var toExportScope = function(scope) {
			var rv = Object.assign(scope, { $exports: void(0), $export: void(0) });
			var $exports = {};
			var $export = function(v) {
				$exports = v;
			};
			Object.defineProperty(scope, "$exports", {
				get: function() {
					return $exports;
				},
				enumerable: true
			});
			Object.defineProperty(scope, "$export", {
				get: function() {
					return $export;
				},
				enumerable: true
			});
			return rv;
		};

		/** @type { slime.runtime.internal.scripts.Exports["internal"]["createScriptScope"] } */
		var createScriptScope = function($context) {
			var toT = function(any) { return any; };

			return toExportScope({
				$context: ($context) ? $context : toT({})
			});
		};

		/**
		 * @template { any } R
		 * @param { slime.runtime.internal.scripts.executor.Parameters<R> } p
		 * @returns { slime.runtime.internal.scripts.executor.Returns<R> }
		 */
		var Executor = function(p) {
			/**
			 * @type { slime.runtime.internal.scripts.executor.Returns<R>["run"] }
			 */
			function run(code,scope) {
				// if (!code || typeof(code) != "object") {
				// 	throw new TypeError("'object' must be a slime.runtime.loader.Code object, not " + code);
				// }
				// if (typeof(code.read) != "function") throw new Error("Not slime.runtime.loader.Code: no read() function");

				var compile = fp.now(
					p.compiler,
					fp.Partial.impure.exception(
						function(code) {
							return new TypeError(p.unsupported(code));
						}
					)
				);

				var script = compile(code);

				var target = this;

				//	TODO	why is this present? I guess so we can't accidentally load scripts into the global scope, even if we say
				//			we want to do that?
				var global = (function() { return this; })();
				if (scope === global) {
					scope = {};
				}

				if (scope === void(0)) {
					scope = {};
				}

				for (var x in p.scope) {
					scope[x] = p.scope[x];
				}

				$engine.execute(
					script,
					scope,
					target
				);
			}

			return {
				run: run
			}
		}

		/**
		 * @template { any } R
		 * @param { slime.runtime.internal.scripts.executor.Returns<R> } executor
		 */
		var OldMethods = function(executor) {
			function file(code,$context) {
				var inner = createScriptScope($context);
				executor.run.call(this,code,inner);
				return inner.$exports;
			}

			function value(code,scope) {
				var rv;
				if (!scope) scope = {};
				scope.$set = function(v) {
					rv = v;
				};
				executor.run.call(this,code,scope);
				return rv;
			}

			return {
				file: file,
				value: value
			}
		}

		$export({
			api: {
				Code: {
					isMimeType: Code.isMimeType
				},
				Compiler: {
					from: {
						simple: Transpiler
					}
				}
			},
			platform: $platform,
			internal: {
				old: {
					toExportScope: toExportScope,
				},
				createScriptScope: createScriptScope
			},
			runtime: function($api) {
				var executor = Executor({
					compiler: Code.global.compile,
					unsupported: function(code) { return "Code " + code.name + " cannot be converted to JavaScript; type = " + code.type() },
					scope: {
						$platform: $platform,
						$api: $api
					}
				});
				return {
					compiler: Code.global,
					internal: {
						methods: {
							old: OldMethods(executor),
							run: executor.run
						},
					}
				};
			}
		});
	}
//@ts-ignore
)(Packages,$engine,fp,$export);
