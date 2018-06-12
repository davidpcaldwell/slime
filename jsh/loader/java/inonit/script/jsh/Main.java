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
		static Code.Source create(String string) {
			if (string.startsWith("http://") || string.startsWith("https://")) {
				try {
					return Code.Source.bitbucketApiVersionOne(new URL(string));
				} catch (MalformedURLException e) {
					throw new RuntimeException(e);
				}
			} else {
				return Code.Source.create(new File(string));
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
			final Shell.Extensions plugins;
			try {
				plugins = Shell.Extensions.create(getPackagedPluginsDirectory());
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			//	TODO	better hierarchy would probably be $jsh/loader/slime and $jsh/loader/jsh
			final Code.Source platform = Code.Source.system("$jsh/loader/");
			final Code.Source jsh = Code.Source.system("$jsh/");
			return new Shell.Installation() {
				@Override public Code.Source getPlatformLoader() {
					return platform;
				}

				@Override public Code.Source getJshLoader() {
					return jsh;
				}

				@Override public Code.Source getLibraries() {
					//	TODO	This is obviously wrong and we ought to be able to package libraries
					return Code.Source.NULL;
				}

				@Override public Shell.Extensions getExtensions() {
					return plugins;
				}
			};
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
		abstract Code.Source getLoader();
		abstract Code.Source getJsh();
		abstract Code.Source getLibraries();
		abstract Code.Source getModules();
		abstract Code.Source getShellPlugins();

		final Shell.Installation installation() throws IOException {
			//	TODO	previously user plugins directory was not searched for libraries. Is this right?
			final Shell.Extensions plugins = Shell.Extensions.create(new Shell.Extensions[] {
				Shell.Extensions.create(this.getModules()),
				Shell.Extensions.create(this.getShellPlugins()),
				Shell.Extensions.create(new File(new File(System.getProperty("user.home")), ".inonit/jsh/plugins"))
			});
			return new Shell.Installation() {
				@Override public Code.Source getPlatformLoader() {
					return Unpackaged.this.getLoader();
				}

				@Override public Code.Source getJshLoader() {
					return Unpackaged.this.getJsh();
				}

				@Override public Code.Source getLibraries() {
					return Unpackaged.this.getLibraries();
				}

				@Override public Shell.Extensions getExtensions() {
					return plugins;
				}
			};
		}

		private Code.Source.HttpConnector getHttpConnector() {
			if (System.getProperty("jsh.loader.user") != null) {
				return new Code.Source.HttpConnector() {
					@Override public void decorate(HttpURLConnection connection) {
						String user = System.getProperty("jsh.loader.user");
						String password = System.getProperty("jsh.loader.password");
						String authorization = "Basic "
							+ javax.xml.bind.DatatypeConverter.printBase64Binary(
								(user + ":" + password).getBytes()
							)
						;
						connection.addRequestProperty("Authorization", authorization);
					}
				};
			}
			return Code.Source.HttpConnector.NULL;
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
					final java.net.URL url = new java.net.URL(scriptPath);
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
									return Code.Source.File.create(url, getHttpConnector());
	//								return Code.Source.File.create(Code.Source.URI.create(url), scriptPath, null, null, stream);
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
		private Code.Source src;

		Unbuilt(Code.Source src) {
			this.src = src;
		}

		Code.Source getLoader() {
			return this.src.child("loader/");
//			return this.src.resolve("loader/").source();
		}

		Code.Source getJsh() {
			return this.src.child("jsh/loader/");
//			return this.src.resolve("jsh/loader/").source();
		}

		Code.Source getLibraries() {
			File file = new java.io.File(System.getProperty("jsh.shell.lib"));
			return Code.Source.create(file);
		}

		Code.Source getModules() {
			return this.src;
		}

		Code.Source getShellPlugins() {
			if (System.getProperty("jsh.shell.plugins") != null) {
				return Location.create(System.getProperty("jsh.shell.plugins"));
			}
			return Code.Source.NULL;
		}
	}

	private static class Built extends Unpackaged {
		private File home;

		Built(File home) {
			this.home = home;
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

		Code.Source getLibraries() {
			return Code.Source.create(new File(this.home, "lib"));
		}

		Code.Source getModules() {
			return Code.Source.create(new File(this.home, "modules"));
		}

		Code.Source getShellPlugins() {
			return Code.Source.create(new File(this.home, "plugins"));
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
			return new Unbuilt(Location.create(System.getProperty("jsh.shell.src")));
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
		LOG.log(Level.INFO, "Invoked cli(String[] args) with " + args.length + " arguments.");
		for (int i=0; i<args.length; i++) {
			LOG.log(Level.INFO, "Argument " + i + " is: " + args[i]);
		}
		engine.cli(args);
	}
}