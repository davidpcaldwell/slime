//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.system.apple {
	export interface Context {
		api: any
	}

	export namespace osx {
		/**
		 * An object specifying properties to be added to the `Info.plist`. Properties with string values will be
		 * treated as name-value pairs. Some properties allow non-string values, as specified below. The
		 * `CFBundlePackageType` property is hard-coded to `APPL`, per Apple's specification. The following
		 * properties are also required to be supplied, per Apple's documentation (although SLIME provides a default
		 * value for one):
		 */
		export interface ApplicationBundleInfo {
			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html)
			 */
			CFBundleName: string

			/**
			 * Apple says this value is required, but it does not appear to be required.
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleDisplayName?: string

			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleIdentifier: string

			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleVersion: string

			/**
			 * (optional; defaults to `????`; see [Stack
			 * Overflow](http://stackoverflow.com/questions/1875912/naming-convention-for-cfbundlesignature-and-cfbundleidentifier).)
			 *
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleSignature?: string

			//	TODO	document allowed object type with command (preceding comment copied from JSAPI)
			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleExecutable: string | { name?: string, command: string }

			//	Added to make test pass type checking; not sure what this does
			CFBundleIconFile?: any
		}

		export interface ApplicationBundle {
			directory: slime.jrunscript.file.Directory
			info?: ApplicationBundleInfo
		}
	}

	export type Exports = slime.jrunscript.shell.Exports["system"]["apple"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
