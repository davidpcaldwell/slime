//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.browser.test.events {
	export interface Context {
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("events.js");
			return script();
		//@ts-ignore
		})(fifty)
	}

	export interface Exports {
		click: (element: Element, p?: any) => void
		mousedown: (element: Element, p?: any) => void
		mouseup: (element: Element, p?: any) => void
		change: (element: Element, p?: any) => void
		input: (element: Element, p?: any) => void
		keydown: (element: Element, p?: any) => void
		keypress: (element: Element, p?: any) => void
		keyup: (element: Element, p?: any) => void
		focus: (element: Element, p?: any) => void
		blur: (element: Element, p?: any) => void
		focusin: (element: Element, p?: any) => void
		focusout: (element: Element, p?: any) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { window } = fifty.global;

			const { subject } = test;

			fifty.tests.suite = function() {
				var element = window.document.createElement("div");
				var captor: Event[] = [];
				element.addEventListener("click", function(e) {
					captor.push(e);
				});
				verify(captor).length.is(0);
				subject.click(element);
				verify(captor).length.is(1);
			};

			fifty.tests.wip = fifty.tests.suite;
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
