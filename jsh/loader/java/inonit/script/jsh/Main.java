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

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public class Main {
	static class PluginComparator implements Comparator<File> {
		private int evaluate(File file) {
			if (!file.isDirectory() && file.getName().endsWith(".jar")) {
				return -1;
			}
			return 0;
		}

		public int compare(File o1, File o2) {
			return evaluate(o1) - evaluate(o2);
		}
	}

	private static void addPluginsTo(List<Code> rv, final File file, boolean warn) {
		if (file.exists()) {
			if (file.isDirectory()) {
				if (new File(file, "plugin.jsh.js").exists()) {
					//	interpret as unpacked module
					Logging.get().log(Main.class, Level.CONFIG, "Loading unpacked plugin from " + file + " ...");
					rv.add(Code.unpacked(file));
				} else {
					//	interpret as directory that may contain plugins
					File[] list = file.listFiles();
					Arrays.sort(list, new PluginComparator());
					for (File f : list) {
						addPluginsTo(rv, f, false);
					}
				}
			} else if (!file.isDirectory() && file.getName().endsWith(".slime")) {
				try {
					Code p = Code.slime(file);
					if (p.getScripts().getFile("plugin.jsh.js") != null) {
						Logging.get().log(Main.class, Level.WARNING, "Loading plugin from %s ...", file);
						rv.add(p);
					} else {
						Logging.get().log(Main.class, Level.WARNING, "Found .slime file, but no plugin.jsh.js: %s", file);
					}
				} catch (IOException e) {
					//	TODO	probably error message or warning
				}
			} else if (!file.isDirectory() && file.getName().endsWith(".jar")) {
				Logging.get().log(Main.class, Level.CONFIG, "Loading Java plugin from " + file + " ...");
				rv.add(Code.jar(file));
			} else {
				//	Ignore, exists but not .slime or .jar or directory
				//	TODO	probably log message of some kind
				if (warn) Logging.get().log(Main.class, Level.WARNING, "Cannot load plugin from %s as it does not appear to contain a valid plugin", file);
			}
		} else {
			Logging.get().log(Main.class, Level.CONFIG, "Cannot load plugin from %s; file not found", file);
		}
	}

	static void addPluginsTo(List<Code> rv, File file) {
		addPluginsTo(rv, file, true);
	}

	//	Called by applications to load plugins
	static Code[] getPlugins(File file) {
		Logging.get().log(Main.class, Level.INFO, "Application: load plugins from " + file);
		List<Code> rv = new ArrayList<Code>();
		addPluginsTo(rv, file);
		return rv.toArray(new Code[rv.size()]);
	}

	private static Code[] plugins(final File[] roots) {
		ArrayList<Code> rv = new ArrayList<Code>();
		for (int i=0; i<roots.length; i++) {
			Logging.get().log(Main.class, Level.CONFIG, "Loading plugins from installation root %s ...", roots[i]);
			Main.addPluginsTo(rv, roots[i]);
		}
		return rv.toArray(new Code[rv.size()]);
	}

	private static Code.Source[] libraries(final File[] roots) {
		ArrayList<Code.Source> rv = new ArrayList<Code.Source>();
		for (int i=0; i<roots.length; i++) {
			rv.add(Code.Source.create(roots[i]));
		}
		return rv.toArray(new Code.Source[rv.size()]);
	}

	private static File[] getPluginRoots(String... searchpaths) {
		ArrayList<File> files = new ArrayList<File>();
		for (String searchpath : searchpaths) {
			if (searchpath != null) {
				int next = searchpath.indexOf(File.pathSeparator);
				while(next != -1) {
					files.add(new File(searchpath.substring(0,next)));
					searchpath = searchpath.substring(next+File.pathSeparator.length());
					next = searchpath.indexOf(File.pathSeparator);
				}
				if (searchpath.length() > 0) {
					files.add(new File(searchpath));
				}
			}
		}
		return files.toArray(new File[files.size()]);
	}

	private static Code[] plugins(String... searchpaths) {
		File[] roots = getPluginRoots(searchpaths);
		return plugins(roots);
	}

	private static Code.Source[] libraries(String... searchpaths) {
		return libraries(getPluginRoots(searchpaths));
	}

	private static abstract class Unpackaged {
		abstract String getModules();
		abstract File getLoader();
		abstract File getJsh();
	}

	private static class Unbuilt extends Unpackaged {
		private File src;

		Unbuilt() {
			this.src = new File(System.getProperty("jsh.shell.src"));
		}

		String getModules() {
			return this.src.getAbsolutePath();
		}

		File getLoader() {
			return new File(this.src, "loader");
		}

		File getJsh() {
			return new File(new File(this.src, "jsh"), "loader");
		}
	}

	private static class Built extends Unpackaged {
		private File home;

		Built() {
			this.home = new File(System.getProperty("jsh.home"));
		}

		String getModules() {
			return new File(this.home, "modules").getAbsolutePath();
		}

		private File getScripts() {
			return new File(this.home, "script");
		}

		File getLoader() {
			return new File(getScripts(), "loader");
		}

		File getJsh() {
			return new File(getScripts(), "jsh");
		}
	}

	private static Unpackaged getUnpackaged() {
		if (System.getProperty("jsh.home") != null) return new Built();
		if (System.getProperty("jsh.shell.src") != null) return new Unbuilt();
		return null;
	}

	private static Shell.Installation unpackagedInstallation() {
		Logging.get().log(Main.class, Level.CONFIG, "jsh.home=" + System.getProperty("jsh.home"));
		Logging.get().log(Main.class, Level.CONFIG, "jsh.shell.src=" + System.getProperty("jsh.shell.src"));
		Unpackaged unpackaged = getUnpackaged();
		final Code[] plugins = plugins(unpackaged.getModules(), System.getProperty("jsh.plugins"));
		final Code.Source[] libraries = libraries(unpackaged.getModules(), System.getProperty("jsh.plugins"));
		return Shell.Installation.create(
			Code.Source.create(unpackaged.getLoader()),
			Code.Source.create(unpackaged.getJsh()),
			plugins,
			libraries
		);
	}

	private static Shell.Installation packagedInstallation() {
		final Code[] plugins = plugins(System.getProperty("jsh.plugins"));
		final Code.Source[] libraries = libraries(System.getProperty("jsh.plugins"));
		//	TODO	better hierarchy would probably be $jsh/slime and $jsh/loader
		final Code.Source platform = Code.Source.system("$jsh/loader/");
		final Code.Source jsh = Code.Source.system("$jsh/");
		return Shell.Installation.create(platform, jsh, plugins, libraries);
	}

	private static Shell.Environment environment() {
		InputStream stdin = new Logging.InputStream(System.in);
		//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
		//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
		//	ultimately buffering the stdout to the console or other ultimate destination.
		OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
		//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
		//	device and bytes will never need to be immediately available
		OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));
		final Shell.Environment.Stdio stdio = Shell.Environment.Stdio.create(stdin, stdout, stderr);
		final Shell.Environment.Packaged packaged = (System.getProperty("jsh.launcher.packaged") != null)
			? Shell.Environment.Packaged.create(Code.Source.system("$packaged/"), new java.io.File(System.getProperty("jsh.launcher.packaged")))
			: null
		;
		return Shell.Environment.create(Shell.Environment.class.getClassLoader(), System.getProperties(), OperatingSystem.Environment.SYSTEM, stdio, packaged);
	}

	static Shell.Invocation invocation(final File script, final String[] arguments) {
		return Shell.Invocation.create(Shell.Script.create(script), arguments);
	}

	static Shell.Invocation packaged(final String[] arguments) {
		Code.Source.File main = Code.Source.File.create(ClassLoader.getSystemResource("main.jsh.js"));
		return Shell.Invocation.create(
			Shell.Script.create(main),
			arguments
		);
	}

	private static Shell.Invocation invocation(String[] arguments) throws Shell.Invocation.CheckedException {
		if (arguments.length == 0) {
			throw new IllegalArgumentException("At least one argument, representing the script, is required.");
		}
		final List<String> args = new ArrayList<String>();
		args.addAll(Arrays.asList(arguments));
		final String scriptPath = args.remove(0);
		if (scriptPath.startsWith("http://") || scriptPath.startsWith("https://")) {
			final java.net.URL url;
			final java.io.InputStream stream;
			try {
				url = new java.net.URL(scriptPath);
				stream = url.openStream();
			} catch (java.net.MalformedURLException e) {
				throw new Shell.Invocation.CheckedException("Malformed URL: " + scriptPath, e);
			} catch (IOException e) {
				throw new Shell.Invocation.CheckedException("Could not open: " + scriptPath, e);
			}
			return new Shell.Invocation() {
				public Shell.Script getScript() {
					return new Shell.Script() {
						@Override public java.net.URI getUri() {
							try {
								return url.toURI();
							} catch (java.net.URISyntaxException e) {
								//	TODO	when can this happen? Probably should refactor to do this parsing earlier and use
								//			CheckedException
								throw new RuntimeException(e);
							}
						}

						@Override public Code.Source.File getSource() {
							return Code.Source.File.create(Code.Source.URI.create(url), scriptPath, null, null, stream);
						}
					};
				}

				public String[] getArguments() {
					return args.toArray(new String[args.size()]);
				}
			};
		} else {
			final File mainScript = new File(scriptPath);
			if (!mainScript.exists()) {
				//	TODO	this really should not happen if the launcher is launching this
				throw new Shell.Invocation.CheckedException("File not found: " + scriptPath);
			}
			if (mainScript.isDirectory()) {
				throw new Shell.Invocation.CheckedException("Filename: " + scriptPath + " is a directory");
			}
			return new Shell.Invocation() {
				public Shell.Script getScript() {
					return Shell.Script.create(mainScript);
				}

				public String[] getArguments() {
					return (String[]) args.toArray(new String[0]);
				}
			};
		}
	}

	private static Shell.Configuration configuration(final String[] arguments) throws Shell.Invocation.CheckedException {
		Logging.get().log(Main.class, Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
		if (System.getProperty("jsh.launcher.packaged") != null) {
			return Shell.Configuration.create(packagedInstallation(), environment(), packaged(arguments));
		} else {
			if (arguments.length == 0) {
				throw new IllegalArgumentException("No arguments supplied; is this actually a packaged application? system properties = " + System.getProperties());
			}
			return Shell.Configuration.create(unpackagedInstallation(), environment(), invocation(arguments));
		}
	}

	public static abstract class Engine {
		public abstract void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException;

		public final void shell(Shell.Container context, Shell.Configuration shell) throws Shell.Invocation.CheckedException {
			if (!inonit.system.Logging.get().isSpecified()) {
				inonit.system.Logging.get().initialize(new java.util.Properties());
			}
			Thread.currentThread().setUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
				public void uncaughtException(Thread t, Throwable e) {
					Throwable error = e;
					java.io.PrintWriter writer = new java.io.PrintWriter(System.err,true);
					while(error != null) {
						writer.println(error.getClass().getName() + ": " + error.getMessage());
						StackTraceElement[] trace = error.getStackTrace();
						for (StackTraceElement line : trace) {
							writer.println("\t" + line);
						}
						error = error.getCause();
						if (error != null) {
							writer.print("Caused by: ");
						}
					}
				}
			});
			main(context, Shell.create(shell));
		}

		private class Runner extends Shell.Container.Holder.Run {
			public void threw(Throwable t) {
				t.printStackTrace();
			}

			public void run(Shell.Container context, Shell.Configuration shell) throws Shell.Invocation.CheckedException {
				Engine.this.shell(context,shell);
			}
		}

		public final Integer embed(Shell.Configuration configuration) throws Shell.Invocation.CheckedException {
			Shell.Container.Holder context = new Shell.Container.Holder();
			return context.getExitCode(new Runner(), configuration);
		}

		public final void cli(String[] args) throws Shell.Invocation.CheckedException {
			shell(Shell.Container.VM, Main.configuration(args));
		}
	}

	//	Perhaps a future launcher could access this interface directly
	public static Integer run(Engine engine, Shell.Configuration configuration) throws Shell.Invocation.CheckedException {
		return engine.embed(configuration);
	}

	public static Integer run(Engine engine, String[] args) throws Shell.Invocation.CheckedException {
		return run(engine, configuration(args));
	}
}