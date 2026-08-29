//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh.launcher;

import java.io.*;
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
	private Engine _rhinoEngine;
	private boolean _rhinoChecked;
	private Engine _nashornEngine;
	private boolean _nashornChecked;

	private Shell shell() throws IOException {
		if (_shell == null) {
			_shell = Shell.packaged(new File(getMainClassSource()));
		}
		return _shell;
	}

	private Engine rhinoEngine() throws IOException {
		if (!_rhinoChecked) {
			try {
				shell().getRhinoClassLoader().loadClass("org.mozilla.javascript.Context");
				_rhinoEngine = new Engine.Rhino(shell().getRhinoClassLoader(), this.debug());
			} catch (ClassNotFoundException e) {
				_rhinoEngine = null;
			}
			_rhinoChecked = true;
		}
		return _rhinoEngine;
	}

	private Engine nashornEngine() {
		if (!_nashornChecked) {
			ScriptEngineManager factory = new ScriptEngineManager();
			if (factory.getEngineByName("nashorn") != null) {
				_nashornEngine = new Engine.Nashorn(factory);
			}
			_nashornChecked = true;
		}
		return _nashornEngine;
	}

	private Engine engineById(String id) throws IOException {
		if ("rhino".equals(id)) return rhinoEngine();
		if ("nashorn".equals(id)) return nashornEngine();
		return null;
	}

	private Engine getEngine() throws IOException {
		String JSH_ENGINE = engine();
		if (JSH_ENGINE != null) {
			Engine specified = engineById(JSH_ENGINE);
			if (specified != null) {
				return specified;
			}
		}
		String[] preferenceOrder = new String[] { "rhino", "nashorn" };
		for (String e : preferenceOrder) {
			Engine candidate = engineById(e);
			if (candidate != null) return candidate;
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
