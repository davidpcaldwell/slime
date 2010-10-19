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
	private boolean debug;

	private List args;
	
	private Main() {
	}
	
	private static class CheckedException extends Exception {
		CheckedException(String message) {
			super(message);
		}
	}
	
	private int run() throws CheckedException {
		if (System.getProperty("jsh.script.debugger") != null) {
			debug = true;
		}

		String scriptPath = (String)args.remove(0);

		final File mainScript = new File(scriptPath);
		if (!mainScript.exists()) {
			throw new CheckedException("File not found: " + scriptPath);
		}
		if (mainScript.isDirectory()) {
			throw new CheckedException("Filename: " + scriptPath + " is a directory");
		}
		Shell.Host host = Shell.Host.create(
			new Shell.Installation() {
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

				class FileScript extends Shell.Installation.Script {
					private File f;

					FileScript(File f) {
						this.f = f;
					}

					public String getName() {
						try {
							return f.getCanonicalPath();
						} catch (java.io.IOException e) {
							throw new RuntimeException(e);
						}
					}

					public Reader getReader() {
						try {
							return new FileReader(f);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				}

				public Shell.Installation.Script load(String prefix, String name) {
					File file = getFile(prefix, name);
					if (file.exists()) {
						return new FileScript(file);
					} else {
						return null;
					}
				}

				public File getModulePath(String path) {
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

				public File getPlatformLoader() {
					return getFile("loader", "literal.js");
				}

				public File getRhinoLoader() {
					return getFile("rhino", "literal.js");
				}
			},
			new Shell.Host.Configuration() {
				Engine.Debugger getDebugger() {
					String id = System.getProperty("jsh.js.debugger");
					if (id == null) return null;
					if (id != null && id.equals("rhino")) {
						return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration());
					}
					//	TODO	emit some kind of error?
					return null;
				}

				int getOptimizationLevel() {
					int optimization = -1;
					if (System.getProperty("jsh.optimization") != null) {
						//	TODO	validate this value
						optimization = Integer.parseInt(System.getProperty("jsh.optimization"));
					}
					return optimization;
				}
			},
			new Shell.Invocation() {
				public File getScript() {
					return mainScript;
				}

				public String[] getArguments() {
					return (String[])args.toArray(new String[0]);
				}
			}
		);
		return host.execute();
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
