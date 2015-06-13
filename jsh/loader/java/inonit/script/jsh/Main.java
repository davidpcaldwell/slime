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

	private static void addPluginsTo(List<Code> rv, File file, boolean warn) {
		if (file.exists()) {
			if (file.isDirectory()) {
				if (new File(file, "plugin.jsh.js").exists()) {
					//	interpret as unpacked module
					Logging.get().log(Installation.class, Level.CONFIG, "Loading unpacked plugin from " + file + " ...");
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
						Logging.get().log(Installation.class, Level.WARNING, "Loading plugin from %s ...", file);
						rv.add(p);
					} else {
						Logging.get().log(Installation.class, Level.WARNING, "Found .slime file, but no plugin.jsh.js: %s", file);
					}
				} catch (IOException e) {
					//	TODO	probably error message or warning
				}
			} else if (!file.isDirectory() && file.getName().endsWith(".jar")) {
				Logging.get().log(Installation.class, Level.CONFIG, "Loading Java plugin from " + file + " ...");
				rv.add(Code.jar(file));
			} else {
				//	Ignore, exists but not .slime or .jar or directory
				//	TODO	probably log message of some kind
				if (warn) Logging.get().log(Installation.class, Level.WARNING, "Cannot load plugin from %s as it does not appear to contain a valid plugin", file);
			}
		} else {
			Logging.get().log(Installation.class, Level.CONFIG, "Cannot load plugin from %s; file not found", file);
		}
	}

	static void addPluginsTo(List<Code> rv, File file) {
		addPluginsTo(rv, file, true);
	}

	//	Called by applications to load plugins
	public static Code[] getPlugins(File file) {
		Logging.get().log(Installation.class, Level.INFO, "Application: load plugins from " + file);
		List<Code> rv = new ArrayList<Code>();
		addPluginsTo(rv, file);
		return rv.toArray(new Code[rv.size()]);
	}

	public static Shell.Environment shell() {
		return new Shell.Environment() {
			private InputStream stdin = new Logging.InputStream(System.in);
			//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
			//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
			//	ultimately buffering the stdout to the console or other ultimate destination.
			private OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
			//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
			//	device and bytes will never need to be immediately available
			private OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));

			public ClassLoader getClassLoader() {
				return Shell.Environment.class.getClassLoader();
			}

			public Properties getSystemProperties() {
				return System.getProperties();
			}

			public OperatingSystem.Environment getEnvironment() {
				return OperatingSystem.Environment.SYSTEM;
			}

			public Stdio getStdio() {
				return new Stdio() {
					public InputStream getStandardInput() {
						return stdin;
					}

					public OutputStream getStandardOutput() {
						return stdout;
					}

					public OutputStream getStandardError() {
						return stderr;
					}
				};
			}

			@Override public Packaged getPackaged() {
				if (System.getProperty("jsh.launcher.packaged") != null) {
					return new Packaged() {
						@Override
						public Code.Source getCode() {
							return Code.Source.system("$packaged/");
						}

						@Override
						public File getFile() {
							return new java.io.File(System.getProperty("jsh.launcher.packaged"));
						}
					};
				} else {
					return null;
				}
			}
		};
	}

	public static Shell.Invocation invocation(final File script, final String[] arguments) {
		return new Shell.Invocation() {
			@Override public String toString() {
				String rv = String.valueOf(script);
				for (String s : arguments) {
					rv += " " + s;
				}
				return rv;
			}

			@Override public Shell.Script getScript() {
				return Shell.Script.create(script);
			}

			@Override public String[] getArguments() {
				return arguments;
			}
		};
	}

	static Shell.Invocation packaged(final String[] arguments) {
		return new Shell.Invocation() {
			public Shell.Script getScript() {
				//	TODO	DRY with Installation.java; may go away as we refactor URI management
				return Shell.Script.create(Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/main.jsh.js"), "main.jsh.js", null, null, ClassLoader.getSystemResourceAsStream("main.jsh.js")));
			}

			public String[] getArguments() {
				return arguments;
			}
		};
	}

	static Shell.Invocation invocation(String[] arguments) throws Shell.Invocation.CheckedException {
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
						@Override
						public java.net.URI getUri() {
							try {
								return url.toURI();
							} catch (java.net.URISyntaxException e) {
								//	TODO	when can this happen? Probably should refactor to do this parsing earlier and use
								//			CheckedException
								throw new RuntimeException(e);
							}
						}

						@Override
						public Code.Source.File getSource() {
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
	public static Shell.Configuration.Installation unpackagedInstallation() {
		return new Shell.Configuration.Installation() {
			public String toString() {
				return getClass().getName()
					+ " jsh.library.scripts.loader=" + System.getProperty("jsh.library.scripts.loader")
					+ " jsh.library.scripts.jsh=" + System.getProperty("jsh.library.scripts.jsh")
					+ " jsh.library.modules=" + System.getProperty("jsh.library.modules")
					+ " jsh.plugins=" + System.getProperty("jsh.plugins")
				;
			}

//			File getFile(String prefix, String name) {
//				String propertyName = "jsh.library.scripts." + prefix;
//				if (System.getProperty(propertyName) != null) {
//					File dir = new File(System.getProperty(propertyName));
//					return new File(dir, name);
//				} else if (System.getProperty("jsh.library.scripts") != null) {
//					File root = new File(System.getProperty("jsh.library.scripts"));
//					File dir = new File(root, prefix);
//					return new File(dir, name);
//				} else {
//					throw new RuntimeException("Script not found: " + prefix + "/" + name);
//				}
//			}

			public Code.Source getPlatformLoader() {
				return Code.Source.create(new File(System.getProperty("jsh.library.scripts.loader")));
			}

			public Code.Source getJshLoader() {
				return Code.Source.create(new File(System.getProperty("jsh.library.scripts.jsh")));
			}

			private File getModulePath(String path) {
				String property = System.getProperty("jsh.library.modules");
				File directory = new File(property + "/" + path);
				File file = new File(property + "/" + path.replace('/', '.') + ".slime");
				if (directory.exists() && directory.isDirectory()) {
					return directory;
				} else if (file.exists()) {
					return file;
				}
				throw new RuntimeException("Not found: " + path + " jsh.library.modules=" + property);
			}

			public Code getShellModuleCode(String path) {
				return Code.slime(getModulePath(path));
			}

			public File[] getPluginRoots() {
				//	Defaults for jsh.plugins: installation modules directory? Probably obsolete given that we will be loading
				//	them. $HOME/.jsh/plugins?
				return getPluginRoots(System.getProperty("jsh.library.modules"), System.getProperty("jsh.plugins"));
			}
		};
	}

	public static Shell.Configuration.Installation packagedInstallation() {
		return new Shell.Configuration.Installation() {
			public String toString() {
				return getClass().getName() + " [packaged]";
			}

			//	TODO	the below mess was constructed to quickly get through adapting some APIs and should be revisited

			private Code.Source.File getPlatformLoader(String path) {
				return Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/platform/" + path),"[slime]:" + path, null, null, ClassLoader.getSystemResourceAsStream("$jsh/loader/" + path));
			}

			public Code.Source getPlatformLoader() {
				return new Code.Source() {
					@Override
					public Code.Source.File getFile(String path) throws IOException {
						return getPlatformLoader(path);
					}

					@Override
					public Code.Classes getClasses() {
						return null;
					}
				};
			}

			private Code.Source.File getJshLoader(String path) {
				InputStream in = ClassLoader.getSystemResourceAsStream("$jsh/" + path);
				if (in == null) {
					throw new RuntimeException("Not found in system class loader: $jsh/" + path + "; system class path is " + System.getProperty("java.class.path"));
				}
				return Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/jsh/" + path), "jsh/" + path, null, null, in);
			}

			public Code.Source getJshLoader() {
				return new Code.Source() {
					@Override
					public Code.Source.File getFile(String path) throws IOException {
						return getJshLoader(path);
					}

					@Override
					public Code.Classes getClasses() {
						return null;
					}
				};
			}

			public Code getShellModuleCode(String path) {
				return Code.system(
					"$jsh/modules/" + path + "/"
				);
			}

			public File[] getPluginRoots() {
				return getPluginRoots(System.getProperty("jsh.plugins"));
			}
		};
	}

	private static Shell.Configuration shell(final String[] arguments) throws Shell.Invocation.CheckedException {
		Logging.get().log(Main.class, Level.INFO, "Creating shell: arguments = %s", Arrays.asList(arguments));
		final Shell.Environment configuration = shell();
		if (System.getProperty("jsh.launcher.packaged") != null) {
			return new Shell.Configuration() {
				@Override public Shell.Configuration.Installation getInstallation() {
					return packagedInstallation();
				}

				@Override public Shell.Environment getEnvironment() {
					return configuration;
				}

				@Override public Shell.Invocation getInvocation() {
					return packaged(arguments);
				}
			};
		} else {
			if (arguments.length == 0) {
				throw new IllegalArgumentException("No arguments supplied; is this actually a packaged application? system properties = " + System.getProperties());
			}
			final Shell.Invocation invocation = invocation(arguments);
			return new Shell.Configuration() {
				@Override public Shell.Configuration.Installation getInstallation() {
					return unpackagedInstallation();
				}

				@Override public Shell.Environment getEnvironment() {
					return configuration;
				}

				@Override public Shell.Invocation getInvocation() {
					return invocation;
				}
			};
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

		public final Integer embed(String[] args) throws Shell.Invocation.CheckedException {
			Shell.Container.Holder context = new Shell.Container.Holder();
			return context.getExitCode(new Runner(), Main.shell(args));
		}

		public final void cli(String[] args) throws Shell.Invocation.CheckedException {
			shell(Shell.Container.VM, Main.shell(args));
		}
	}

	public static Integer run(Engine engine, String[] args) throws Shell.Invocation.CheckedException {
		return engine.embed(args);
	}
}