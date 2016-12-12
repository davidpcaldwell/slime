//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh.launcher;

import java.io.*;
import java.net.*;
import java.util.*;

import javax.script.*;

abstract class Configuration {
	abstract boolean debug();
	abstract String engine();
	abstract String src();
	abstract String rhino();

	private java.net.URI getMainClassSource() {
		try {
			return Main.class.getProtectionDomain().getCodeSource().getLocation().toURI();
		} catch (java.net.URISyntaxException e) {
			throw new RuntimeException(e);
		}
	}

	private Shell _shell;

	private Shell shell() throws IOException {
		if (_shell == null) {
			_shell = Shell.packaged(new File(getMainClassSource()));
		}
		return _shell;
	}

	private Map<String,Engine> engineMap() throws IOException {
		Map<String,Engine> INSTANCES = new HashMap<String,Engine>();
		ScriptEngineManager factory = new ScriptEngineManager();
		if (factory.getEngineByName("nashorn") != null) {
			INSTANCES.put("nashorn", new Engine.Nashorn(factory));
		}
		try {
			shell().getRhinoClassLoader().loadClass("org.mozilla.javascript.Context");
			INSTANCES.put("rhino", new Engine.Rhino(shell().getRhinoClassLoader(), this.debug()));
		} catch (ClassNotFoundException e) {
		}
		return INSTANCES;
	}

	private Engine getEngine() throws IOException {
		String JSH_ENGINE = engine();
		Map<String,Engine> engines = engineMap();
		if (JSH_ENGINE != null) {
			Engine specified = engines.get(JSH_ENGINE);
			if (specified != null) {
				return specified;
			}
		}
		String[] preferenceOrder = new String[] { "rhino", "nashorn" };
		for (String e : preferenceOrder) {
			if (engines.get(e) != null) return engines.get(e);
		}
		throw new RuntimeException("No JavaScript execution engine found.");
	}

	final Main.Invocation.Configuration invocation() throws IOException {
		final Shell shell = shell();
		final Engine engine = getEngine();
		return new Main.Invocation.Configuration() {
			@Override Shell shell() {
				return shell;
			}

			@Override Engine engine() {
				return engine;
			}
		};
	}
}