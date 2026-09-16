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

		export interface Port extends slime.jrunscript.ip.Port {
			/**
			 * Returns whether the port is "open" (meaning unused).
			 */
			isOpen(): boolean
		}
	}

	export namespace exports {
		export interface Tcp {
			/**
			 * Returns a port number for an ephemeral TCP port that was available when the function was called.
			 */
			 getEphemeralPortNumber: () => number
		}
	}

	export namespace test {
		export const Spy = function <F extends (...args: any) => any>(f: F): {
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
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		tcp: exports.Tcp

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
			fifty: slime.fifty.test.Kit
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

				fifty.run(fifty.tests.sandbox.tcp);
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
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
		}
	//@ts-ignore
	)(fifty)

	export interface World {
		isReachable: slime.$api.fp.world.Sensor<
			{
				timeout: Timeout
				host: Host
				port?: Port
			},
			{
				error: Error
			},
			boolean
		>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var $api = fifty.global.$api;
			var jsh = fifty.global.jsh;
			var world = jsh.ip.world;

			fifty.tests.sandbox.reachable = fifty.test.Parent();

			fifty.tests.sandbox.reachable.self = function() {
				var loopbackReachable = $api.fp.world.now.question(
					world.isReachable,
					{
						timeout: { milliseconds: 100 },
						host: { name: "127.0.0.1" }
					},
					{
						error: function(e) {
							jsh.shell.console(e.detail.message);
						}
					}
				);
				fifty.verify(loopbackReachable,"loopbackReachable").is(true);
			};

			fifty.tests.sandbox.reachable.sample = function() {
				//	Example IP address; see RFC 5737, apparently
				//	https://superuser.com/a/698392
				var sampleReachable = $api.fp.world.now.question(
					world.isReachable,
					{
						timeout: { milliseconds: 100 },
						host: { name: "192.0.2.1" }
					},
					{
						error: function(e) {
							jsh.shell.console(e.detail.message);
						}
					}
				);
				fifty.verify(sampleReachable,"sampleReachable").is(false);
			};

			fifty.tests.manual.reachable = function() {
				if (!jsh.shell.environment.HOST) {
					jsh.shell.console("Required: HOST environment variable specifying host to test.");
					return;
				}
				var reachable = $api.fp.world.now.question(
					world.isReachable,
					{
						timeout: { milliseconds: 1000 },
						host: { name: jsh.shell.environment.HOST }
					},
					{
						error: function(e) {
							jsh.shell.console(e.detail.message);
						}
					}
				)
				jsh.shell.console(jsh.shell.environment.HOST + " reachable? " + reachable);
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
			fifty: slime.fifty.test.Kit
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

				var Mock = function(isReachable: World["isReachable"]) {
					var spy = test.Spy(isReachable);
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
							return function(events) {
								return true;
							};
						}
					),
					error: Mock(
						function(p) {
							return function(events) {
								events.fire("error", new Error("mock error message"));
								return false;
							};
						}
					),
					failure: Mock(
						function(p) {
							return function(events) {
								return false;
							};
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
					var error = test.Spy(function(e: Error) {
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

	export interface World {
		tcp: {
			/**
			 * Note that exception events will be fired in response to underlying Java exceptions, but that some exceptions are
			 * expected in this situation; the implementation tries several operations, using whether they succeed to help it
			 * determine the state of the port.
			 */
			isAvailable: slime.$api.fp.world.Sensor<
				{
					port: Port
				},
				{
					exception: Error
				},
				boolean
			>
		}
	}

	export namespace exports {
		export interface Tcp {
			Port: {
				isAvailable: (p: {
					port: Port
				}) => {
					run: (p?: {
						world?: {
							tcp: {
								isAvailable: World["tcp"]["isAvailable"]
							}
						}
					}) => boolean
				}
			}
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.ip;

			fifty.tests.sandbox.tcp = fifty.test.Parent();
			fifty.tests.sandbox.tcp.isAvailable = function() {
				var ephemeral = jsh.ip.getEphemeralPort();
				var available = $api.fp.world.input(subject.world.tcp.isAvailable({ port: ephemeral }));
				var one = available();
				verify(one).is(true);
				var _listener = new Packages.java.net.ServerSocket(ephemeral.number);
				var two = available();
				verify(two).is(false);
				_listener.close();
				var three = available();
				verify(three).is(true);
			}

			var Mock = function(
				implementation: (
					p: Parameters<World["tcp"]["isAvailable"]>[0],
					events: $api.event.Producer<{ exception: Error }>
				) => boolean
			 ) {
				var isAvailable: World["tcp"]["isAvailable"] = function(p) {
					return function(events) {
						return implementation(p, events);
					}
				};

				var spy = test.Spy(isAvailable);
				return {
					world: {
						tcp: {
							isAvailable: spy.spy
						}
					},
					invocations: spy.invocations
				};
			};

			fifty.tests.tcp = {};
			fifty.tests.tcp.isAvailable = function() {
				var mock = Mock(function(p,events) {
					if (p.port.number == 1024) return true;
					return false;
				});

				var yes = jsh.ip.tcp.Port.isAvailable({ port: { number: 1024 }}).run({
					world: mock.world
				});
				verify(yes).is(true);
				var no = jsh.ip.tcp.Port.isAvailable({ port: { number: 2048 }}).run({
					world: mock.world
				});
				verify(no).is(false);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.reachable);
				fifty.run(fifty.tests.tcp.isAvailable);

				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty);
}
