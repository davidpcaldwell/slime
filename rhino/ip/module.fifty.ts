//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides networking (IP) capabilities.
 */
namespace slime.jrunscript.ip {
	export interface Context {
		api: {
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface Host {
		name: string
	}

	export interface Port {
		number: number
	}

	export interface Timeout {
		milliseconds: number
	}

	export namespace object {
		export interface Host {
			isReachable(p?: {
				/** A timeout, in **seconds**. */
				timeout: number
			}): boolean
		}

		export interface Port {
			number: number
			isOpen(): boolean
		}
	}

	export interface Exports {
		tcp: {
			/**
			 * Returns a port number for an ephemeral TCP port that was available when the function was called.
			 */
			getEphemeralPortNumber: () => number
		}

		Host: (p: Host) => object.Host
		Port: (p: Port) => object.Port
		getEphemeralPort(): object.Port

		reachable: {
			configuration: (p: { timeout: Timeout }) => {
				endpoint: (p: {
					host: Host
					port?: Port
				}) => {
					run: (p?: {
						error?: (e: Error) => void
						world?: {
							isReachable: World["isReachable"]
						}
					}) => boolean
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.sandbox = function() {
				fifty.run(fifty.tests.sandbox.reachable);
				if (fifty.global.jsh.shell.os.name == "Mac OS X") {
					var canPingSelf: boolean = false;
					if (canPingSelf) {
						fifty.run(fifty.tests.sandbox.object.self);
					}
					fifty.run(fifty.tests.sandbox.object.sample);
				}
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.sandbox.object = {};

			fifty.tests.sandbox.object.self = function() {
				var host = jsh.ip.Host({ name: "127.0.0.1" });
				verify(host).isReachable().is(true);
			}

			fifty.tests.sandbox.object.sample = function() {
				//	Example IP address; see RFC 5737, apparently
				//	https://superuser.com/a/698392
				//	TODO	decrease timeout for this
				var TIMEOUT_IN_SECONDS = 1;
				var host = jsh.ip.Host({ name: "192.0.2.1" });
				var before = Date.now();
				verify(host).isReachable({ timeout: TIMEOUT_IN_SECONDS }).is(false);
				var after = Date.now();
				verify(after - before).evaluate(function(p) { return p >= TIMEOUT_IN_SECONDS * 1000; }).is(true);
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty)

	export interface World {
		isReachable: (p: {
			timeout: Timeout
			host: Host
			port?: Port
		}) => slime.$api.fp.impure.Ask<{
			error: Error
		},boolean>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var world = jsh.ip.world;

			fifty.tests.sandbox.reachable = function() {
				fifty.run(fifty.tests.sandbox.reachable.self);
				fifty.run(fifty.tests.sandbox.reachable.sample);
			}

			fifty.tests.sandbox.reachable.self = function() {
				var loopbackReachable = world.isReachable({
					timeout: { milliseconds: 100 },
					host: { name: "127.0.0.1" }
				})({
					error: function(e) {
						jsh.shell.console(e.detail.message);
					}
				});
				fifty.verify(loopbackReachable,"loopbackReachable").is(true);
			};

			fifty.tests.sandbox.reachable.sample = function() {
				//	Example IP address; see RFC 5737, apparently
				//	https://superuser.com/a/698392
				var sampleReachable = world.isReachable({
					timeout: { milliseconds: 100 },
					host: { name: "192.0.2.1" }
				})({
					error: function(e) {
						jsh.shell.console(e.detail.message);
					}
				});
				fifty.verify(sampleReachable,"sampleReachable").is(false);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		world: World
	}

	export interface Exports {
		reachable: {
			configuration: (p: { timeout: Timeout }) => {
				endpoint: (p: {
					host: Host
					port?: Port
				}) => {
					run: (p?: {
						error?: (e: Error) => void
						world?: {
							isReachable: World["isReachable"]
						}
					}) => boolean
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const $api = fifty.global.$api;
			const jsh = fifty.global.jsh;
			const verify = fifty.verify;

			fifty.tests.sandbox.reachable.example = function() {
				var reachable = jsh.ip.reachable.configuration({
					timeout: { milliseconds: 100 }
				}).endpoint({
					host: { name: "192.0.2.1" }
				}).run();
				fifty.verify(reachable).is(false);
			}

			fifty.tests.reachable = function() {
				var basis = jsh.ip.reachable.configuration({
					timeout: { milliseconds: 1000 }
				}).endpoint({
					host: { name: "foo" }
				});

				var Spy = function <F extends (...args: any) => any>(f: F): {
					spy: F
					invocations: {
						this: ThisType<F>
						arguments: Parameters<F>
					}[]
				} {
					var invocations = [];
					return {
						//@ts-ignore
						spy: function() {
							invocations.push({ this: this, arguments: Array.prototype.slice.call(arguments)});
							return f.apply(this,arguments);
						},
						invocations: invocations
					}
				};

				var Mock = function(isReachable: World["isReachable"]) {
					var spy = Spy(isReachable);
					return {
						world: {
							isReachable: spy.spy
						},
						invocations: spy.invocations
					}
				};

				var mocks = {
					success: Mock(
						function(p) {
							return $api.Function.impure.ask(function(events) {
								return true;
							})
						}
					),
					error: Mock(
						function(p) {
							return $api.Function.impure.ask(function(events) {
								events.fire("error", new Error("mock error message"));
								return false;
							})
						}
					),
					failure: Mock(
						function(p) {
							return $api.Function.impure.ask(function(events) {
								return false;
							})
						}
					)
				}

				var result = basis.run({
					world: mocks.success.world
				});

				verify(result).is(true);

				var captured = mocks.success.invocations[0].arguments[0];
				verify(captured).host.name.is("foo");
				verify(captured).timeout.milliseconds.is(1000);

				fifty.run(function errorsWithoutHandlerMethodPropagate() {
					verify(basis).evaluate(function(p: typeof basis) {
						return p.run({
							world: mocks.error.world
						});
					}).threw.type(Error);
					verify(basis).evaluate(function(p: typeof basis) {
						return p.run({
							world: mocks.error.world
						});
					}).threw.message.is("mock error message");
				});

				fifty.run(function errorsPassedToHandler() {
					var error = Spy(function(e: Error) {
					});

					verify(error).invocations.length.is(0);

					verify(basis).evaluate(function(p: typeof basis) {
						return p.run({
							error: error.spy,
							world: mocks.error.world
						});
					}).threw.nothing();

					verify(error).invocations.length.is(1);
					verify(error).invocations[0].arguments[0].message.is("mock error message");
				});

				fifty.run(function failure() {
					verify(basis).run({
						world: mocks.failure.world
					}).is(false);
				});
			}
		}
	//@ts-ignore
	)(fifty);

}