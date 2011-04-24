//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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

import org.mozilla.javascript.*;

import inonit.script.rhino.*;

public class Main {
	private List args;
	
	private Main() {
	}
	
	private static class CheckedException extends Exception {
		CheckedException(String message) {
			super(message);
		}
	}
	
	private int run() throws CheckedException {
		Shell.Installation installation = null;
		Shell.Invocation invocation = null;
		if (System.getProperty("jsh.packaged") != null) {
			installation = new Shell.Installation() {
				public String toString() {
					return getClass().getName() + " [packaged]";
				}

				public Shell.Script getPlatformLoader() {
					return Shell.Script.create("loader.js", ClassLoader.getSystemResourceAsStream("$jsh/loader.js"));
				}

				public Shell.Script getRhinoLoader() {
					return Shell.Script.create("rhino.js", ClassLoader.getSystemResourceAsStream("$jsh/rhino.js"));
				}

				public Shell.Script getJshLoader() {
					return Shell.Script.create("jsh.js", ClassLoader.getSystemResourceAsStream("$jsh/jsh.js"));
				}

				public Module.Code getShellModuleCode(String path) {
					return Module.Code.create(
						Module.Code.Source.create(
							ClassLoader.getSystemClassLoader(),
							"$jsh/modules/" + path + "/"
						),
						"module.js"
					);
				}

				public Modules getApplicationModules() {
					return new Modules() {
						public Module.Code getCode(String path, String name) {
							return Module.Code.create(
								Module.Code.Source.create(
									ClassLoader.getSystemClassLoader(), "$modules/" + path + "/"
								),
								name
							);
						}
					};
				}
			};

			invocation = new Shell.Invocation() {
				public File getScriptFile() {
					return null;
				}

				public Shell.Script getScript() {
					return Shell.Script.create("main.jsh", ClassLoader.getSystemResourceAsStream("main.jsh"));
				}

				public String[] getArguments() {
					return (String[])args.toArray(new String[0]);
				}
			};
		} else {
			String scriptPath = (String)args.remove(0);

			final File mainScript = new File(scriptPath);
			if (!mainScript.exists()) {
				throw new CheckedException("File not found: " + scriptPath);
			}
			if (mainScript.isDirectory()) {
				throw new CheckedException("Filename: " + scriptPath + " is a directory");
			}
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

				public Shell.Script getPlatformLoader() {
					return Shell.Script.create(getFile("loader", "literal.js"));
				}

				public Shell.Script getRhinoLoader() {
					return Shell.Script.create(getFile("rhino", "literal.js"));
				}

				public Shell.Script getJshLoader() {
					return Shell.Script.create(getFile("jsh", "jsh.js"));
				}

				public Module.Code getShellModuleCode(String path) {
					return Module.Code.slime(getModulePath(path), "module.js");
				}

				public Modules getApplicationModules() {
					return null;
				}
			};

			invocation = new Shell.Invocation() {
				public File getScriptFile() {
					return mainScript;
				}

				public Shell.Script getScript() {
					return Shell.Script.create(mainScript);
				}

				public String[] getArguments() {
					return (String[])args.toArray(new String[0]);
				}
			};
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
					if (id != null && id.equals("rhino")) {
						return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration());
					}
					//	TODO	emit some kind of error?
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
			while(target != null) {
				System.err.println(target.getClass().getName() + ": " + target.getMessage());
				StackTraceElement[] elements = target.getStackTrace();
				for (int i=0; i<elements.length; i++) {
					StackTraceElement e = elements[i];
					System.err.println(e);
				}
				target = target.getCause();
			}
			System.exit(1);
		}
	}
}
