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

import java.io.*;
import java.util.*;

import inonit.system.cygwin.*;

public class Main {
	private Main() {
	}

	private static abstract class Invocation {
		static Invocation create() throws IOException {
			Invocation rv = null;
			if (ClassLoader.getSystemResource("main.jsh.js") != null) {
				rv = new Packaged();
			} else {
				java.net.URL codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation();
				String codeUrlString = codeLocation.toExternalForm();
				java.io.File JSH_HOME = null;
				if (codeUrlString.startsWith("file:")) {
					String launcherLocation = null;
					if (codeUrlString.charAt(7) == ':') {
						//	Windows
						launcherLocation = codeUrlString.substring("file:/".length());
					} else {
						//	UNIX
						launcherLocation = codeUrlString.substring("file:".length());
					}
					if (launcherLocation.endsWith("jsh.jar")) {
						JSH_HOME = new java.io.File(launcherLocation.substring(0, launcherLocation.length()-"jsh.jar".length()-1));
					}
				} else {
					throw new RuntimeException("Unreachable: code source = " + codeUrlString);
				}
				FileInvocation frv = (JSH_HOME != null) ? new Built(JSH_HOME) : new Unbuilt();
			//	TODO	This might miss some exotic situations, like loading this class in its own classloader
				frv.setLauncherClasspath(System.getProperty("java.class.path"));
				if (JSH_HOME != null) {
					frv.debug("JSH_HOME = " + JSH_HOME.getCanonicalPath());
				} else {
					frv.debug("JSH_HOME = null");
				}
				rv = frv;
			}
			((Invocation)rv).debug = (System.getenv("JSH_LAUNCHER_DEBUG") != null);
			return rv;
		}

		private boolean debug;

		abstract void initializeSystemProperties() throws IOException;

		abstract ClassLoader getMainClassLoader() throws IOException;

		final Class getMainClass() throws IOException, ClassNotFoundException {
			ClassLoader loader = getMainClassLoader();
			String mainClassName = (debug) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			return loader.loadClass(mainClassName);
		}

		abstract void addScriptArguments(List<String> strings) throws IOException;

		final void debug(String message) {
			if (debug) {
				System.err.println(message);
			}
		}
	}

	private static abstract class FileInvocation extends Invocation {
		private String colon = java.io.File.pathSeparator;
		private String launcherClasspath;

		final void setLauncherClasspath(String launcherClasspath) {
			this.launcherClasspath = launcherClasspath;
		}

		final void initializeSystemProperties() throws java.io.IOException {
			if (getRhinoClasspath() != null) {
				System.setProperty("jsh.launcher.rhino.classpath", getRhinoClasspath());
			} else {
				throw new RuntimeException("No Rhino classpath in " + this
					+ ": JSH_RHINO_CLASSPATH is " + System.getenv("JSH_RHINO_CLASSPATH"))
				;
			}
			ArrayList<String> dummy = new ArrayList<String>();
			addScriptArguments(dummy);
			System.setProperty("jsh.launcher.rhino.script", dummy.get(2));
			if (getJshHome() != null) {
				System.setProperty("jsh.launcher.home", getJshHome().getCanonicalPath());
			}
			System.setProperty("jsh.launcher.classpath", launcherClasspath);
		}

		abstract File getJshHome() throws java.io.IOException;

		abstract String getRhinoClasspath() throws java.io.IOException;

		final ClassLoader getMainClassLoader() throws IOException {
			FileInvocation invocation = this;
			String JSH_RHINO_CLASSPATH = invocation.getRhinoClasspath();
			debug("Launcher: JSH_RHINO_CLASSPATH = " + JSH_RHINO_CLASSPATH);
			List<String> pathElements = new ArrayList<String>();
			pathElements.addAll(Arrays.asList(JSH_RHINO_CLASSPATH.split(colon)));
			java.net.URL[] urls = new java.net.URL[pathElements.size()];
			for (int i=0; i<pathElements.size(); i++) {
				debug("Path element = " + pathElements.get(i));
				try {
					urls[i] = new java.io.File(pathElements.get(i)).toURI().toURL();
				} catch (java.net.MalformedURLException e) {
				}
			}
			return new java.net.URLClassLoader(urls);
		}

		abstract String getRhinoScript() throws java.io.IOException;

		final void addScriptArguments(List<String> strings) throws IOException {
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
			strings.add("-f");
			strings.add(RHINO_JS);
			strings.add(JSH_RHINO_JS);
		}
	}

	private static class Packaged extends Invocation {
		void initializeSystemProperties() {
			System.setProperty("jsh.launcher.packaged", "true");
		}

		ClassLoader getMainClassLoader() {
			//	In earlier versions of the launcher and packager, Rhino was packaged at the following location inside the packaged
			//	JAR file. However, for some reason, loading Rhino using the below ClassLoader did not work. As a workaround, the
			//	packager now unzips Rhino and we simply load it from the system class loader.
			try {
				Class.forName("org.mozilla.javascript.Context");
				return ClassLoader.getSystemClassLoader();
			} catch (ClassNotFoundException e) {
				return new java.net.URLClassLoader(new java.net.URL[] { ClassLoader.getSystemResource("$jsh/rhino.jar") });
			}
		}

		void addScriptArguments(List<String> strings) {
			strings.add("-f");
			strings.add(ClassLoader.getSystemResource("$jsh/api.rhino.js").toExternalForm());
			strings.add(ClassLoader.getSystemResource("$jsh/jsh.rhino.js").toExternalForm());
		}
	}

	private static class Built extends FileInvocation {
		private java.io.File HOME;
		private Unbuilt explicit = new Unbuilt();

		Built(java.io.File HOME) throws java.io.IOException {
			this.HOME = HOME;
		}

		File getJshHome() {
			return HOME;
		}

		String getRhinoClasspath() throws java.io.IOException {
			if (explicit.getRhinoClasspath() != null) return explicit.getRhinoClasspath();
			return new java.io.File(HOME, "lib/js.jar").getCanonicalPath();
		}

		String getRhinoScript() throws java.io.IOException {
			if (explicit.getRhinoScript() != null) return explicit.getRhinoScript();
			return new java.io.File(HOME, "script/launcher/jsh.rhino.js").getCanonicalPath();
		}
	}

	private static class Unbuilt extends FileInvocation {
		private String toWindowsPath(String value) throws IOException {
			inonit.system.cygwin.Cygwin cygwin = inonit.system.cygwin.Cygwin.locate();
			if (cygwin != null) {
				try {
					return cygwin.toWindowsPath(value,true);
				} catch (Cygwin.CygpathException e) {
					throw new IOException(e);
				}
			} else {
				return value;
			}
		}

		File getJshHome() {
			return null;
		}

		String getRhinoClasspath() throws IOException {
			String rv = System.getenv("JSH_RHINO_CLASSPATH");
			if (rv == null) return null;
			return toWindowsPath(rv);
		}

		String getRhinoScript() {
			String rv = System.getenv("JSH_RHINO_SCRIPT");
			if (rv == null) return null;
			return rv;
		}
	}

	private void run(String[] args) throws java.io.IOException {
		Invocation invocation = Invocation.create();
		invocation.initializeSystemProperties();
		try {
			Class shell = invocation.getMainClass();
			java.lang.reflect.Method main = shell.getMethod("main", new Class[] { String[].class });
			invocation.debug("Rhino shell main = " + main);
			List<String> arguments = new ArrayList();
			arguments.add("-opt");
			arguments.add("-1");
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