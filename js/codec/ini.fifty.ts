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

			values: (file: string) => {
				[x: string]: string
			}

			with: {
				set: (file: string, name: string, value: string) => string
			}
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
				var codec = subject.codec();

				verify(codec).value(one, "global").is("foo");

				verify(codec).value(one, "section.name").is("value");
				verify(codec).value(one, "section.foo").is(null);

				verify(codec).values(one)
					.evaluate(function(p) { return Object.entries(p); })
					.evaluate(function(p) { return p.map(function(entry) { return entry[0]; }) })
					.evaluate(function(p) { return p.sort(function(a,b) {
						if (a < b) return -1;
						if (b < a) return 1;
						return 0;
					})})
					.evaluate(function(array) { return array.join("|"); })
					.is("global|section.name");

				verify(codec).value(one, "calendar.season").is(null);
				var withNewProperty = subject.codec().with.set(one, "calendar.season", "winter");
				verify(codec).value(withNewProperty, "calendar.season").is("winter");

				verify(codec).value(one, "section.name").is("value");
				var withUpdatedSection = codec.with.set(one, "section.name", "newValue");
				verify(codec).value(withUpdatedSection, "section.name").is("newValue");

				verify(codec).value(one, "top").is(null);
				var withNewTopLevel = codec.with.set(one, "top", "bar");
				verify(codec).value(withNewTopLevel, "top").is("bar");

				verify(codec).value(one, "global").is("foo");
				var updateTopLevel = codec.with.set(one, "global", "bar");
				verify(codec).value(updateTopLevel, "global").is("bar");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<void,Exports>

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
			serialize: () => string
		}
	}
}