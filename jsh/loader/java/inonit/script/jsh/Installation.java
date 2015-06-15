//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public class Installation {
	static Installation create(Shell.Configuration.Installation configuration) {
		Installation rv = new Installation();
		rv.configuration = configuration;
		return rv;
	}

	private Shell.Configuration.Installation configuration;

	private Installation() {
	}

	public final Code.Source.File getJshLoader(String path) {
		try {
			return configuration.getJshLoader().getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public final Code.Source getPlatformLoader() {
		return configuration.getPlatformLoader();
	}

	public final Code.Source getJshLoader() {
		return configuration.getJshLoader();
	}

	public final Code[] getPlugins() {
		return configuration.getPlugins().get();
	}

	public final Code.Source.File getLibrary(String path) {
		return configuration.getPlugins().getFile(path);
	}
}