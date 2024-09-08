//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.script {
	declare const unexpctedOptionHandlerTag: unique symbol;

	type UnexpectedOptionHandler = { readonly [unexpctedOptionHandlerTag]: "TAG" };

	export type GetoptsFunction = (
		/**
		 * Processes an array of strings as arguments, using an object which specifies how arguments are interpreted.
		 *
		 * An "option" is an argument which is prefixed with a dash (`-`) character. The argument immediately following the option
		 * is, depending on the option's type, interpreted as a value for that option.
		 *
		 * For example, the following code:
		 * ```
		 * var parameters = jsh.script.getopts({
		 * 	options: {
		 * 		s: String,
		 * 		n: Number,
		 * 		num: 8,
		 * 		b: false,
		 * 		p: Boolean,
		 * 		list: jsh.script.getopts.ARRAY(String)
		 * 	}
		 * }, [ "-s", "aString", "-n", 42, "-b", "-list", "a", "-list", "b" ]);
		 * ```
		 * produces an object equivalent to:
		 * ```
		 * var parameters = { options: { s: "aString", n: 42, num: 8, b: true, p: false, list: ["a", "b"] } };
		 * ```
		 *
		 * @param settings An object describing how the arguments should be processed.
		 * @param arguments (optional) A list of arguments to be processed. If omitted, the values in `jsh.script.arguments` will be
		 * processed.
		 *
		 * @returns An object containing the result of parsing the argument list.
		 */
		(
			settings: {
				/**
				 * Each named property of this object is the name of a recognized option. The value of a property describes
				 * the possible values of the option.
				 */
				options: object

				/**
				 * (optional) One of the properties of the `UNEXPECTED_OPTION_PARSER` object.
				 */
				unhandled?: UnexpectedOptionHandler
			},
			arguments?: string[] | IArguments
		) => {
			/**
			 * Each property of this object represents an option to be parsed; the name of the property indicates the
			 * option's name and its value indicates the option's type and/or default value.
			 *
			 * Several option types are possible.
			 *
			 * | Declaration | Type | Declaration with default value | Value if present | Value if not present and no default |
			 * | :-- | :-: | :-: | :-- | :-: |
			 * | `Boolean` | `boolean` | `false` (`true` is illegal, as value would not be negatable) | `true` | `false` |
			 * | `String` | `string` | A value of type `string` | The value of the next argument | `undefined` |
			 * | `Number` | `number` | A value of type `number` | The value of the next argument, interpreted as a number | `undefined` |
			 * | `jsh.file.Pathname` | {@link slime.jrunscript.file.Pathname | Pathname} | A value of type {@link slime.jrunscript.file.Pathname | Pathname} | The value of the next argument, interpreted as a `jsh.file.Pathname`. If the next argument is an absolute path, the equivalent `jsh.file.Pathname` is returned. Otherwise, the next argument is interpreted as a path relative to the current working directory. | `undefined` |
			 * | `getopts.ARRAY`(*type*) where *type* is `String`, `Number` or `jsh.file.Pathname`) | `Array` of applicable type | (not applicable) | The value of each argument for the option, interpreted as the applicable type. Arguments can be specified multiple times on the same command line by repeating the option and the resulting array will contain all given values. | `[]` |
			 * | `getopts.OBJECT`(*type*) where *type* is `String`, `Number`, `Boolean`, or `jsh.file.Pathname`) | `Object` containing properties of applicable type | `Object` | A name-value pair created using the next argument, which is of the form *`name=value`*. Arguments can be specified multiple times on the same command line by repeating the option. For each argument, the value is interpreted as an instance of *type*. The result will be an object with a property for each occurrence, with name *`name`* and value *`value`*. | `{}` |
			 */
			options: { [name: string]: any }

			/**
			 * The arguments that were not parsed, either because they were skipped, or because they were "values"
			 * (arguments not beginning with a dash) that did not follow an "option" (an argument beginning with a dash).
			 */
			arguments: string[]
		}
	)

	export interface Exports {
		getopts: (
			GetoptsFunction
			& {
				/** A set of possibilities for handling unrecognized options. */
				UNEXPECTED_OPTION_PARSER: {
					/** An unexpected options handler that treats any unrecognized option as an error. */
					ERROR: UnexpectedOptionHandler

					/** An unexpected options handler that discards any unrecognized options. */
					IGNORE: UnexpectedOptionHandler

					/**
					 * An unexpected options handler that preserves any unrecognized options in the `arguments` member of the
					 * `getopts` return value.
					 */
					SKIP: UnexpectedOptionHandler

					/**
					 * An unexpected options handler that attempts to handle unrecognized options. If the argument following the
					 * unrecognized option name is another option, the argument will be interpreted as a `boolean` argument with
					 * value `true`. Otherwise, the argument will be interpreted as a `string` argument with its value specified by
					 * the next argument.
					 */
					INTERPRET: UnexpectedOptionHandler
				}
				ARRAY: any
				OBJECT: any
				parser: {
					Pathname: (s: string) => slime.jrunscript.file.Pathname
				}
			}
		)
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const module = test.subject;
			const unexpected = ["-boolean", "-string", "string"];
			const process = function(strategy) {
				return module.getopts({
					options: {},
					unhandled: strategy
				},unexpected);
			}

			fifty.tests.exports.getopts = fifty.test.Parent();

			fifty.tests.exports.getopts.unexpected = fifty.test.Parent();

			fifty.tests.exports.getopts.unexpected.error = function() {
				verify(module).evaluate(function() { return this.getopts({
					options: {},
					unhandled: module.getopts.UNEXPECTED_OPTION_PARSER.ERROR
				}, unexpected); }).threw.type(Error);
			};

			fifty.tests.exports.getopts.unexpected.ignore = function() {
				var parameters = process(module.getopts.UNEXPECTED_OPTION_PARSER.IGNORE);
				verify(parameters).arguments.length.is(0);
				verify(parameters).options.evaluate(function() {
					return this.boolean;
				}).is(void(0));
				verify(parameters).options.evaluate(function() {
					return this.string;
				}).is(void(0));
			}

			fifty.tests.exports.getopts.unexpected.skip = function() {
				var parameters = process(module.getopts.UNEXPECTED_OPTION_PARSER.SKIP);
				verify(parameters).arguments.length.is(3);
				verify(parameters).options.evaluate(function() {
					return this.boolean;
				}).is(void(0));
				verify(parameters).options.evaluate(function() {
					return this.string;
				}).is(void(0));
			}

			fifty.tests.exports.getopts.unexpected.interpret = function() {
				var parameters = process(module.getopts.UNEXPECTED_OPTION_PARSER.INTERPRET);
				verify(parameters).arguments.length.is(0);
				verify(parameters).options.evaluate(function() {
					return this.boolean;
				}).is(true);
				verify(parameters).options.evaluate(function() {
					return this.string as string;
				}).is("string");
			}

			fifty.tests.exports.getopts.options = function() {
				var strings = ["-property","foo=bar","-property","hello=world"];
				var p1 = module.getopts({
					options: {
						property: module.getopts.OBJECT(String)
					}
				},strings) as unknown as { options: { property: { foo: string, hello: string }}} ;
				verify(p1).options.property.foo.is("bar");
				verify(p1).options.property.hello.is("world");

				var numbers = ["-property","a=1","-property","b=2"];
				var p2 = module.getopts({
					options: {
						property: module.getopts.OBJECT(Number)
					}
				},numbers) as unknown as { options: { property: { a: number, b: number }}};
				verify(p2).options.property.a.is(1);
				verify(p2).options.property.b.is(2);

				var booleans = ["-property","that","-property","it"];
				var p3 = module.getopts({
					options: {
						property: module.getopts.OBJECT(Boolean)
					}
				},booleans);
				verify(p3).options.property.that.is(true);
				verify(p3).options.property.it.is(true);

				var pathnames = ["-property","absolute=" + jsh.script.file.toString(),"-property","relative=foo/bar"];
				var p4 = module.getopts({
					options: {
						property: module.getopts.OBJECT(jsh.file.Pathname)
					}
				},pathnames);
				jsh.shell.echo("property: " + Object.keys(p4.options.property));
				verify(p4).options.property.absolute.evaluate(function() {
					return this.toString() as string;
				}).is(jsh.script.file.toString());
				verify(p4).options.property.relative.evaluate(function() {
					return this.toString() as string;
				}).is(jsh.shell.PWD.getRelativePath("foo/bar").toString());

				var p5 = module.getopts({
					options: {
						property: Object
					}
				},["-property","foo=bar","-property","hello=world"]) as unknown as { options: { property: { foo: string, hello: string }}};
				verify(p5).options.property.foo.is("bar");
				verify(p5).options.property.hello.is("world");
			}

			fifty.tests.exports.getopts._1 = function() {
				const test = function(b) {
					verify(b).is(true);
				};

				var getopts = module.getopts;

				var t_0 = getopts(
					{
						options: {
							s: String
						},
					},
					[ "-s", "brilliant" ]
				) as unknown as { options: { s: string }};

				verify(t_0.options,"t_0.options").s.is("brilliant");

				var t_1 = getopts(
					{
						options: {
							n: Number,
							s: String,
							b: Boolean
						}
					},
					[ "-s", "hello", "-b", "-n", "8" ]
				) as unknown as { options: { n: number, s: string, b: boolean }};

				var verify_t1options = verify(t_1.options,"t_1.options");
				verify_t1options.n.is(8);
				verify_t1options.s.is("hello");
				verify_t1options.b.is(true);

				var t_array = getopts(
					{
						options: {
							l: getopts.ARRAY( String ),
							b: Boolean,
							nob: Boolean,
							n: 8,
							s: "nodefault",
						}
					},
					[ "-s", "sizzle", "-l", "hello", "-l", "world", "-b" ]
				) as unknown as { options: { l: string[], s: string, b: boolean, nob: boolean, n: number }};

				var verify_t_array_options = verify(t_array.options, "t_array.options");
				verify_t_array_options.l.length.is(2);
				verify_t_array_options.l[0].is("hello");
				verify_t_array_options.l[1].is("world");
				verify_t_array_options.s.is("sizzle");
				verify_t_array_options.b.is(true);
				verify_t_array_options.nob.is(false);
				verify_t_array_options.n.is(8);

				var usingArgumentsObject = (function(...args) {
					return module.getopts({
						options: {
							a: String
						}
					}, arguments);
				})("-a", "b");
				test(usingArgumentsObject.options.a == "b");

				var disableBreakOnExceptions = ($api.debug && $api.debug.disableBreakOnExceptionsFor) ? $api.debug.disableBreakOnExceptionsFor : function(f) { return f; };
				var expectError = disableBreakOnExceptions(function(f) {
					try {
						f.apply(this,arguments);
						return false;
					} catch (e) {
						return true;
					}
				});

				test(expectError(function() {
					var args;
					var parameters = module.getopts({
						options: {
						}
					}, args);
				}));

				//
				//	Deprecated usage
				//

				var t_d_1 = getopts(
					{
						options: {
							s: String
						},
					},
					[ "-s", "yes" ]
				) as unknown as { options: { s: string } };

				verify(t_d_1.options,"t_d_1.options").s.is("yes");

				var PATHNAME_SEPARATOR = jsh.file.filesystem.$unit.getPathnameSeparator();
				var anAbsolute = PATHNAME_SEPARATOR + [ "hello", "world" ].join(PATHNAME_SEPARATOR);
				var pathsOptions = getopts({
						options: {
							absolute: jsh.file.Pathname,
							relative: jsh.file.Pathname
						}
					},
					[ "-absolute", anAbsolute, "-relative", "hello" ]
				) as unknown as { options: { absolute: slime.jrunscript.file.Pathname, relative: slime.jrunscript.file.Pathname }};
				if (pathsOptions.options.absolute.toString().substring(0,2) == "\\\\") {
					//	Deal with Windows "absolute" paths including \\SERVER\SHARE paths when running tests against shared
					//	folder
					var absolute = pathsOptions.options.absolute.toString();
					verify(absolute.substring(absolute.length-anAbsolute.length)).is(anAbsolute);
				} else {
					var absoluteOs = String(new Packages.java.io.File(anAbsolute).getCanonicalPath());
					verify(pathsOptions.options.absolute).toString().is(absoluteOs);
				}
				jsh.shell.console("pathsOptions.options.relative=" + pathsOptions.options.relative);
				jsh.shell.console("context.FILE.workingDirectory=" + jsh.shell.PWD);
				test( pathsOptions.options.relative.toString() == jsh.shell.PWD.toString() + "hello" );
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}

namespace slime.jsh.script.internal.getopts {
	export interface Context {
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
