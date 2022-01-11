//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Experimental handling of [INI file](https://en.wikipedia.org/wiki/INI_file) formats.
 */
namespace slime.codec.ini {
	export interface Exports {
		/**
		 * Returns an object which can parse INI files and extract values. Future implementations may add an argument or arguments
		 * describing the INI dialect being parsed.
		 */
		codec: () => {
			/**
			 * Extracts a value for the named key from the INI file. Key names are formatted as `[section].name`.
			 */
			value: (file: string, name: string) => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;
			const subject: Exports = fifty.$loader.module("ini.js");
			const one = fifty.$loader.get("test/1.txt").read(String);

			fifty.tests.suite = function() {
				verify(subject).codec().value(one, "section.name").is("value");
				verify(subject).codec().value(one, "section.foo").is(null);
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace internal {
		export interface Line {
			line: string
		}

		export interface HeaderLine extends Line {
			header: string
		}

		export interface ValueLine extends Line {
			section: string
			name: string
			value: string
		}

		export interface Parsed {
			lines: Line[]
			values: () => { [x: string]: string }
			value: (name: string) => string
		}
	}
}