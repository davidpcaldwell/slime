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
	private static final Logger LOG = Logger.getLogger(Main.class.getName());

	//	TODO	refactor into locateCodeSource() method
	private static abstract class Location {
		static Code.Loader loader(String string) {
			//	TODO	below can happen when looking for local/jsh/lib in remote shell
			if (string == null) return Code.Loader.NULL;
			String host = "raw.githubusercontent.com";
			if (string.startsWith("http://" + host) || string.startsWith("https://" + host)) {
				try {
//					return Code.Loader.bitbucketApiVersionOne(new URL(string));
					return Code.Loader.githubApi(new URL(string));
				} catch (MalformedURLException e) {
					throw new RuntimeException(e);
				}
			} else {
				return Code.Loader.create(new File(string));
			}
		}
	}

	private static abstract class Configuration {
		abstract Shell.Installation installation() throws IOException;

		private Shell.Installation installation(Configuration implementation) {
			try {
				return implementation.installation();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		abstract Shell.Environment.Packaged getPackaged();

		final Shell.Environment environment() {
			String PREFIX = Main.class.getName() + ".";
			System.getProperties().put(PREFIX + "stdin", System.in);
			System.getProperties().put(PREFIX + "stdout", System.out);
			System.getProperties().put(PREFIX + "stderr", System.err);
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

		final Shell.Configuration configuration(String[] arguments) throws Shell.Invocation.CheckedException {
			LOG.log(Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
			return Shell.Configuration.create(installation(this), this.environment(), this.invocation(arguments));
		}
	}

	private static class Packaged extends Configuration {
		private static File createPackagedPluginsDirectory() throws IOException {
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
				LOG.log(Level.FINE, "Copied plugin " + index + " from " + plugin.name());
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
			//	TODO	better hierarchy would probably be $jsh/loader/slime and $jsh/loader/jsh
			final Code.Loader platform = Code.Loader.system("$jsh/loader/");
			final Code.Loader jsh = Code.Loader.system("$jsh/");
			return new Shell.Installation() {
				private Code.Loader[] plugins;

				{
					try {
						this.plugins = new Code.Loader[] { Code.Loader.create(createPackagedPluginsDirectory()) };
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}

				@Override public Code.Loader getPlatformLoader() {
					return platform;
				}

				@Override public Code.Loader getJshLoader() {
					return jsh;
				}

				@Override public Code.Loader getLibraries() {
					//	TODO	This is obviously wrong and we ought to be able to package libraries
					return Code.Loader.NULL;
				}

				@Override public File getLibraryFile(String path) {
					//	TODO	This is obviously wrong and we ought to be able to package libraries
					return null;
				}

				@Override public Code.Loader[] getExtensions() {
					return plugins;
				}
			};
		}

		Shell.Invocation invocation(final String[] arguments) {
			Code.Loader.Resource main = Code.Loader.Resource.create(ClassLoader.getSystemResource("main.jsh.js"));
			return Shell.Invocation.create(
				Shell.Script.create(main),
				arguments
			);
		}

		Shell.Environment.Packaged getPackaged() {
			return Shell.Environment.Packaged.create(Code.Loader.system("$packaged/"), main);
		}
	}

	private static abstract class Unpackaged extends Configuration {
		abstract Code.Loader getLoader();
		abstract Code.Loader getJsh();
		abstract Code.Loader getModules();
		abstract Code.Loader getLibraries();

		private File lib;

		abstract File getLibraryDirectory();

		final File getLibraryFile(String path) {
			if (lib == null) {
				lib = getLibraryDirectory();
			}
			if (lib != null) {
				File rv = new File(lib, path);
				if (rv.exists()) return rv;
			}
			return null;
		}

		abstract Code.Loader getPlugins();

		final Shell.Installation installation() throws IOException {
			//	TODO	previously user plugins directory was not searched for libraries. Is this right?
			final Code.Loader[] plugins = new Code.Loader[] {
				this.getModules(),
				this.getPlugins()
			};
			return new Shell.Installation() {
				@Override public Code.Loader getPlatformLoader() {
					return Unpackaged.this.getLoader();
				}

				@Override public Code.Loader getJshLoader() {
					return Unpackaged.this.getJsh();
				}

				@Override public Code.Loader getLibraries() {
					return Unpackaged.this.getLibraries();
				}

				@Override public File getLibraryFile(String path) {
					return Unpackaged.this.getLibraryFile(path);
				}

				@Override public Code.Loader[] getExtensions() {
					return plugins;
				}
			};
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
			final String[] scriptArguments = args.toArray(new String[0]);
			if (scriptPath.startsWith("http://") || scriptPath.startsWith("https://")) {
				try {
					URL parsed = new URL(scriptPath);
					final URL url = Code.Loader.Github.INSTANCE.hosts(parsed)
						? new URL(parsed.getProtocol(), parsed.getHost(), parsed.getPort(), parsed.getFile(), Code.Loader.Github.INSTANCE.getUrlStreamHandler())
						: parsed
					;
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

								@Override public Code.Loader.Resource getSource() {
									return Code.Loader.Resource.create(url);
	//								return Code.Loader.Resource.create(Code.Loader.URI.create(url), scriptPath, null, null, stream);
								}
							};
						}

						public String[] getArguments() {
							return scriptArguments;
						}
					};
				} catch (java.net.MalformedURLException e) {
					throw new Shell.Invocation.CheckedException("Malformed URL: " + scriptPath, e);
				}
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
						return scriptArguments;
					}
				};
			}
		}

		Shell.Environment.Packaged getPackaged() {
			return null;
		}
	}

	private static class Unbuilt extends Unpackaged {
		private Code.Loader src;

		Unbuilt(Code.Loader src) {
			this.src = src;
		}

		Code.Loader getLoader() {
			return this.src.child("loader/");
		}

		Code.Loader getJsh() {
			return this.src.child("jsh/loader/");
		}

		Code.Loader getModules() {
			final Code.Loader.Enumerator enumerator = new Code.Loader.Enumerator() {
				@Override public String[] list(String prefix) {
					//System.err.println(Unbuilt.this.src + " list(" + prefix + ")");
					String[] was = Unbuilt.this.src.getEnumerator().list(prefix);
					if (prefix.length() != 0) return was;

					List<String> list = Arrays.asList(was);
					ArrayList<String> rv = new ArrayList<String>();
					for (String s : list) {
						if (!s.equals("local/") && !s.equals("tomcat.8080/")) {
							rv.add(s);
						}
					}
					//System.err.println(Unbuilt.this.src + " list(" + prefix + ") " + rv);
					return rv.toArray(new String[0]);
				}
			};
			final Code.Locator locator = new Code.Locator() {
				@Override public URL getResource(String path) {
					//System.err.println(Unbuilt.this.src + " getResource(" + path + ")");
					if (path.startsWith("local/")) return null;
					return Unbuilt.this.src.getLocator().getResource(path);
				}
			};
			return new Code.Loader() {
				@Override public String toString() {
					return "Code.Loader (no local/): " + Unbuilt.this.src;
				}

				@Override public Code.Loader.Resource getFile(String path) throws IOException {
					//System.err.println(Unbuilt.this.src + " getFile(" + path + ")");
					if (path.startsWith("local/")) return null;
					return Unbuilt.this.src.getFile(path);
				}

				@Override public Code.Loader.Enumerator getEnumerator() {
					return enumerator;
				}

				@Override public Code.Locator getLocator() {
					return locator;
				}
			};
		}

		Code.Loader getLibraries() {
			//	See jsh/launcher/main.js; this value is defined there because it is needed by launcher to start loader with Rhino
			//	in classpath
			return Location.loader(System.getProperty("jsh.shell.lib"));
//			File file = new java.io.File(System.getProperty("jsh.shell.lib"));
//			return Code.Loader.create(file);
		}

		final File getLibraryDirectory() {
			String string = System.getProperty("jsh.shell.lib");
			if (string == null) {
				return null;
			} else if (string.startsWith("http://") || string.startsWith("https://")) {
				return null;
			} else {
				return new File(string);
			}
		}

		Code.Loader getPlugins() {
			return this.src.child("local/jsh/plugins");
		}
	}

	private static class Built extends Unpackaged {
		private File home;
		private File lib;

		Built(File home) {
			this.home = home;
			this.lib = new File(this.home, "lib");
		}

		private File getScripts() {
			return new File(this.home, "script");
		}

		Code.Loader getLoader() {
			return Code.Loader.create(new File(getScripts(), "loader"));
		}

		Code.Loader getJsh() {
			return Code.Loader.create(new File(getScripts(), "jsh"));
		}

		Code.Loader getModules() {
			return Code.Loader.create(new File(this.home, "modules"));
		}

		Code.Loader getLibraries() {
			return Code.Loader.create(this.lib);
		}

		File getLibraryDirectory() {
			return this.lib;
		}

		Code.Loader getPlugins() {
			return Code.Loader.create(new File(this.home, "plugins"));
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
			LOG.log(Level.CONFIG, "jsh.shell.src=" + System.getProperty("jsh.shell.src"));
			LOG.log(Level.CONFIG, "getMainFile=" + main);
			if (main.getName().equals("jsh.jar") && main.getParentFile().getName().equals("lib")) {
				File home = main.getParentFile().getParentFile();
				System.setProperty("jsh.shell.home", home.getAbsolutePath());
				//	TODO	eliminate the below system property by using a shell API to specify this
				return new Built(home);
			}
			return new Unbuilt(Location.loader(System.getProperty("jsh.shell.src")));
		}
	}

	private static Shell.Configuration configuration(final String[] arguments) throws Shell.Invocation.CheckedException {
		LOG.log(Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
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

		//	TODO	The cli() method appears to force VM containers; the embed() method and Runner class may have been intended
		//			to support another kind of container, but are currently unused

		// private class Runner extends Shell.Container.Holder.Run {
		// 	public void threw(Throwable t) {
		// 		t.printStackTrace();
		// 	}

		// 	public void run(Shell.Container context, Shell.Configuration shell) throws Shell.Invocation.CheckedException {
		// 		Engine.this.shell(context,shell);
		// 	}
		// }

		// private Integer embed(Shell.Configuration configuration) throws Shell.Invocation.CheckedException {
		// 	Shell.Container.Holder context = new Shell.Container.Holder();
		// 	return context.getExitCode(new Runner(), configuration);
		// }

		private void cli(String[] args) throws Shell.Invocation.CheckedException {
			shell(Shell.Container.VM, Main.configuration(args));
		}
	}

	public static void cli(Engine engine, String[] args) throws Shell.Invocation.CheckedException {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		LOG.log(Level.INFO, "Invoked cli(String[] args) with " + args.length + " arguments.");
		for (int i=0; i<args.length; i++) {
			LOG.log(Level.INFO, "Argument " + i + " is: " + args[i]);
		}
		try {
			engine.cli(args);
		} catch (Throwable t) {
			t.printStackTrace();
			System.exit(255);
		}
	}
}