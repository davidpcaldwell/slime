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
		private static Engine getEngine(Configuration configuration, Shell shell, String JSH_ENGINE) throws IOException {
			Map<String,Engine> engines = configuration.engines(shell);
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
			Shell shell = shell(configuration);
			Set<Map.Entry<String,Engine>> entries = configuration.engines(shell).entrySet();
			ArrayList<String> rv = new ArrayList<String>();
			for (Map.Entry<String,Engine> entry : entries) {
				rv.add(entry.getKey());
			}
			return rv;
		}

		static Invocation create(Configuration configuration) throws IOException {
			Shell shell = shell(configuration);
			Engine engine = getEngine(configuration, shell, configuration.engine());
			return new Invocation(shell, engine);
		}

		private Shell shell;
		private Engine engine;

		Invocation(Shell shell, Engine engine) {
			Logging.get().log(Main.class, Level.CONFIG, "Invoking: " + shell + " with engine named " + engine.id());
			this.shell = shell;
			this.engine = engine;
			Logging.get().log(Main.class, Level.FINE, "Using engine: " + this.engine);
		}

		private Properties getDefaultJavaLoggingProperties() throws IOException {
			Properties rv = new Properties();
			return rv;
		}

		final Integer run(String[] arguments) throws IOException, ScriptException {
			if (!inonit.system.Logging.get().isSpecified()) {
				inonit.system.Logging.get().initialize(this.getDefaultJavaLoggingProperties());
			}
			Logging.get().log(Main.class, Level.INFO, "Launching script: %s", Arrays.asList(arguments));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			Logging.get().log(Main.class, Level.FINEST, "System.in = %s", System.in);
			InputStream stdin = new Logging.InputStream(System.in);
			System.setIn(stdin);
			Logging.get().log(Main.class, Level.CONFIG, "Set System.in to %s.", stdin);
			System.setOut(new PrintStream(new Logging.OutputStream(System.out, "stdout")));
			System.setErr(new PrintStream(new Logging.OutputStream(System.err, "stderr")));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			Logging.get().log(Main.class, Level.FINER, "Initializing system properties; engine = " + engine + " ...");
			Logging.get().log(Main.class, Level.FINER, "Engine: %s", this.engine);
			System.setProperty("inonit.jrunscript.api.main", shell.getLauncherScript().toExternalForm());
			System.setProperty("jsh.launcher.engine", engine.id());
			//	TODO	transitional; get rid of this
			System.getProperties().put("jsh.launcher.shell", shell);
			return this.engine.run(shell.getJrunscriptApi(), arguments);
		}
	}

	public static abstract class Shell {
		abstract ClassLoader getRhinoClassLoader() throws IOException;

		abstract URL getJrunscriptApi() throws IOException;
		abstract URL getLauncherScript() throws IOException;

		public abstract URL[] getRhinoClasspath();
		public abstract void initializeSystemProperties() throws IOException;
	}

	private static class PackagedShell extends Shell {
		private File file;

		PackagedShell(File file) {
			this.file = file;
		}

		public URL[] getRhinoClasspath() {
			//	TODO	should we return something more useful?
			try {
				Class.forName("org.mozilla.javascript.Context");
				return ((URLClassLoader)ClassLoader.getSystemClassLoader()).getURLs();
			} catch (ClassNotFoundException e) {
				if (ClassLoader.getSystemResource("$jsh/rhino.jar") != null) {
					return new java.net.URL[] { ClassLoader.getSystemResource("$jsh/rhino.jar") };
				} else {
					return null;
				}
			}
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

		public void initializeSystemProperties() {
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
				URL[] JSH_RHINO_CLASSPATH = getRhinoClasspath();
				if (JSH_RHINO_CLASSPATH == null) {
					rhinoClassLoader = new java.net.URLClassLoader(new java.net.URL[0]);
				} else {
					rhinoClassLoader = new java.net.URLClassLoader(JSH_RHINO_CLASSPATH);
				}
			}
			return rhinoClassLoader;
		}

		public abstract URL[] getRhinoClasspath();

		//	TODO	push Rhino-specific properties back into Rhino engine
		public final void initializeSystemProperties() throws java.io.IOException {
			if (getJshHome() != null) {
				System.setProperty("jsh.home", getJshHome().getCanonicalPath());
			}
			System.setProperty("jsh.launcher.classpath", System.getProperty("java.class.path"));
		}

		abstract File getJshHome();
	}

	private static class UnbuiltShell extends UnpackagedShell {
		static UnbuiltShell create(String src, String rhino) throws MalformedURLException {
			//	TODO	provide more flexible parsing of rhino argument; multiple elements, allow URL rather than pathname
			File sourceroot = new File(src);
			File js = (rhino != null) ? new File(rhino) : null;
			return new UnbuiltShell(sourceroot,(js != null) ? new URL[] { js.toURI().toURL() } : null);
		}

		private File sourceroot;
		private URL[] rhinoClasspath;

		UnbuiltShell(File sourceroot, URL[] rhinoClasspath) {
			this.sourceroot = sourceroot;
			this.rhinoClasspath = rhinoClasspath;
		}

		public String toString() {
			return "Unbuilt: sourceroot=" + sourceroot + " rhino=" + rhinoClasspath;
		}

		File getJshHome() {
			return null;
		}

		URL getJrunscriptApi() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "rhino/jrunscript/api.js").getCanonicalFile().toURI().toURL();
		}

		URL getLauncherScript() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "jsh/launcher/rhino/launcher.js").getCanonicalFile().toURI().toURL();
		}

		public URL[] getRhinoClasspath() {
			return rhinoClasspath;
		}
	}

	private static class BuiltShell extends UnpackagedShell {
		private java.io.File HOME;
		private URL rhino;
		private URL jrunscript;
		private URL launcher;

		BuiltShell(java.io.File HOME) throws java.io.IOException, MalformedURLException {
			this.HOME = HOME.getCanonicalFile();
			this.rhino = new java.io.File(this.HOME, "lib/js.jar").toURI().toURL();
			this.jrunscript = new java.io.File(this.HOME, "jsh.js").toURI().toURL();
			this.launcher = new java.io.File(this.HOME, "launcher.js").toURI().toURL();
		}

		public String toString() {
			return "BuiltShell: HOME=" + HOME;
		}

		File getJshHome() {
			return HOME;
		}

		public URL[] getRhinoClasspath() {
			return new URL[] { rhino };
		}

		URL getJrunscriptApi() {
			return jrunscript;
		}

		URL getLauncherScript() {
			return launcher;
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

		final Map<String,Engine> engines(Shell shell) throws IOException {
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
				return getSetting("jsh.shell.src");
			}

			String rhino() {
				return getSetting("jsh.engine.rhino.classpath");
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