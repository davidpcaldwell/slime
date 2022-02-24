//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.tools.code {
	export interface Context {
	}

	export namespace test {
		export const subject = (function(fifty: fifty.test.kit) {
			const script: Script = fifty.$loader.script("module.js");
			return script({});
		//@ts-ignore
		})(fifty);
	}

	export interface File {
		path: string
		file: slime.jrunscript.file.File
	}

	export interface Exports {
		filename: {
			isText: (name: string) => boolean | undefined
			isVcsGenerated: (name: string) => boolean
			isIdeGenerated: (name: string) => boolean
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				verify(test).subject.filename.isText("foo.txt").is(true);
				verify(test).subject.filename.isText("foo.wav").is(false);
				verify(test).subject.filename.isText("foo").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
