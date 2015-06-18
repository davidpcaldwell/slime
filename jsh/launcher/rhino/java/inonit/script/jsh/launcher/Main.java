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
import java.net.*;
import java.util.*;
import java.util.logging.*;

import javax.script.*;

import inonit.system.*;
import inonit.system.cygwin.*;

public class Main {
	private Main() {
	}

	private static String getSetting(String name) {
		if (System.getProperty(name) != null) return System.getProperty(name);
		String environment = name.replace("\\.", "_").toUpperCase();
		if (System.getenv(environment) != null) return System.getenv(environment);
		return null;
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

		private static java.net.URI getMainClassSource() {
			try {
				return Main.class.getProtectionDomain().getCodeSource().getLocation().toURI();
			} catch (java.net.URISyntaxException e) {
				throw new RuntimeException(e);
			}
		}

		private static Shell shell(Configuration configuration) throws IOException {
			java.net.URI codeLocation = getMainClassSource();
			File launcherFile = null;
			if (codeLocation.getScheme().equals("file")) {
				launcherFile = new File(codeLocation);
			} else {
				throw new RuntimeException("Unreachable: code source = " + codeLocation);
			}
//			String codeUrlString = codeLocation.toExternalForm();
//			codeUrlString = new java.net.URLDecoder().decode(codeUrlString);
//			String launcherLocation = null;
//			if (codeUrlString.startsWith("file:")) {
//				if (codeUrlString.charAt(7) == ':') {
//					//	Windows
//					launcherLocation = codeUrlString.substring("file:/".length());
//				} else {
//					//	UNIX
//					launcherLocation = codeUrlString.substring("file:".length());
//				}
//			} else {
//			}
			Shell shell = null;
			if (ClassLoader.getSystemResource("main.jsh.js") != null) {
				shell = new PackagedShell(launcherFile);
			} else {
				java.io.File JSH_HOME = null;
				if (launcherFile.getName().equals("jsh.jar")) {
					JSH_HOME = launcherFile.getParentFile();
				}
				shell = (JSH_HOME != null) ? new BuiltShell(JSH_HOME) : UnbuiltShell.create(configuration.src(), configuration.rhino());
				//	TODO	This might miss some exotic situations, like loading this class in its own classloader
			}
			return shell;
		}

		static ArrayList<String> engines(Configuration configuration) throws IOException {
			ArrayList<String> rv = new ArrayList<String>();
			for (Map.Entry<String,Engine> entry : Engine.entries()) {
				if (entry.getValue().isInstalled(shell(configuration))) {
					rv.add(entry.getKey());
				}
			}
			return rv;
		}

		static Invocation create(Configuration configuration) throws IOException {
			return new Invocation(shell(configuration), configuration.engine(), configuration.debug());
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
			System.setProperty("inonit.jrunscript.api.passive", "true");
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
		abstract void initializeSystemProperties() throws IOException;

		final void addLauncherScriptsTo(Engine engine) throws IOException {
			engine.addScript(getJrunscriptApi());
			engine.addScript(getLauncherApi());
			engine.addScript(getLauncherScript());
		}

		abstract URL getJrunscriptApi() throws IOException;
		final URL getLauncherApi() throws IOException {
			try {
				return new URL(getLauncherScript(), "slime.js");
			} catch (MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}
		abstract URL getLauncherScript() throws IOException;
	}

	private static class PackagedShell extends Shell {
		private File file;

		PackagedShell(File file) {
			this.file = file;
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

		@Override URL getJrunscriptApi() throws IOException {
			return ClassLoader.getSystemResource("$jsh/launcher/jsh.js");
		}

		@Override URL getLauncherScript() throws IOException {
			return ClassLoader.getSystemResource("$jsh/launcher/launcher.js");
		}

		void initializeSystemProperties() {
			try {
				System.setProperty("jsh.launcher.packaged", file.getCanonicalPath());
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
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

		//	TODO	push Rhino-specific properties back into Rhino engine
		final void initializeSystemProperties() throws java.io.IOException {
			//	TODO	is the below property used?
			System.setProperty("jsh.launcher.rhino.script", getLauncherScript().toExternalForm());
			if (getJshHome() != null) {
				System.setProperty("jsh.home", getJshHome().getCanonicalPath());
			}
			System.setProperty("jsh.launcher.classpath", System.getProperty("java.class.path"));
		}

		abstract String getRhinoClasspath() throws IOException;
		abstract File getJshHome();
	}

	private static class UnbuiltShell extends UnpackagedShell {
		static UnbuiltShell create(String src, String rhino) {
			File sourceroot = new File(src);
			return new UnbuiltShell(sourceroot,rhino);
		}

		private File sourceroot;
		private String rhinoClasspath;

		UnbuiltShell(File sourceroot, String rhinoClasspath) {
			this.sourceroot = sourceroot;
			this.rhinoClasspath = rhinoClasspath;
		}

		public String toString() {
			return "Unbuilt: sourceroot=" + sourceroot + " rhino=" + rhinoClasspath;
		}

		private String toWindowsPath(String value) throws IOException {
			if (value == null) return null;
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
			return toWindowsPath(rhinoClasspath);
		}

		URL getJrunscriptApi() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "rhino/jrunscript/api.js").getCanonicalFile().toURI().toURL();
		}

		URL getLauncherScript() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "jsh/launcher/rhino/launcher.js").getCanonicalFile().toURI().toURL();
		}
	}

	private static class BuiltShell extends UnpackagedShell {
		private java.io.File HOME;

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
			return new java.io.File(HOME, "lib/js.jar").getCanonicalPath();
		}

		URL getJrunscriptApi() throws java.io.IOException {
			return new java.io.File(HOME, "jsh.js").getCanonicalFile().toURI().toURL();
		}

		URL getLauncherScript() throws java.io.IOException {
			return new java.io.File(HOME, "launcher.js").getCanonicalFile().toURI().toURL();
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

	private void run(Configuration configuration, String[] args) throws IOException {
		BeforeExit beforeExit = new BeforeExit();
		Thread beforeExitThread = new Thread(beforeExit);
		beforeExitThread.setName("BeforeExit");
		Runtime.getRuntime().addShutdownHook(beforeExitThread);
		Invocation invocation = Invocation.create(configuration);
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
			//	Ensure the VM exits even if the Rhino debugger is displayed
			if (status != null) {
				System.exit(status.intValue());
			}
		}
	}

	private static abstract class Configuration {
		abstract boolean debug();
		abstract String engine();
		abstract String src();
		abstract String rhino();
	}

	public static void main(String[] args) throws java.io.IOException {
		Main main = new Main();
		Configuration configuration = new Configuration() {
			boolean debug() {
				return getSetting("jsh.launcher.debug") != null;
			}

			String engine() {
				return getSetting("jsh.engine");
			}

			String src() {
				return getSetting("jsh.slime.src");
			}

			String rhino() {
				return getSetting("jsh.rhino.classpath");
			}
		};
		if (args.length == 1 && args[0].equals("-engines")) {
			List<String> engines = Invocation.engines(configuration);
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
			main.run(
				configuration,
				args
			);
		}
	}
}