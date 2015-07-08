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
import java.net.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.engine.*;

public class Main {
	private static abstract class Location {
		static Location create(String string) {
			if (string.startsWith("http://") || string.startsWith("https://")) {
				try {
					return bitbucket(new URL(string));
				} catch (MalformedURLException e) {
					throw new RuntimeException(e);
				}
			} else {
				return create(new File(string));
			}
		}

		abstract Location resolve(String path);
		abstract Plugins plugins();

		final Code.Source source() {
			return plugins().getLibraries();
		}

		static Location create(final File file) {
			return new Location() {
				@Override Location resolve(String path) {
					return Location.create(new File(file, path));
				}

				@Override Plugins plugins() {
					return Plugins.create(file);
				}
			};
		}

		static Location bitbucket(final URL url) {
			return new Location() {
				@Override Location resolve(String path) {
					try {
						return bitbucket(new URL(url, path));
					} catch (MalformedURLException e) {
						//	TODO	possibly emit? where is this coming from?
						throw new RuntimeException(e);
					}
				}

				@Override Plugins plugins() {
					throw new UnsupportedOperationException("Cannot create plugins from Bitbucket URL: " + url);
				}
			};
		}
	}

	static abstract class Plugins extends Shell.Installation.Extensions {
		static Plugins create(File file) {
			return new DirectoryImpl(file);
		}

		static final Plugins EMPTY = new Plugins() {
			@Override public List<Code> getPlugins() {
				return Arrays.asList(new Code[0]);
			}

			@Override public Code.Source getLibraries() {
				return Code.Source.NULL;
			}
		};

		public abstract List<Code> getPlugins();
		public abstract Code.Source getLibraries();

		final void addPluginsTo(List<Code> rv) {
			List<Code> plugins = getPlugins();
			for (Code code : plugins) {
				rv.add(code);
			}
		}

		private static class DirectoryImpl extends Plugins {
			private File file;

			DirectoryImpl(File file) {
				this.file = file;
			}

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

			public Code.Source getLibraries() {
				return Code.Source.create(file);
			}

			public List<Code> getPlugins() {
				Logging.get().log(Main.class, Level.INFO, "Application: load plugins from " + file);
				List<Code> rv = new ArrayList<Code>();
				addPluginsTo(rv, file);
				return rv;
			}
		}
	}

	private static abstract class Configuration {
//		private static Code[] plugins(final Plugins[] roots) {
//			ArrayList<Code> rv = new ArrayList<Code>();
//			for (int i=0; i<roots.length; i++) {
//				Logging.get().log(Main.class, Level.CONFIG, "Loading plugins from installation root %s ...", roots[i]);
//				roots[i].addPluginsTo(rv);
//			}
//			return rv.toArray(new Code[rv.size()]);
//		}

//		private static Code.Source[] libraries(final Plugins[] roots) {
//			ArrayList<Code.Source> rv = new ArrayList<Code.Source>();
//			for (int i=0; i<roots.length; i++) {
//				rv.add(roots[i].getLibraries());
//			}
//			return rv.toArray(new Code.Source[rv.size()]);
//		}

		private static Plugins[] getPluginRoots(String... searchpaths) {
			ArrayList<Plugins> files = new ArrayList<Plugins>();
			for (String searchpath : searchpaths) {
				if (searchpath.startsWith("http://") || searchpath.startsWith("https://")) {
					throw new RuntimeException("Unimplemented: searching for plugins over HTTP");
				}
				if (searchpath != null) {
					int next = searchpath.indexOf(File.pathSeparator);
					while(next != -1) {
						files.add(Plugins.create(new File(searchpath.substring(0,next))));
						searchpath = searchpath.substring(next+File.pathSeparator.length());
						next = searchpath.indexOf(File.pathSeparator);
					}
					if (searchpath.length() > 0) {
						files.add(Plugins.create(new File(searchpath)));
					}
				}
			}
			return files.toArray(new Plugins[files.size()]);
		}

//		final Code[] plugins(String... searchpaths) {
//			return Plugins.create(getPluginRoots(searchpaths)).getPlugins().toArray(new Code[0]);
//		}
//
//		final Code.Source libraries(String... searchpaths) {
//			return Plugins.create(getPluginRoots(searchpaths)).getLibraries();
//		}

		final Shell.Installation.Extensions plugins(String... searchpaths) {
			return Shell.Installation.Extensions.create(getPluginRoots(searchpaths));
		}

		abstract Shell.Installation installation() throws IOException;

		abstract Shell.Environment.Packaged getPackaged();
		final Shell.Environment environment() {
			InputStream stdin = new Logging.InputStream(System.in);
			//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
			//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
			//	ultimately buffering the stdout to the console or other ultimate destination.
			OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
			//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
			//	device and bytes will never need to be immediately available
			OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));
			final Shell.Environment.Stdio stdio = Shell.Environment.Stdio.create(stdin, stdout, stderr);
			final Shell.Environment.Packaged packaged = getPackaged();
			return Shell.Environment.create(Shell.Environment.class.getClassLoader(), System.getProperties(), OperatingSystem.Environment.SYSTEM, stdio, packaged);
		}

		abstract Shell.Invocation invocation(String[] args) throws Shell.Invocation.CheckedException;

		private Shell.Installation installation(Configuration implementation) {
			try {
				return implementation.installation();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		final Shell.Configuration configuration(String[] arguments) throws Shell.Invocation.CheckedException {
			Logging.get().log(Main.class, Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
			return Shell.Configuration.create(installation(this), this.environment(), this.invocation(arguments));
		}
	}

	private static class Packaged extends Configuration {
		private static File getPackagedPluginsDirectory() throws IOException {
			File tmpdir = File.createTempFile("jshplugins", null);
			tmpdir.delete();
			tmpdir.mkdir();

			int index = 0;

			PackagedPlugin plugin = null;
			inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
			while( (plugin = PackagedPlugin.get(index)) != null ) {
				File copyTo = new File(tmpdir, plugin.name());
				FileOutputStream writeTo = new FileOutputStream(copyTo);
				streams.copy(plugin.stream(),writeTo);
				plugin.stream().close();
				writeTo.close();
				index++;
				Logging.get().log(Main.class, Level.FINE, "Copied plugin " + index + " from " + plugin.name());
			}
			return tmpdir;
		}

		private static abstract class PackagedPlugin {
			abstract String name();
			abstract InputStream stream();

			static PackagedPlugin create(final String name, final InputStream stream) {
				return new PackagedPlugin() {
					String name() { return name; }
					InputStream stream() { return stream; }
				};
			}

			static PackagedPlugin get(int index) {
				if (ClassLoader.getSystemResourceAsStream("$plugins/" + String.valueOf(index) + ".jar") != null) {
					return create("" + index + ".jar", ClassLoader.getSystemResourceAsStream("$plugins/" + String.valueOf(index) + ".jar"));
				} else if (ClassLoader.getSystemResourceAsStream("$plugins/" + String.valueOf(index) + ".slime") != null) {
					return create(
						String.valueOf(index) + ".slime",
						ClassLoader.getSystemResourceAsStream("$plugins/" + String.valueOf(index) + ".slime")
					);
				} else {
					return null;
				}
			}
		}

		private File main;

		Packaged(File main) {
			this.main = main;
		}

		Shell.Installation installation() {
			Plugins plugins = null;
			try {
				plugins = Plugins.create(getPackagedPluginsDirectory());
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			//	TODO	better hierarchy would probably be $jsh/loader/slime and $jsh/loader/jsh
			final Code.Source platform = Code.Source.system("$jsh/loader/");
			final Code.Source jsh = Code.Source.system("$jsh/");
			return Shell.Installation.create(platform, jsh, plugins);
		}

		Shell.Invocation invocation(final String[] arguments) {
			Code.Source.File main = Code.Source.File.create(ClassLoader.getSystemResource("main.jsh.js"));
			return Shell.Invocation.create(
				Shell.Script.create(main),
				arguments
			);
		}

		Shell.Environment.Packaged getPackaged() {
			return Shell.Environment.Packaged.create(Code.Source.system("$packaged/"), main);
		}
	}

	private static abstract class Unpackaged extends Configuration {
		abstract Plugins getModules();
		abstract Code.Source getLoader();
		abstract Code.Source getJsh();
		abstract Plugins getShellPlugins();

		final Shell.Installation installation() throws IOException {
			Unpackaged unpackaged = this;
			//	TODO	previously user plugins directory was not searched for libraries. Is this right?
			final Shell.Installation.Extensions plugins = Shell.Installation.Extensions.create(new Shell.Installation.Extensions[] {
				unpackaged.getModules(),
				unpackaged.getShellPlugins(),
				Plugins.create(new File(new File(System.getProperty("user.home")), ".jsh/plugins"))
			});
			return Shell.Installation.create(
				unpackaged.getLoader(),
				unpackaged.getJsh(),
				plugins
			);
		}

		Shell.Invocation invocation(String[] arguments) throws Shell.Invocation.CheckedException {
			if (arguments.length == 0) {
				throw new IllegalArgumentException("No arguments supplied; is this actually a packaged application? system properties = " + System.getProperties());
			}
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

		Shell.Environment.Packaged getPackaged() {
			return null;
		}
	}

	private static class Unbuilt extends Unpackaged {
		private Location src;

		Unbuilt(Location src) {
			this.src = src;
		}

		Plugins getModules() {
			return this.src.plugins();
		}

		Code.Source getLoader() {
			return this.src.resolve("loader").source();
		}

		Code.Source getJsh() {
			return this.src.resolve("jsh/loader").source();
		}

		Plugins getShellPlugins() {
			if (System.getProperty("jsh.shell.plugins") != null) {
				return Location.create(System.getProperty("jsh.shell.plugins")).plugins();
			}
			//	TODO	this is basically a dummy file that contains no plugins, to make the calling code simpler
			return Plugins.EMPTY;
		}
	}
//
//	private static class Local extends Unbuilt {
//		Unbuilt(File src) {
//			initialize(Location.create(src));
//		}
//	}
//
//	private static class Hosted extends Unbuilt {
//		Hosted(URL src) {
//			this.src = src;
//		}
//
//		private URL relative(String string) {
//			try {
//				return new URL(this.src, string);
//			} catch (MalformedURLException e) {
//				throw new RuntimeException(e);
//			}
//		}
//
//		Plugins getShellPlugins() {
//			return Plugins.EMPTY;
//		}
//	}

	private static class Built extends Unpackaged {
		private File home;

		Built(File home) {
			this.home = home;
		}

		Plugins getModules() {
			return Plugins.create(new File(this.home, "modules"));
		}

		private File getScripts() {
			return new File(this.home, "script");
		}

		Code.Source getLoader() {
			return Code.Source.create(new File(getScripts(), "loader"));
		}

		Code.Source getJsh() {
			return Code.Source.create(new File(getScripts(), "jsh"));
		}

		Plugins getShellPlugins() {
			return Plugins.create(new File(this.home, "plugins"));
		}
	}

	private static Configuration implementation() {
		File main = null;
		try {
			URI codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation().toURI();
			if (codeLocation.getScheme().equals("file")) {
				main = new File(codeLocation);
			} else {
				throw new RuntimeException("Unreachable: code source = " + codeLocation);
			}
		} catch (java.net.URISyntaxException e) {
			throw new RuntimeException(e);
		}
		if (ClassLoader.getSystemResource("main.jsh.js") != null) {
			return new Packaged(main);
		} else {
			Logging.get().log(Main.class, Level.CONFIG, "jsh.shell.src=" + System.getProperty("jsh.shell.src"));
			Logging.get().log(Main.class, Level.CONFIG, "getMainFile=" + main);
			if (main.getName().equals("jsh.jar") && main.getParentFile().getName().equals("lib")) {
				File home = main.getParentFile().getParentFile();
				System.setProperty("jsh.shell.home", home.getAbsolutePath());
				//	TODO	eliminate the below system property by using a shell API to specify this
				return new Built(home);
			}
			return new Unbuilt(Location.create(System.getProperty("jsh.shell.src")));
		}
	}

	private static Shell.Configuration configuration(final String[] arguments) throws Shell.Invocation.CheckedException {
		Logging.get().log(Main.class, Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
		return implementation().configuration(arguments);
	}

	public static abstract class Engine {
		public abstract void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException;

		private void shell(Shell.Container context, Shell.Configuration shell) throws Shell.Invocation.CheckedException {
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

		private Integer embed(Shell.Configuration configuration) throws Shell.Invocation.CheckedException {
			Shell.Container.Holder context = new Shell.Container.Holder();
			return context.getExitCode(new Runner(), configuration);
		}

		private void cli(String[] args) throws Shell.Invocation.CheckedException {
			shell(Shell.Container.VM, Main.configuration(args));
		}
	}

	public static void cli(Engine engine, String[] args) throws Shell.Invocation.CheckedException {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Logging.get().log(Main.class, Level.INFO, "Invoked cli(String[] args) with " + args.length + " arguments.");
		for (int i=0; i<args.length; i++) {
			Logging.get().log(Main.class, Level.INFO, "Argument " + i + " is: " + args[i]);
		}
		engine.cli(args);
	}
}