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

import javax.script.*;

import inonit.system.*;
import inonit.system.cygwin.*;

public class Main {
	private Main() {
	}

	static class Invocation {
		//	TODO	this logic is duplicated in Servlet
		private static Engine getSpecified(Shell shell, String JSH_ENGINE) {
			Engine specified = Engine.get(JSH_ENGINE);
			if (specified != null && specified.isInstalled(shell)) {
				return specified;
			}
			return null;
		}

		private static Engine getEngine(Shell shell, String JSH_ENGINE) {
			if (JSH_ENGINE != null) {
				Engine specified = getSpecified(shell, JSH_ENGINE);
				if (specified != null) {
					return specified;
				}
			}
			Engine[] preferenceOrder = new Engine[] { Engine.get("rhino"), Engine.get("nashorn") };
			for (Engine e : preferenceOrder) {
				if (e == null) {
					throw new RuntimeException("preferenceOrder[0] = " + preferenceOrder[0] + " preferenceOrder[1] = " + preferenceOrder[1]);
				}
				if (e.isInstalled(shell)) return e;
			}
			throw new RuntimeException("No JavaScript execution engine found.");
		}

		static Shell shell() throws IOException {
			java.net.URL codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation();
			String codeUrlString = codeLocation.toExternalForm();
			codeUrlString = new java.net.URLDecoder().decode(codeUrlString);
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
			Shell shell = null;
			if (ClassLoader.getSystemResource("main.jsh.js") != null) {
				shell = new PackagedShell(launcherLocation);
			} else {
				java.io.File JSH_HOME = null;
				if (launcherLocation.endsWith("jsh.jar")) {
					JSH_HOME = new java.io.File(launcherLocation.substring(0, launcherLocation.length()-"jsh.jar".length()-1));
				}
				shell = (JSH_HOME != null) ? new BuiltShell(JSH_HOME) : new UnbuiltShell();
				//	TODO	This might miss some exotic situations, like loading this class in its own classloader
			}
			return shell;
		}

		static ArrayList<String> engines() throws IOException {
			Shell shell = shell();
			ArrayList<String> rv = new ArrayList<String>();
			for (Map.Entry<String,Engine> entry : Engine.entries()) {
				if (entry.getValue().isInstalled(shell)) {
					rv.add(entry.getKey());
				}
			}
			return rv;
		}

		static Invocation create() throws IOException {
			boolean debug = (System.getenv("JSH_LAUNCHER_DEBUG") != null);
			return new Invocation(shell(), System.getenv("JSH_ENGINE"), debug);
		}

		private Shell shell;
		private Engine engine;
		private boolean debug;

		Invocation(Shell shell, String engine, boolean debug) {
			this.debug = debug;
			this.debug("Invoking: " + shell + " with engine named " + engine);
			this.shell = shell;
			this.engine = getEngine(shell, engine);
			this.debug("Using engine: " + this.engine);
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
			debug("Initializing system properties; engine = " + engine + " ...");
			engine.initializeSystemProperties(this, shell);
			shell.initializeSystemProperties();
		}

		final ClassLoader getRhinoClassLoader() throws IOException {
			return shell.getRhinoClassLoader();
		}

		final void addLauncherScriptsTo(Engine engine) throws IOException {
			shell.addLauncherScriptsTo(engine);
		}

		final Integer run(String[] args) throws IOException, ScriptException {
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
			Logging.get().log(Main.class, Level.FINER, "Engine: %s", this.engine);
			Engine engine = this.engine;
			engine.initialize(this);
			return engine.run(args);
		}

		private ClassLoader mainClassLoader;

		final ClassLoader getMainClassLoader() throws IOException {
			if (mainClassLoader == null) {
				mainClassLoader = shell.getRhinoClassLoader();
			}
			return mainClassLoader;
		}
	}

	static abstract class Shell {
		abstract String getRhinoClasspath() throws IOException;
		abstract ClassLoader getRhinoClassLoader() throws IOException;
		abstract void addLauncherScriptsTo(Engine rhino) throws IOException;
		abstract void initializeSystemProperties() throws IOException;
	}

	private static class PackagedShell extends Shell {
		private String location;

		PackagedShell(String location) {
			this.location = location;
		}

		String getRhinoClasspath() {
			//	TODO	should we return something more useful?
			return null;
		}

		ClassLoader getRhinoClassLoader() {
			//	In earlier versions of the launcher and packager, Rhino was packaged at the following location inside the packaged
			//	JAR file. However, for some reason, loading Rhino using the below ClassLoader did not work. As a workaround, the
			//	packager now unzips Rhino and we simply load it from the system class loader.
			try {
				Class.forName("org.mozilla.javascript.Context");
				return ClassLoader.getSystemClassLoader();
			} catch (ClassNotFoundException e) {
				if (ClassLoader.getSystemResource("$jsh/rhino.jar") != null) {
					return new java.net.URLClassLoader(new java.net.URL[] { ClassLoader.getSystemResource("$jsh/rhino.jar") });
				} else {
					return new java.net.URLClassLoader(new java.net.URL[] {});
				}
			}
		}

		void addLauncherScriptsTo(Engine rhino) {
			rhino.addScript(ClassLoader.getSystemResource("$jsh/api.jrunscript.js").toExternalForm());
			rhino.addScript(ClassLoader.getSystemResource("$jsh/slime.api.jrunscript.js").toExternalForm());
			rhino.addScript(ClassLoader.getSystemResource("$jsh/jsh.rhino.js").toExternalForm());
		}

		void initializeSystemProperties() {
			System.setProperty("inonit.jrunscript.api.passive", "true");
			System.setProperty("jsh.launcher.packaged", location);
		}
	}

	private static abstract class UnpackagedShell extends Shell {
		private String colon = java.io.File.pathSeparator;
		private ClassLoader rhinoClassLoader;

		final ClassLoader getRhinoClassLoader() throws IOException {
			if (rhinoClassLoader == null) {
				String JSH_RHINO_CLASSPATH = getRhinoClasspath();
				if (JSH_RHINO_CLASSPATH == null) {
					rhinoClassLoader = new java.net.URLClassLoader(new java.net.URL[0]);
				} else {
					List<String> pathElements = new ArrayList<String>();
					pathElements.addAll(Arrays.asList(JSH_RHINO_CLASSPATH.split(colon)));
					java.net.URL[] urls = new java.net.URL[pathElements.size()];
					for (int i=0; i<pathElements.size(); i++) {
						try {
							urls[i] = new java.io.File(pathElements.get(i)).toURI().toURL();
						} catch (java.net.MalformedURLException e) {
						}
					}
					rhinoClassLoader = new java.net.URLClassLoader(urls);
				}
			}
			return rhinoClassLoader;
		}

		final void addLauncherScriptsTo(Engine rhino) throws IOException {
			//	TODO	allowed to be null for now, while migration occurs
			if (getJrunscriptApi() != null) {
				rhino.addScript(getJrunscriptApi());
			}
			rhino.addScript(getLauncherApi());
			rhino.addScript(getLauncherScript());
		}

		//	TODO	push Rhino-specific properties back into Rhino engine
		final void initializeSystemProperties() throws java.io.IOException {
			if (getJrunscriptApi() != null) {
				System.setProperty("inonit.jrunscript.api.passive", "true");
			}
			System.setProperty("jsh.launcher.rhino.script", getLauncherScript());
			if (getJshHome() != null) {
				System.setProperty("jsh.launcher.home", getJshHome().getCanonicalPath());
			}
			System.setProperty("jsh.launcher.classpath", System.getProperty("java.class.path"));
		}

		abstract String getRhinoClasspath() throws IOException;
		abstract File getJshHome();
		abstract String getJrunscriptApi() throws IOException;
		abstract String getLauncherApi() throws IOException;
		abstract String getLauncherScript() throws IOException;
	}

	private static class UnbuiltShell extends UnpackagedShell {
		private File getSlimeSourceroot() {
			if (System.getenv("JSH_SLIME_SRC") == null) return null;
			return new File(System.getenv("JSH_SLIME_SRC"));
		}

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

		String getJrunscriptApi() throws IOException {
			if (getSlimeSourceroot() == null) return null;
			return new File(getSlimeSourceroot(), "rhino/jrunscript/api.js").getCanonicalPath();
		}

		String getLauncherApi() throws IOException {
			if (getSlimeSourceroot() == null) return null;
			return new File(getSlimeSourceroot(), "jsh/etc/api.rhino.js").getCanonicalPath();
		}

		String getLauncherScript() throws IOException {
			if (getSlimeSourceroot() == null) return null;
			return new File(getSlimeSourceroot(), "jsh/launcher/rhino/jsh.rhino.js").getCanonicalPath();
		}
	}

	private static class BuiltShell extends UnpackagedShell {
		private java.io.File HOME;
		private UnbuiltShell explicit = new UnbuiltShell();

		BuiltShell(java.io.File HOME) throws java.io.IOException {
			this.HOME = HOME;
		}

		public String toString() {
			return "BuiltShell: HOME=" + HOME;
		}

		File getJshHome() {
			return HOME;
		}

		String getRhinoClasspath() throws java.io.IOException {
			if (explicit.getRhinoClasspath() != null) return explicit.getRhinoClasspath();
			return new java.io.File(HOME, "lib/js.jar").getCanonicalPath();
		}

		String getJrunscriptApi() throws java.io.IOException {
			return new java.io.File(HOME, "script/launcher/api.jrunscript.js").getCanonicalPath();
		}

		String getLauncherApi() throws java.io.IOException {
			if (explicit.getLauncherApi() != null) return explicit.getLauncherApi();
			return new java.io.File(HOME, "script/launcher/slime.api.jrunscript.js").getCanonicalPath();
		}

		String getLauncherScript() throws java.io.IOException {
			if (explicit.getLauncherScript() != null) return explicit.getLauncherScript();
			return new java.io.File(HOME, "script/launcher/jsh.rhino.js").getCanonicalPath();
		}
	}

	private static class BeforeExit implements Runnable {
		private Integer status = null;

		void setStatus(Integer status) {
			this.status = status;
		}

		public void run() {
			System.out.flush();
			Logging.get().log(Main.class, Level.INFO, "Exit status: %s", String.valueOf(status));
			System.err.flush();
		}
	}

	private void run(String[] args) throws IOException {
		BeforeExit beforeExit = new BeforeExit();
		Thread beforeExitThread = new Thread(beforeExit);
		beforeExitThread.setName("BeforeExit");
		Runtime.getRuntime().addShutdownHook(beforeExitThread);
		Invocation invocation = Invocation.create();
		Integer status = null;
		try {
			status = invocation.run(args);
			Logging.get().log(Main.class, Level.FINER, "Completed with status: %d", status);
		} catch (Throwable t) {
			t.printStackTrace();
			status = new Integer(127);
			Logging.get().log(Main.class, Level.FINER, "Completed with stack trace.");
		} finally {
			beforeExit.setStatus(status);
			//	Ensure the VM exits even if the debugger is displayed
			if (status != null) {
				System.exit(status.intValue());
			}
		}
	}

	public static void main(String[] args) throws java.io.IOException {
		Main main = new Main();
		if (args.length == 1 && args[0].equals("-engines")) {
			List<String> engines = Invocation.engines();
			System.out.print("[");
			for (int i=0; i<engines.size(); i++) {
				if (i > 0) {
					System.out.print(",");
				}
				System.out.print("\"" + engines.get(i) + "\"");
			}
			System.out.print("]");
		} else {
			Logging.get().log(Main.class, Level.FINEST, "Launcher Main executing ...");
			main.run(args);
		}
	}
}