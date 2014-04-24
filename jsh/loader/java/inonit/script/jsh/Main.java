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

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.system.*;
import inonit.script.rhino.*;

public class Main {
	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	private List<String> args;

	private Shell.Configuration configuration;

	private Main() {
	}

	private static class CheckedException extends Exception {
		CheckedException(String message) {
			super(message);
		}

		CheckedException(String message, Throwable cause) {
			super(message, cause);
		}
	}

	private Integer run() throws CheckedException {
		Installation installation = null;
		Shell.Invocation invocation = null;
		if (System.getProperty("jsh.launcher.packaged") != null) {
			installation = new Installation() {
				public String toString() {
					return getClass().getName() + " [packaged]";
				}

				public Engine.Source getPlatformLoader(String path) {
					return Engine.Source.create("[slime]:" + path, ClassLoader.getSystemResourceAsStream("$jsh/loader/" + path));
				}

				public Engine.Source getRhinoLoader() {
					return Engine.Source.create("rhino.js", ClassLoader.getSystemResourceAsStream("$jsh/loader/rhino/literal.js"));
				}

				public Engine.Source getJshLoader() {
					InputStream in = ClassLoader.getSystemResourceAsStream("$jsh/jsh.js");
					if (in == null) {
						throw new RuntimeException("Not found in system class loader: $jsh/jsh.js" + "; system class path is " + System.getProperty("java.class.path"));
					}
					return Engine.Source.create("jsh.js", in);
				}

				public Code getShellModuleCode(String path) {
					return Code.system(
						"$jsh/modules/" + path + "/"
					);
				}

				public Plugin[] getPlugins() {
					String[] paths = System.getProperty("jsh.plugins").split("\\" + java.io.File.pathSeparator);
					ArrayList<Plugin> rv = new ArrayList<Plugin>();
					for (int i=0; i<paths.length; i++) {
						Plugin.addPluginsTo(rv, new File(paths[i]));
					}
					return rv.toArray(new Plugin[rv.size()]);
				}
			};

			invocation = new Shell.Invocation() {
				public Script getScript() {
					return Script.create(Engine.Source.create("main.jsh.js", ClassLoader.getSystemResourceAsStream("main.jsh.js")));
				}

				public String[] getArguments() {
					return (String[])args.toArray(new String[0]);
				}
			};
		} else {
			installation = Installation.unpackaged();

			final String scriptPath = args.remove(0);

			if (scriptPath.startsWith("http://") || scriptPath.startsWith("https://")) {
				final java.net.URL url;
				final java.io.InputStream stream;
				try {
					url = new java.net.URL(scriptPath);
					stream = url.openStream();
				} catch (java.net.MalformedURLException e) {
					throw new CheckedException("Malformed URL: " + scriptPath, e);
				} catch (IOException e) {
					throw new CheckedException("Could not open: " + scriptPath, e);
				}
				invocation = new Shell.Invocation() {
					public Script getScript() {
						return new Script() {
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
							public Engine.Source getSource() {
								return Engine.Source.create(scriptPath, stream);
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
					throw new CheckedException("File not found: " + scriptPath);
				}
				if (mainScript.isDirectory()) {
					throw new CheckedException("Filename: " + scriptPath + " is a directory");
				}

				invocation = new Shell.Invocation() {
					public Script getScript() {
						return Script.create(mainScript);
					}

					public String[] getArguments() {
						return (String[])args.toArray(new String[0]);
					}
				};
			}
		}

		this.configuration = new Shell.Configuration() {
			private InputStream stdin = new Logging.InputStream(System.in);
			//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
			//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
			//	ultimately buffering the stdout to the console or other ultimate destination.
			private OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
			//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
			//	device and bytes will never need to be immediately available
			private OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));

			public Engine.Log getLog() {
				return new Engine.Log() {
					public String toString() { return "Engine.Log: System.err"; }

					public void println(String message) {
						Logging.get().log(Main.class, Level.FINER, "Logging: " + message + " to System.err ...");
						((PrintStream)stderr).println(message);
					}
				};
			}

			public Engine.Debugger getDebugger() {
				String id = System.getProperty("jsh.script.debugger");
				if (id == null) return null;
				if (id.equals("rhino")) {
					Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
						@Override
						public void uncaughtException(Thread t, Throwable e) {
							if (t.getName().startsWith("AWT")) {
								//	do nothing
								Logging.get().log(Main.class, Level.INFO, "Swallowing AWT exception assumed to be caused by debugger.", e);
							} else {
								System.err.print("Exception in thread \"" + t.getName() + "\"");
								e.printStackTrace();
							}
						}
					});
					return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration() {
						public Engine.RhinoDebugger.Ui.Factory getUiFactory() {
							return Gui.RHINO_UI_FACTORY;
						}
					});
				} else if (id.equals("profiler")) {
					return new Engine.Profiler();
				} else if (id.startsWith("profiler:")) {
					return new Engine.Profiler();
				} else {
					//	TODO	emit some kind of error?
					return null;
				}
			}

			public int getOptimizationLevel() {
				int optimization = -1;
				if (System.getProperty("jsh.optimization") != null) {
					//	TODO	validate this value
					optimization = Integer.parseInt(System.getProperty("jsh.optimization"));
				}
				return optimization;
			}

			public ClassLoader getClassLoader() {
				return ClassLoader.getSystemClassLoader();
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

			@Override public Code.Source getPackagedCode() {
				if (System.getProperty("jsh.launcher.packaged") != null) {
					return Code.Source.system("$packaged/");
				} else {
					return null;
				}
			}
		};

		Integer rv = Shell.execute(
			installation,
			this.configuration,
			invocation
		);

		return rv;
	}

	private static void exit(int status) {
		System.exit(status);
	}

	public static void main(String[] args) throws Throwable {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Logging.get().log(Main.class, Level.INFO, "Starting script: arguments = %s", Arrays.asList(args));
		Main main = new Main();
		main.args = new ArrayList();
		main.args.addAll( Arrays.asList(args) );
		try {
			Integer status = main.run();
			Logging.get().log(Main.class, Level.INFO, "Exiting normally with status %d.", status);
			if (status != null) {
				exit(status.intValue());
			} else {
				main.configuration.getEngine().getDebugger().destroy();
				//	JVM will exit normally when non-daemon threads complete.
			}
		} catch (CheckedException e) {
			Logging.get().log(Main.class, Level.INFO, "Exiting with checked exception.", e);
			System.err.println(e.getMessage());
			exit(1);
		} catch (Throwable t) {
			Logging.get().log(Main.class, Level.SEVERE, "Exiting with throwable.", t);
			Throwable target = t;
			System.err.println("Error executing " + Main.class.getName());
			String argsString = "";
			for (int i=0; i<args.length; i++) {
				argsString += args[i];
				if (i+1 != args.length) {
					argsString += ",";
				}
			}
			System.err.println("Arguments " + argsString);
			System.err.println("System properties " + System.getProperties().toString());
			System.err.println("Heap size: max = " + Runtime.getRuntime().maxMemory());
			System.err.println("Heap size: free = " + Runtime.getRuntime().freeMemory());
			System.err.println("Stack trace of error:");
			while(target != null) {
				if (target != t) {
					System.err.println("Caused by:");
				}
				System.err.println(target.getClass().getName() + ": " + target.getMessage());
				StackTraceElement[] elements = target.getStackTrace();
				for (int i=0; i<elements.length; i++) {
					StackTraceElement e = elements[i];
					System.err.println("\tat " + e);
				}
				target = target.getCause();
			}
			exit(1);
		}
	}
}