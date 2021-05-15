//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.ip {
	export interface Context {
		api: any
	}

	interface Host {
		isReachable(p?: { timeout: number }): boolean
	}

	interface Port {
		number: number
		isOpen(): boolean
	}

	export interface Exports {
		tcp: {
			/**
			 * Returns a port number for an ephemeral port that was available when the function was called.
			 */
			getEphemeralPortNumber: () => number
		}
		Host: (p: { name: string }) => Host
		Port: (p: { number: number }) => Port
		getEphemeralPort(): Port
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				var jsh = fifty.global.jsh;
				var verify = fifty.verify;

				//	TODO	how is stuff like this set in Fifty?
				var canPingSelf: boolean = false;

				//	TODO	obviously we would like this to work on other environments
				if (jsh.shell.os.name == "Mac OS X") {
					if (canPingSelf) {
						var host = jsh.ip.Host({ name: "127.0.0.1" });
						verify(host).isReachable().is(true);
					}
					(function() {
						//	Example IP address; see RFC 5737, apparently
						//	https://superuser.com/a/698392
						//	TODO	decrease timeout for this
						var host = jsh.ip.Host({ name: "192.0.2.1" });
						verify(host).isReachable({ timeout: 1 }).is(false);
					})();
				}
			}
		}
	//@ts-ignore
	)(fifty)
}