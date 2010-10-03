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
	
	private String read(Reader reader) throws IOException {
		ArrayList lines = new ArrayList();
		BufferedReader r = new BufferedReader(reader);
		String s;
		while( (s = r.readLine()) != null ) {
			if (s.startsWith("#")) {
				//	ignore, but add line to get correct line numbers (at least for now)
				lines.add( "" );
			} else {
				lines.add( s );
			}
		}
		StringBuffer rv = new StringBuffer();
		for (int i=0; i<lines.size(); i++) {
			rv.append((String)lines.get(i));
			rv.append("\n");
		}
		return rv.toString();
	}
	
	private static class ScriptVariable extends Engine.Program.Variable.Value {
		public Object get(Context context, Scriptable scope) {
			return context.newObject(scope);
		}
	}
	
	private void emitErrorMessage(java.io.PrintStream err, Engine.Errors.ScriptError e) {
		err.println("[jsh] " + e.getSourceName() + ":" + e.getLineNumber() + ": " + e.getMessage());
		String errCaret = "";
		//	TODO	This appears to be null even when it should not be.
		if (e.getLineSource() != null) {
			for (int i=0; i<e.getLineSource().length(); i++) {
				char c = e.getLineSource().charAt(i);
				if (i < e.getColumn()-1) {
					if (c == '\t') {
						errCaret += "\t";
					} else {
						errCaret += " ";
					}
				} else if (i == e.getColumn()-1) {
					errCaret += "^";
				}
			}
			err.println("[jsh] " + e.getLineSource());
			err.println("[jsh] " + errCaret);
		}
		if (e.getStackTrace() != null) {
			err.println(e.getStackTrace());
		}
		err.println();
	}
	
	private int run() throws CheckedException {
		if (System.getProperty("jsh.js.debugger") != null) {
			debug = true;
		}

		String scriptPath = (String)args.remove(0);

		if (debug) {
			System.err.println("JAVA_HOME = " + System.getenv("JAVA_HOME"));
			System.err.println("java.home = " + System.getProperty("java.home"));
			System.err.println("sun.boot.library.path = " + System.getProperty("sun.boot.library.path"));
			System.err.println("java.library.path = " + System.getProperty("java.library.path"));
		}
		
		ScriptHost host = ScriptHost.create(new ScriptHost.Configuration() {
			private ScriptHost.Bootstrap loader = new ScriptHost.Bootstrap() {
				public String toString() {
					return getClass().getName() 
						+ " scripts=" + System.getProperty("jsh.library.scripts") 
						+ " scripts.loader=" + System.getProperty("jsh.library.scripts.loader")
						+ " scripts.rhino=" + System.getProperty("jsh.library.scripts.rhino")
						+ " scripts.jsh=" + System.getProperty("jsh.library.scripts.jsh")
						+ " modules=" + System.getProperty("jsh.library.modules")
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
				
				class FileScript extends ScriptHost.Script {
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
				
				public ScriptHost.Script load(String prefix, String name) {
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
			};
				
			Engine.Debugger getDebugger() {
				String id = System.getProperty("jsh.js.debugger");
				if (id == null) return null;
				if (id != null && id.equals("rhino")) {
					return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration());
				}
				//	TODO	emit some kind of error?
				return null;
			}
			
			String[] getArguments() {
				return (String[])args.toArray(new String[0]);
			}
			
			int getOptimizationLevel() {
				int optimization = -1;
				if (System.getProperty("jsh.optimization") != null) {
					//	TODO	validate this value
					optimization = Integer.parseInt(System.getProperty("jsh.optimization"));
				}
				return optimization;
			}
			
			ScriptHost.Bootstrap getLoader() {
				return loader;
			}
		});
		
		File mainScript = new File(scriptPath);
		if (!mainScript.exists()) {
			throw new CheckedException("File not found: " + scriptPath);
		}
		if (mainScript.isDirectory()) {
			throw new CheckedException("Filename: " + scriptPath + " is a directory");
		}
		host.setMain(mainScript);
		int status = 0;
		try {
			host.execute();
		} catch (Engine.Errors e) {
			Engine.Errors.ScriptError[] errors = e.getErrors();
			boolean skip = false;
			for (int i=0; i<errors.length; i++) {
				Throwable t = errors[i].getThrowable();
				if (t instanceof WrappedException) {
					WrappedException wrapper = (WrappedException)t;
					if (wrapper.getWrappedException() instanceof ScriptHost.ExitException) {
						status = ((ScriptHost.ExitException)wrapper.getWrappedException()).getStatus();
						skip = true;
					}
				}
			}
			if (!skip) {
				System.err.println();
				System.err.println("[jsh] Script halted because of " + errors.length + " errors.");
				System.err.println();
				status = 1;
				for (int i=0; i<errors.length; i++) {
					emitErrorMessage(System.err, errors[i]);
				}
			}
		}
		return status;
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
