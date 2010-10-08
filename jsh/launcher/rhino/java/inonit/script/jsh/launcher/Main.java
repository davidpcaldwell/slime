//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh.launcher;

import java.util.*;

public class Main {
	private Main() {
	}

	private static abstract class Invocation {
		static Invocation create() throws java.io.IOException {
			java.net.URL codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation();
			String codeUrlString = codeLocation.toExternalForm();
			java.io.File JSH_HOME = null;
			if (codeUrlString.startsWith("file:") && codeUrlString.endsWith("jsh.jar")) {
				//	Assume we loaded this from JSH_HOME
				if (codeUrlString.charAt(7) == ':') {
					//	Windows
					JSH_HOME = new java.io.File(codeUrlString.substring("file:/".length(), codeUrlString.length()-"jsh.jar".length()-1));
				} else {
					//	UNIX
					JSH_HOME = new java.io.File(codeUrlString.substring("file:".length(), codeUrlString.length()-"jsh.jar".length()-1));
				}
			}
			Invocation rv = (JSH_HOME != null) ? new Built(JSH_HOME) : new Unbuilt();
			rv.debug = (System.getenv("JSH_DEBUG") != null || System.getenv("JSH_LAUNCHER_DEBUG") != null);
			if (JSH_HOME != null) {
				rv.debug("JSH_HOME = " + JSH_HOME.getCanonicalPath());
			} else {
				rv.debug("JSH_HOME = null");
			}
			return rv;
		}

		private String colon = java.io.File.pathSeparator;

		private boolean debug;

		final void debug(String message) {
			if (debug) {
				System.err.println(message);
			}
		}

		final void initialize() throws java.io.IOException {
			if (getRhinoClasspath() != null) {
				System.setProperty("jsh.classpath.rhino", getRhinoClasspath());
			} else {
				throw new RuntimeException("No Rhino classpath in " + this
					+ ": JSH_RHINO_CLASSPATH is " + System.getenv("JSH_RHINO_CLASSPATH"))
				;
			}
		}

		abstract String getRhinoClasspath() throws java.io.IOException;

		final ClassLoader createClassLoader() throws java.io.IOException {
			Invocation invocation = this;
			ClassLoader loader;
			String JSH_RHINO_CLASSPATH = invocation.getRhinoClasspath();
			if (debug) System.err.println("Launcher: JSH_RHINO_CLASSPATH = " + JSH_RHINO_CLASSPATH);
			List<String> pathElements = new ArrayList<String>();
			pathElements.addAll(Arrays.asList(JSH_RHINO_CLASSPATH.split(colon)));
			java.net.URL[] urls = new java.net.URL[pathElements.size()];
			for (int i=0; i<pathElements.size(); i++) {
				if (debug) System.err.println("Path element = " + pathElements.get(i));
				try {
					urls[i] = new java.io.File(pathElements.get(i)).toURI().toURL();
				} catch (java.net.MalformedURLException e) {
				}
			}
			loader = new java.net.URLClassLoader(urls);
			return loader;
		}

		abstract String getRhinoScript() throws java.io.IOException;

		final void addScriptArguments(List<String> strings) throws java.io.IOException {
			String JSH_RHINO_JS = getRhinoScript();
			String RHINO_JS = null;
			if (JSH_RHINO_JS != null) {
				RHINO_JS = new java.io.File(new java.io.File(JSH_RHINO_JS).getParentFile(), "api.rhino.js").getCanonicalPath();
			}
			if (JSH_RHINO_JS == null || !new java.io.File(JSH_RHINO_JS).exists() || !new java.io.File(RHINO_JS).exists()) {
				throw new RuntimeException("Could not find jsh.rhino.js and api.rhino.js in " + this + ": JSH_RHINO_SCRIPT = "
					+ System.getenv("JSH_RHINO_SCRIPT")
				);
			}
			strings.add(RHINO_JS);
			strings.add(JSH_RHINO_JS);
		}

		final String getMainClassName() {
			return (debug) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
		}
	}

	private static class Built extends Invocation {
		private java.io.File HOME;
		private Unbuilt defaults = new Unbuilt();

		Built(java.io.File HOME) throws java.io.IOException {
			this.HOME = HOME;
			System.setProperty("jsh.home", HOME.getCanonicalPath());
		}

		String getRhinoClasspath() throws java.io.IOException {
			if (defaults.getRhinoClasspath() != null) return defaults.getRhinoClasspath();
			return new java.io.File(HOME, "lib/js.jar").getCanonicalPath();
		}

		String getRhinoScript() throws java.io.IOException {
			if (defaults.getRhinoScript() != null) return defaults.getRhinoScript();
			return new java.io.File(HOME, "script/launcher/jsh.rhino.js").getCanonicalPath();
		}
	}

	private static class Unbuilt extends Invocation {
		private String toCygwin(String flags, String value) {
			try {
				String rv = inonit.system.OperatingSystem.get().getCommandOutput(
					"cygpath",
					new String[] { flags, value }
				);
				//	Remove trailing newline
				rv = rv.substring(0,rv.length()-1);
				return rv;
			} catch (java.io.IOException e) {
				//	Must not be Cygwin
				return value;
			}
		}

		String getRhinoClasspath() {
			String rv = System.getenv("JSH_RHINO_CLASSPATH");
			if (rv == null) return null;
			return toCygwin("-wp", rv);
		}

		String getRhinoScript() {
			String rv = System.getenv("JSH_RHINO_SCRIPT");
			if (rv == null) return null;
			return rv;
		}
	}

	private void run(String[] args) throws java.io.IOException {
		Invocation invocation = Invocation.create();
		invocation.initialize();
		ClassLoader loader = invocation.createClassLoader();

		try {
			Class shell = loader.loadClass(invocation.getMainClassName());
			java.lang.reflect.Method main = shell.getMethod("main", new Class[] { String[].class });
			invocation.debug("Rhino shell main = " + main);
			List<String> arguments = new ArrayList();
			arguments.add("-opt");
			arguments.add("-1");
			arguments.add("-f");
			invocation.addScriptArguments(arguments);
			arguments.addAll(Arrays.asList(args));
			invocation.debug("Rhino shell arguments:");
			for (int i=0; i<arguments.size(); i++) {
				invocation.debug("Rhino shell argument = " + arguments.get(i));
			}
			main.invoke(null, new Object[] { arguments.toArray(new String[0]) });
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (NoSuchMethodException e) {
			e.printStackTrace();
		} catch (IllegalAccessException e) {
			e.printStackTrace();
		} catch (java.lang.reflect.InvocationTargetException e) {
			e.printStackTrace();
		} finally {
			//	Ensure the VM exits even if the debugger is displayed
			System.exit(0);
		}
	}

	public static void main(String[] args) throws java.io.IOException {
		new Main().run(args);
	}
}