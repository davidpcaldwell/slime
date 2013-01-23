//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;

import inonit.script.rhino.*;

public class Main {
	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	private List<String> args;

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

	class PluginComparator implements Comparator<File> {
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

	private void addPluginsTo(List<Shell.Installation.Plugin> rv, File file) {
		if (file.exists()) {
			if (file.isDirectory()) {
				if (new File(file, "plugin.jsh.js").exists()) {
					//	interpret as unpacked module
					rv.add(Shell.Installation.Plugin.unpacked(file));
				} else {
					//	interpret as directory of slime
					File[] list = file.listFiles();
					Arrays.sort(list, new PluginComparator());
					for (File f : list) {
						addPluginsTo(rv, f);
					}
				}
			} else if (file.getName().endsWith(".slime")) {
				try {
					Shell.Installation.Plugin p = Shell.Installation.Plugin.slime(file);
					if (p != null) {
						rv.add(p);
					}
				} catch (IOException e) {
					//	TODO	probably error message or warning
				}
			} else if (file.getName().endsWith(".jar")) {
				rv.add(Shell.Installation.Plugin.jar(file));
			} else {
				//	Ignore, not .slime or directory
				//	TODO	probably log message of some kind
			}
		}
	}

	private int run() throws CheckedException {
		Shell.Installation installation = null;
		Shell.Invocation invocation = null;
		if (System.getProperty("jsh.launcher.packaged") != null) {
			installation = new Shell.Installation() {
				public String toString() {
					return getClass().getName() + " [packaged]";
				}

				public Engine.Source getPlatformLoader() {
					return Engine.Source.create("loader.js", ClassLoader.getSystemResourceAsStream("$jsh/loader.js"));
				}

				public Engine.Source getRhinoLoader() {
					return Engine.Source.create("rhino.js", ClassLoader.getSystemResourceAsStream("$jsh/rhino.js"));
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
						addPluginsTo(rv, new File(paths[i]));
					}
					return rv.toArray(new Plugin[rv.size()]);
				}

				public Code.Source getPackagedCode() {
					return Code.Source.system(
						"$packaged/"
					);
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
			installation = new Shell.Installation() {
				public String toString() {
					return getClass().getName()
						+ " jsh.library.scripts=" + System.getProperty("jsh.library.scripts")
						+ " jsh.library.scripts.jsh=" + System.getProperty("jsh.library.scripts.jsh")
					;
				}

				File getFile(String prefix, String name) {
					String propertyName = "jsh.library.scripts." + prefix.replace('/', '.');
					if (System.getProperty(propertyName) != null) {
						File dir = new File(System.getProperty(propertyName));
						return new File(dir, name);
					} else if (System.getProperty("jsh.library.scripts") != null) {
						File root = new File(System.getProperty("jsh.library.scripts"));
						File dir = new File(root, prefix);
						return new File(dir, name);
					} else {
						throw new RuntimeException("Script not found: " + prefix + "/" + name);
					}
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

				public Engine.Source getPlatformLoader() {
					return Engine.Source.create(getFile("loader", "literal.js"));
				}

				public Engine.Source getRhinoLoader() {
					return Engine.Source.create(getFile("rhino", "literal.js"));
				}

				public Engine.Source getJshLoader() {
					return Engine.Source.create(getFile("jsh", "jsh.js"));
				}

				public Code getShellModuleCode(String path) {
					return Code.slime(getModulePath(path));
				}

				private void addPluginsTo(List<Plugin> rv, String property) {
					if (property != null) {
						String[] tokens = property.split(File.pathSeparator);
						for (String token : tokens) {
							File file = new File(token);
							Main.this.addPluginsTo(rv, file);
						}
					}
				}

				public Plugin[] getPlugins() {
					ArrayList<Plugin> rv = new ArrayList<Plugin>();
					addPluginsTo(rv, System.getProperty("jsh.library.modules"));
					//	Defaults for jsh.plugins: installation modules directory? Probably obsolete given that we will be loading
					//	them. $HOME/.jsh/plugins?
					addPluginsTo(rv, System.getProperty("jsh.plugins"));
					return rv.toArray(new Plugin[rv.size()]);
				}

				public Code.Source getPackagedCode() {
					return null;
				}
			};

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
		return Shell.execute(
			installation,
			new Shell.Configuration() {
				public Engine.Log getLog() {
					return new Engine.Log() {
						public void println(String message) {
							System.err.println(message);
						}
					};
				}

				public Engine.Debugger getDebugger() {
					String id = System.getProperty("jsh.script.debugger");
					if (id == null) return null;
					if (id.equals("rhino")) {
						return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration());
					} else if (id.equals("profiler")) {
						return new Engine.Profiler();
					} else if (id.startsWith("profiler:")) {
						return new Engine.Profiler();
					} else {
						//	TODO	emit some kind of error?
					}
					return null;
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

				public Map getEnvironment() {
					return System.getenv();
				}

				public Stdio getStdio() {
					return new Stdio() {
						public InputStream getStandardInput() {
							return System.in;
						}

						public OutputStream getStandardOutput() {
							return System.out;
						}

						public OutputStream getStandardError() {
							return System.err;
						}
					};
				}
			},
			invocation
		);
	}

	public static void main(String[] args) throws Throwable {
		Main main = new Main();
		main.args = new ArrayList();
		main.args.addAll( Arrays.asList(args) );
		try {
			int status = main.run();
			System.exit(status);
		} catch (CheckedException e) {
			System.err.println(e.getMessage());
			System.exit(1);
		} catch (Throwable t) {
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
			System.exit(1);
		}
	}
}