//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.browser {
	export interface Global extends slime.$api.Global {
		timer: slime.browser.internal.$api.Exports["timer"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			var { $api } = fifty.global;

			fifty.tests.load = function() {
				verify($api).content.is.type("object");
				verify($api).evaluate.property("timer").is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.browser.internal.$api {
	export interface Context {
		time: {
			Date: new () => Date
			setTimeout: WindowOrWorkerGlobalScope["setTimeout"]
			clearTimeout: WindowOrWorkerGlobalScope["clearTimeout"]
		}
	}

	export namespace test {
		export const script = (function(fifty: slime.fifty.test.Kit) {
			return fifty.$loader.script("$api.js") as Script;
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		timer: {
			schedule: (p: {
				process: () => void
				next: (now: Date) => Date
			}) => {
				cancel: () => void
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.timer = fifty.test.Parent();
			fifty.tests.timer.schedule = function() {
				var constantDate = function(date: Date) {
					return function() {
						return date;
					} as unknown as Context["time"]["Date"]
				};

				interface Call<F extends slime.external.lib.es5.TypescriptFunction> {
					target: ThisType<F>
					arguments: Parameters<F>
				}

				interface Execution<F extends slime.external.lib.es5.TypescriptFunction> extends Call<F> {
					returned: ReturnType<F>
				}

				var Recorder = function<F extends slime.external.lib.es5.TypescriptFunction>(f: F) {
					var calls: Call<F>[] = [];

					return {
						recorder: function() {
							var call: Call<F> = {
								target: this,
								arguments: Array.prototype.slice.call(arguments)
							};
							calls.push(call);
							var rv = f.apply(this, arguments);
							var execution: Execution<F> = Object.assign(call, {
								returned: rv
							});
							return rv;
						},
						calls: calls
					}
				};

				var setTimeout = Recorder(
					(function() {
						var counter = 0;

						return function(handler: slime.external.lib.es5.TypescriptFunction, timeout: number, ...rest) {
							return counter++;
						};
					})()
				);

				var clearTimeout: WindowOrWorkerGlobalScope["clearTimeout"] = function(id) {
				}

				var process = function() {};

				var Process = Recorder(process);

				var api = test.script({
					time: {
						Date: constantDate(new Date(2024, 0, 1, 0, 0, 0)),
						setTimeout: setTimeout.recorder,
						clearTimeout: clearTimeout
					}
				});

				verify(Process).calls.length.is(0);
				verify(setTimeout).calls.length.is(0);

				var it = api.timer.schedule({
					process: Process.recorder,
					next: function(now) {
						return new Date(now.getTime() + 1000);
					}
				});

				verify(Process).calls.length.is(0);
				verify(setTimeout).calls.length.is(1);
				verify(setTimeout).calls[0].arguments.evaluate.property(0).is(Process.recorder);
				verify(setTimeout).calls[0].arguments.evaluate.property(1).is(1000);
				verify(setTimeout).calls[0].arguments.length.is(2);
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.load);
				fifty.run(fifty.tests.timer);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
