//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## Running JXA scripts
 *
 * JXA scripts can be run with the `jxa.bash` launcher at the top level of the SLIME distribution. Scripts
 * are provided with a global `jxa` object; its APIs are described in {@link slime.jxa.Global}.
 *
 * ## Resources for JXA
 *
 * JXA documentation from [macOS 10.10 release notes](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-10.html#//apple_ref/doc/uid/TP40014508-CH109-SW1)
 *
 * Debugging with Safari: [macOS 10.11 release notes](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html)
 *
 * [JXA resources](https://gist.github.com/JMichaelTX/d29adaa18088572ce6d4)
 */
namespace slime.jxa {
	export namespace osx {
		export namespace System_Events {
			export interface Application {
			}

			export interface Process {
			}
		}
	}

	export interface Global {
		delay: (seconds: number) => void

		Application: (name: string) => osx.System_Events.Application

		system: {
			processes: {
				byName: (name: string) => osx.System_Events.Process
			}
		}

		shell: {
			/**
			 * Echoes a message to the console.
			 */
			echo: (message: string) => void

			/**
			 * The process environment.
			 */
			environment: {
				[name: string]: string
			}
		}

		script: {
			/**
			 * The arguments provided to the script.
			 */
			arguments: string[]

			/**
			 * A Loader that loads resources relative to the script's location.
			 */
			loader: slime.Loader
		}
	}
}
