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
	
	private static class Invocation {
		private static boolean hasClass(Shell shell, String name) {
			try {
				shell.getRhinoClassLoader().loadClass(name);
				return true;
			} catch (IOException e) {
				throw new RuntimeException(e);
			} catch (ClassNotFoundException e) {
				return false;
			}
		}
		
		//	TODO	this logic is duplicated in Servlet
		private static Engine getEngine(Shell shell) {
			boolean hasNashorn = new ScriptEngineManager().getEngineByName("nashorn") != null;
			boolean hasRhino = hasClass(shell, "org.mozilla.javascript.Context");
			if (!hasNashorn && !hasRhino) {
				throw new RuntimeException("No JavaScript execution engine found.");
			} else if (!hasNashorn && hasRhino) {
				return new Rhino();
			} else if (hasNashorn && !hasRhino) {
				return new Nashorn();
			} else {
				if (System.getenv("JSH_ENGINE") != null && System.getenv("JSH_ENGINE").equals("rhino")) {
					return new Rhino();
				} else if (System.getenv("JSH_ENGINE") != null && System.getenv("JSH_ENGINE").equals("nashorn")) {
					return new Nashorn();
				} else {
					//	for now
					return new Rhino();
				}
			}
		}
		
		static Invocation create() throws IOException {
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
			Invocation rv = null;
			if (ClassLoader.getSystemResource("main.jsh.js") != null) {
				Shell shell = new PackagedShell(launcherLocation);
				rv = new Invocation(shell, getEngine(shell));
			} else {
				java.io.File JSH_HOME = null;
				if (launcherLocation.endsWith("jsh.jar")) {
					JSH_HOME = new java.io.File(launcherLocation.substring(0, launcherLocation.length()-"jsh.jar".length()-1));
				}
				Shell shell = (JSH_HOME != null) ? new BuiltShell(JSH_HOME) : new UnbuiltShell();
				//	TODO	This might miss some exotic situations, like loading this class in its own classloader
				Invocation frv = new Invocation(shell, getEngine(shell));
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

		private Shell shell;
		private Engine engine;
		private boolean debug;
		
		Invocation(Shell shell, Engine engine) {
			this.shell = shell;
			this.engine = engine;
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
		
		final int run(String[] args) throws IOException, ScriptException {
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
			Engine rhino = this.engine;
			rhino.initialize(this);
			return rhino.run(args);
		}

		private ClassLoader mainClassLoader;

		final ClassLoader getMainClassLoader() throws IOException {
			if (mainClassLoader == null) {
				mainClassLoader = shell.getRhinoClassLoader();
			}
			return mainClassLoader;
		}
	}
	
	private static abstract class Engine {
		private Invocation invocation;
		
		final void initialize(Invocation invocation) throws IOException {
			this.invocation = invocation;
			invocation.addLauncherScriptsTo(this);
		}
		
		final boolean debug() {
			return invocation.debug();
		}
		
		final void debug(String message) {
			invocation.debug(message);
		}
		
		ClassLoader getRhinoClassLoader() throws IOException {
			return invocation.getRhinoClassLoader();
		}

		abstract void initializeSystemProperties(Invocation invocation, Shell shell) throws IOException;
		abstract void addScript(String pathname);
		abstract int run(String[] args) throws IOException, ScriptException;
	}
	
	private static class Nashorn extends Engine {
		private ScriptEngineManager factory;
		private ScriptEngine engine;
		private ArrayList<String> scripts = new ArrayList<String>();
		
		Nashorn() {
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName("nashorn");			
		}
		
		void initializeSystemProperties(Invocation invocation, Shell shell) {
			System.setProperty("jsh.launcher.nashorn", "true");
		}
		
		void addScript(String pathname) {
			scripts.add(pathname);
		}
		
		int run(String[] args) throws IOException, ScriptException {
			Logging.get().log(Nashorn.class, Level.FINE, "arguments.length = %d", args.length);
			this.factory.getBindings().put("arguments", args);
			this.factory.getBindings().put("$arguments", args);
			this.factory.getBindings().put("foo", "bar");
//			this.engine.getBindings(ScriptContext.GLOBAL_SCOPE).put("arguments", args);
			Logging.get().log(Nashorn.class, Level.FINE, "run(): scripts.length = " + scripts.size());
			for (String script : scripts) {
				Logging.get().log(Nashorn.class, Level.FINE, "script: " + script);
				ScriptContext c = engine.getContext();
				c.setAttribute(ScriptEngine.FILENAME, script, ScriptContext.ENGINE_SCOPE);
//				File file = new File(script);
				if (new java.io.File(script).exists()) {
					script = new java.io.File(script).toURI().toURL().toExternalForm();
				}
				java.net.URLConnection connection = new java.net.URL(script).openConnection();
				engine.eval(new InputStreamReader(connection.getInputStream()), c);
				Logging.get().log(Nashorn.class, Level.FINE, "completed script: " + script);
			}
			return 0;
		}
	}
	
	private static class Rhino extends Engine {
		private ArrayList<String> scripts = new ArrayList<String>();
		
		private java.lang.reflect.Method getMainMethod() throws IOException, ClassNotFoundException, NoSuchMethodException {
			ClassLoader loader = getRhinoClassLoader();
			String mainClassName = (debug()) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			Class shell = loader.loadClass(mainClassName);
			String mainMethodName = (debug()) ? "main" : "exec";
			java.lang.reflect.Method main = shell.getMethod(mainMethodName, new Class[] { String[].class });
			return main;
		}
		
		void initializeSystemProperties(Invocation invocation, Shell shell) throws IOException {
			invocation.debug("Setting Rhino system properties...");
			System.setProperty("jsh.launcher.rhino", "true");
			if (shell.getRhinoClasspath() != null) {
				System.setProperty("jsh.launcher.rhino.classpath", shell.getRhinoClasspath());
			} else {
//				throw new RuntimeException("No Rhino classpath in " + this
//					+ ": JSH_RHINO_CLASSPATH is " + System.getenv("JSH_RHINO_CLASSPATH"))
//				;
			}
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
			Class c = getRhinoClassLoader().loadClass("org.mozilla.javascript.tools.shell.Main");
			java.lang.reflect.Field field = c.getDeclaredField("exitCode");
			field.setAccessible(true);
			return field.getInt(null);			
		}
		
		@Override int run(String[] args) throws IOException {
			Integer status = null;
			Logging.get().log(Main.class, Level.FINE, "jsh.launcher.rhino.classpath = %s", System.getProperty("jsh.launcher.rhino.classpath"));
			try {
				java.lang.reflect.Method main = this.getMainMethod();
				debug("Rhino shell main = " + main);
				String[] arguments = this.getArguments(args);
				debug("Rhino shell arguments:");
				for (int i=0; i<arguments.length; i++) {
					debug("Rhino shell argument = " + arguments[i]);
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
			rhino.addScript(ClassLoader.getSystemResource("$jsh/api.rhino.js").toExternalForm());
			rhino.addScript(ClassLoader.getSystemResource("$jsh/jsh.rhino.js").toExternalForm());
		}
		
		void initializeSystemProperties() {
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
		
		//	TODO	push Rhino-specific properties back into Rhino engine
		final void initializeSystemProperties() throws java.io.IOException {
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

		String getRhinoScript() throws java.io.IOException {
			if (explicit.getRhinoScript() != null) return explicit.getRhinoScript();
			return new java.io.File(HOME, "script/launcher/jsh.rhino.js").getCanonicalPath();
		}
	}
	
	private static class BeforeExit implements Runnable {
		private Integer status = null;
		
		void setStatus(int status) {
			this.status = new Integer(status);
		}
		
		public void run() {
			System.out.flush();
			Logging.get().log(Main.class, Level.INFO, "Exit status: %d", status);
			System.err.flush();
		}
	}

	private void run(String[] args) throws java.io.IOException {
		BeforeExit beforeExit = new BeforeExit();
		Runtime.getRuntime().addShutdownHook(new Thread(beforeExit));
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
			System.exit(status.intValue());
		}
	}

	public static void main(String[] args) throws java.io.IOException {
		Logging.get().log(Main.class, Level.FINEST, "Launcher Main executing ...");
		new Main().run(args);
	}
}