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
	
	private static class Invocation {
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
				rv = new Invocation(new PackagedShell(launcherLocation));
			} else {
				java.io.File JSH_HOME = null;
				if (launcherLocation.endsWith("jsh.jar")) {
					JSH_HOME = new java.io.File(launcherLocation.substring(0, launcherLocation.length()-"jsh.jar".length()-1));
				}
				Shell shell = (JSH_HOME != null) ? new BuiltShell(JSH_HOME) : new UnbuiltShell();
				//	TODO	This might miss some exotic situations, like loading this class in its own classloader
				Invocation frv = new Invocation(shell);
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

		private Engine engine = new Rhino();
		private Shell shell;
		private boolean debug;
		
		Invocation(Shell shell) {
			this.shell = shell;
		}
		
		final boolean debug() {
			return debug;
		}
		
		final void debug(String message) {
			if (debug) {
				System.err.println(message);
			}
		}
		
		final Properties getJavaLoggingProperties() throws IOException {
			Properties rv = new Properties();
			return rv;
		}
		
		final void initializeSystemProperties() throws IOException {
			shell.initializeSystemProperties();
		}
		
		final ClassLoader getRhinoClassLoader() throws IOException {
			return shell.getRhinoClassLoader(this);
		}
		
		final void addLauncherScriptsTo(Engine engine) throws IOException {
			shell.addLauncherScriptsTo(engine);
		}
		
		final int run(String[] args) throws IOException {
			if (!inonit.system.Logging.get().isSpecified()) {
				inonit.system.Logging.get().initialize(this.getJavaLoggingProperties());
			}
			Logging.get().log(Main.class, Level.INFO, "Launching script: %s", Arrays.asList(args));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			Logging.get().log(Main.class, Level.FINEST, "System.in = %s", System.in);
			InputStream stdin = new Logging.InputStream(System.in);
			System.setIn(stdin);
			Logging.get().log(Main.class, Level.CONFIG, "Set System.in to %s.", stdin);
			System.setOut(new PrintStream(new Logging.OutputStream(System.out, "stdout")));
			System.setErr(new PrintStream(new Logging.OutputStream(System.err, "stderr")));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			this.initializeSystemProperties();
			Engine rhino = this.engine;
			rhino.initialize(this);
			return rhino.run(args);
		}

		private ClassLoader mainClassLoader;

		final ClassLoader getMainClassLoader() throws IOException {
			if (mainClassLoader == null) {
				mainClassLoader = shell.getRhinoClassLoader(this);
			}
			return mainClassLoader;
		}
	}
	
	private static abstract class Engine {
		abstract void initialize(Invocation invocation) throws IOException;
		abstract void addScript(String pathname);
		abstract int run(String[] args) throws IOException;
	}
	
	private static class Nashorn extends Engine {
		void initialize(Invocation invocation) {
		}
		
		void addScript(String pathname) {
		}
		
		int run(String[] args) {
			throw new UnsupportedOperationException();
		}
	}
	
	private static class Rhino extends Engine {
		private Invocation invocation;
		private ArrayList<String> scripts = new ArrayList<String>();
		
		void initialize(Invocation invocation) throws IOException {
			this.invocation = invocation;
		}
		
		private java.lang.reflect.Method getMainMethod() throws IOException, ClassNotFoundException, NoSuchMethodException {
			ClassLoader loader = invocation.getRhinoClassLoader();
			String mainClassName = (invocation.debug()) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			Class shell = loader.loadClass(mainClassName);
			String mainMethodName = (invocation.debug()) ? "main" : "exec";
			java.lang.reflect.Method main = shell.getMethod(mainMethodName, new Class[] { String[].class });
			return main;
		}
		
		void addScript(String pathname) {
			scripts.add(pathname);
		}
		
		private String[] getArguments(String[] args) {
			ArrayList<String> strings = new ArrayList<String>();
			strings.add("-opt");
			strings.add("-1");
			for (int i=0; i<scripts.size(); i++) {
				if (i != scripts.size()-1) {
					strings.add("-f");
				}
				strings.add(scripts.get(i));
			}
			strings.addAll(Arrays.asList(args));
			return strings.toArray(new String[0]);
		}
		
		private int getExitStatus() throws IOException, ClassNotFoundException, NoSuchFieldException, IllegalAccessException {
			Class c = invocation.getRhinoClassLoader().loadClass("org.mozilla.javascript.tools.shell.Main");
			java.lang.reflect.Field field = c.getDeclaredField("exitCode");
			field.setAccessible(true);
			return field.getInt(null);			
		}
		
		@Override int run(String[] args) throws IOException {
			Integer status = null;
			try {
				java.lang.reflect.Method main = this.getMainMethod();
				invocation.debug("Rhino shell main = " + main);
				invocation.addLauncherScriptsTo(this);
				String[] arguments = this.getArguments(args);
				invocation.debug("Rhino shell arguments:");
				for (int i=0; i<arguments.length; i++) {
					invocation.debug("Rhino shell argument = " + arguments[i]);
				}
				Logging.get().log(Main.class, Level.INFO, "Entering Rhino shell");
				main.invoke(null, new Object[] { arguments });
				status = new Integer(this.getExitStatus());
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
			}
			return status.intValue();			
		}
	}
	
	private static abstract class Shell {
		abstract ClassLoader getRhinoClassLoader(Invocation invocation) throws IOException;
		abstract void addLauncherScriptsTo(Engine rhino) throws IOException;
		abstract void initializeSystemProperties() throws IOException;
	}
	
	private static class PackagedShell extends Shell {
		private String location;
		
		PackagedShell(String location) {
			this.location = location;
		}
		
		ClassLoader getRhinoClassLoader(Invocation invocation) {
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

		void addLauncherScriptsTo(Engine rhino) {
			rhino.addScript(ClassLoader.getSystemResource("$jsh/api.rhino.js").toExternalForm());
			rhino.addScript(ClassLoader.getSystemResource("$jsh/jsh.rhino.js").toExternalForm());
		}
		
		void initializeSystemProperties() {
			System.setProperty("jsh.launcher.packaged", location);			
		}
	}
	
	private static abstract class UnpackagedShell extends Shell {
		private String colon = java.io.File.pathSeparator;
		
		final ClassLoader getRhinoClassLoader(Invocation invocation) throws IOException {
			String JSH_RHINO_CLASSPATH = getRhinoClasspath();
			invocation.debug("Launcher: JSH_RHINO_CLASSPATH = " + JSH_RHINO_CLASSPATH);
			List<String> pathElements = new ArrayList<String>();
			pathElements.addAll(Arrays.asList(JSH_RHINO_CLASSPATH.split(colon)));
			java.net.URL[] urls = new java.net.URL[pathElements.size()];
			for (int i=0; i<pathElements.size(); i++) {
				invocation.debug("Path element = " + pathElements.get(i));
				try {
					urls[i] = new java.io.File(pathElements.get(i)).toURI().toURL();
				} catch (java.net.MalformedURLException e) {
				}
			}
			return new java.net.URLClassLoader(urls);
		}
		
		final void addLauncherScriptsTo(Engine rhino) throws IOException {
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
			rhino.addScript(RHINO_JS);
			rhino.addScript(JSH_RHINO_JS);
		}
		
		final void initializeSystemProperties() throws java.io.IOException {
			if (getRhinoClasspath() != null) {
				System.setProperty("jsh.launcher.rhino.classpath", getRhinoClasspath());
			} else {
				throw new RuntimeException("No Rhino classpath in " + this
					+ ": JSH_RHINO_CLASSPATH is " + System.getenv("JSH_RHINO_CLASSPATH"))
				;
			}
			System.setProperty("jsh.launcher.rhino.script", getRhinoScript());
			if (getJshHome() != null) {
				System.setProperty("jsh.launcher.home", getJshHome().getCanonicalPath());
			}
			System.setProperty("jsh.launcher.classpath", System.getProperty("java.class.path"));
		}
		
		abstract String getRhinoClasspath() throws IOException;		
		abstract File getJshHome();
		abstract String getRhinoScript() throws IOException;
	}
	
	private static class UnbuiltShell extends UnpackagedShell {
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
	
	private static class BuiltShell extends UnpackagedShell {
		private java.io.File HOME;
		private UnbuiltShell explicit = new UnbuiltShell();

		BuiltShell(java.io.File HOME) throws java.io.IOException {
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

	private void run(String[] args) throws java.io.IOException {
		Invocation invocation = Invocation.create();
		Integer status = null;
		try {
			status = invocation.run(args);
		} catch (Throwable t) {
			t.printStackTrace();
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