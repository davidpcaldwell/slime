//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.profiler.rhino {
	export interface Options {
		/**
		 * A filesystem path for a listener script.
		 */
		listener: string

		/**
		 * A filesystem path to which to output
		 */
		html: string

		json: string
	}

	export interface JavaCode {
		className: string
		methodName: string
		signature: string
	}

	export interface JavascriptCode {
		sourceName: string
		lineNumber?: number
		lineNumbers?: number[]
		functionName?: string
	}

	export interface SelfCode {
		self: Code
	}

	export type Code = JavaCode | JavascriptCode | SelfCode

	export interface Statistics {
		count: number
		elapsed: number
	}

	export interface Node {
		code: Code
		statistics: Statistics
		children: Node[]
		self: SelfCode
	}

	export interface Profile {
		thread: {
			name: string
		}
		timing: {
			root: Node
		}
	}
}
