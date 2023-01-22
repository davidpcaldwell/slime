//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git {
	export interface CredentialHelpers {
		/**
		 * A value that can be used for the git `credential.helper` configuration value. When this credential helper is used, a Java
		 * UI will be launched in order to ask the user for credentials when needed.
		 */
		jsh?: string
	}
}
