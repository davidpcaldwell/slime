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

	private Shell createShell() throws IOException {
		Configuration configuration = this;
		java.net.URI codeLocation = getMainClassSource();
		File launcherFile = null;
		if (codeLocation.getScheme().equals("file")) {
			launcherFile = new File(codeLocation);
		} else {
			throw new RuntimeException("Unreachable: code source = " + codeLocation);
		}
		Shell shell = null;
		if (ClassLoader.getSystemResource("main.jsh.js") != null) {
			shell = Shell.packaged(launcherFile);
		} else {
			java.io.File JSH_HOME = null;
			if (launcherFile.getName().equals("jsh.jar")) {
				JSH_HOME = launcherFile.getParentFile();
			}
			shell = (JSH_HOME != null) ? Shell.built(JSH_HOME) : Shell.unbuilt(configuration.src());
			if (configuration.rhino() != null) {
				//	TODO	provide more flexible parsing of rhino argument; multiple elements, allow URL rather than pathname
				shell.setRhinoClasspath(new URL[] { new File(configuration.rhino()).toURI().toURL() });
			}
			//	TODO	This might miss some exotic situations, like loading this class in its own classloader
		}
		return shell;
	}

	private Shell shell;

	private Shell shell() throws IOException {
		if (shell == null) {
			shell = createShell();
		}
		return shell;
	}

	private Map<String,Engine> engineMap() throws IOException {
		Shell shell = shell();
		Map<String,Engine> INSTANCES = new HashMap<String,Engine>();
		ScriptEngineManager factory = new ScriptEngineManager();
		if (factory.getEngineByName("nashorn") != null) {
			INSTANCES.put("nashorn", new Engine.Nashorn(factory));
		}
		try {
			shell.getRhinoClassLoader().loadClass("org.mozilla.javascript.Context");
			INSTANCES.put("rhino", new Engine.Rhino(shell.getRhinoClassLoader(), this.debug()));
		} catch (ClassNotFoundException e) {
		}
		return INSTANCES;
	}

	private Engine getEngine() throws IOException {
		String JSH_ENGINE = engine();
		Configuration configuration = this;
		Map<String,Engine> engines = configuration.engineMap();
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

	final ArrayList<String> engines() throws IOException {
		final Configuration configuration = this;
		Set<Map.Entry<String,Engine>> entries = configuration.engineMap().entrySet();
		ArrayList<String> rv = new ArrayList<String>();
		for (Map.Entry<String,Engine> entry : entries) {
			rv.add(entry.getKey());
		}
		return rv;
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