//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## Using SLIME
 *
 * ### SLIME definitions (documentation and testing)
 *
 * SLIME has the concept of a _definition_, which is a construct that provides both documentation and
 * a test suite for a particular software module.
 *
 * Documentation for SLIME itself is mostly contained in SLIME definitions that define its APIs.
 *
 * The best way to create SLIME definitions is via the {@link slime.fifty | Fifty}
 * definition framework, which uses TypeScript to provide type definitions and `tsdoc`-compatible
 * documentation (and uses [TypeDoc](https://typedoc.org/) to
 * publish that documentation, and the `fifty view` tool to serve it), and allows
 * inline tests to be authored within those TypeScript definitions. A simple example that contains tests
 * for the project's `wf` commands can be found at `./wf.fifty.ts`.
 *
 * Many existing SLIME APIs are currently defined via the deprecated JSAPI definition format, which used literate definitions that
 * allowed documentation and tests to be defined via annotated HTML (typically using the file extension `.api.html`), using HTML
 * constructs for documentation and embedded scripts for testing.
 */
namespace slime {

}