//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh.launcher;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.system.cygwin.*;

public class Main {
	private Main() {
	}

	private static abstract class Invocation {
		static Invocation create() throws IOException {
			java.net.URL codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation();
			String codeUrlString = codeLocation.toExternalForm();
			String launcherLocation = null;
			if (codeUrlString.startsWith("file:")) {
				if (codeUrlString.charAt(7) == ':') {
					//	Windows
					launcherLocation = codeUrlString.substring("file:/".length());
				} else {
					//	UNIX
					launcherLocation = codeUrlString.substring("file:".length());
				}
			} else {
				throw new RuntimeException("Unreachable: code source = " + codeUrlString);
			}
			Invocation rv = null;
			if (ClassLoader.getSystemResource("main.jsh.js") != null) {
				rv = new Packaged(launcherLocation);
			} else {
				java.io.File JSH_HOME = null;
				if (launcherLocation.endsWith("jsh.jar")) {
					JSH_HOME = new java.io.File(launcherLocation.substring(0, launcherLocation.length()-"jsh.jar".length()-1));
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

		final Properties getJavaLoggingProperties() throws IOException {
			Properties rv = new Properties();
			return rv;
		}
		abstract void initializeSystemProperties() throws IOException;

		abstract ClassLoader getMainClassLoader() throws IOException;

		final int getRhinoShellExitStatus() throws IOException, ClassNotFoundException, IllegalAccessException, NoSuchFieldException {
			Class c = getMainClassLoader().loadClass("org.mozilla.javascript.tools.shell.Main");
			java.lang.reflect.Field field = c.getDeclaredField("exitCode");
			field.setAccessible(true);
			return field.getInt(null);
		}

		final java.lang.reflect.Method getMainMethod() throws IOException, ClassNotFoundException, NoSuchMethodException {
			ClassLoader loader = getMainClassLoader();
			String mainClassName = (debug) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			Class shell = loader.loadClass(mainClassName);
			String mainMethodName = (debug) ? "main" : "exec";
			java.lang.reflect.Method main = shell.getMethod(mainMethodName, new Class[] { String[].class });
			return main;
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
		private String location;

		Packaged(String location) {
			this.location = location;
		}

		void initializeSystemProperties() {
			System.setProperty("jsh.launcher.packaged", location);
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
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(invocation.getJavaLoggingProperties());
		}
		Logging.get().log(Main.class, Level.INFO, "Launching script: %s", Arrays.asList(args));
		Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
		System.setIn(new Logging.InputStream(System.in));
		System.setOut(new PrintStream(new Logging.OutputStream(System.out, "stdout")));
		System.setErr(new PrintStream(new Logging.OutputStream(System.err, "stderr")));
		Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
		invocation.initializeSystemProperties();
		Integer status = null;
		try {
			java.lang.reflect.Method main = invocation.getMainMethod();
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
			Logging.get().log(Main.class, Level.INFO, "Entering Rhino shell");
			main.invoke(null, new Object[] { arguments.toArray(new String[0]) });
			status = new Integer(invocation.getRhinoShellExitStatus());
			Logging.get().log(Main.class, Level.INFO, "Exited Rhino shell with status: %s", status);
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
			status = new Integer(127);
		} catch (NoSuchMethodException e) {
			e.printStackTrace();
			status = new Integer(127);
		} catch (NoSuchFieldException e) {
			e.printStackTrace();
			status = new Integer(127);
		} catch (IllegalAccessException e) {
			e.printStackTrace();
			status = new Integer(127);
		} catch (java.lang.reflect.InvocationTargetException e) {
			e.printStackTrace();
			status = new Integer(127);
		} finally {
			//	Ensure the VM exits even if the debugger is displayed
			System.out.flush();
			Logging.get().log(Main.class, Level.INFO, "Exit status: %d", status);
			System.err.flush();
			System.exit(status.intValue());
		}
	}

	public static void main(String[] args) throws java.io.IOException {
		new Main().run(args);
	}
}