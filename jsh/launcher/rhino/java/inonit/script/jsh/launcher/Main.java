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

package inonit.script.jsh.launcher;

import java.util.*;

public class Main {
	private String slash = java.io.File.separator;
	private String colon = java.io.File.pathSeparator;

	private boolean debug;

	private Main() {
		this.debug = (System.getenv("JSH_DEBUG") != null);
	}

	private void run(String[] args) {
		java.net.URL codeLocation = Main.class.getProtectionDomain().getCodeSource().getLocation();
		String codeUrlString = codeLocation.toExternalForm();
		java.io.File JSH_HOME = null;
		if (codeUrlString.startsWith("file:") && codeUrlString.endsWith("jsh.jar")) {
			//	Assume we loaded this from JSH_HOME
			if (codeUrlString.charAt(7) == ':') {
				//	Windows
				JSH_HOME = new java.io.File(codeUrlString.substring("file:/".length(), codeUrlString.length()-"jsh.jar".length()-1));
			} else {
				//	UNIX
				JSH_HOME = new java.io.File(codeUrlString.substring("file:".length(), codeUrlString.length()-"jsh.jar".length()-1));
			}
		}
		try {
			if (debug) {
				if (JSH_HOME != null) {
					System.err.println("JSH_HOME = " + JSH_HOME.getCanonicalPath());
				} else {
					System.err.println("JSH_HOME = null");
				}
			}
			if (JSH_HOME != null) {
				System.setProperty("jsh.home", JSH_HOME.getCanonicalPath());
			}
		} catch (java.io.IOException e) {
		}

		String JSH_RHINO_CLASSPATH = null;
		try {
			//	TODO	Right now we assume that JSH_RHINO_CLASSPATH is in native OS format, but we should not assume that: under
			//			Cygwin, it would be better to allow the use of a Cygwin path here.
			//			In terms of solutions, it is not easy: how will this program detect Cygwin? It may be the best way to do it
			//			is to use the cygpath command blindly and see what happens. Then we will know whether Cygwin is in the
			//			PATH
			if (System.getenv("JSH_RHINO_CLASSPATH") != null) {
				JSH_RHINO_CLASSPATH = System.getenv("JSH_RHINO_CLASSPATH");
				try {
					JSH_RHINO_CLASSPATH = inonit.system.OperatingSystem.get().getCommandOutput("cygpath", new String[] { "-wp", System.getenv("JSH_RHINO_CLASSPATH") });
					JSH_RHINO_CLASSPATH = JSH_RHINO_CLASSPATH.substring(0,JSH_RHINO_CLASSPATH.length()-1);
				} catch (java.io.IOException e) {
					//	Must not be Cygwin
				}
			} else if (JSH_HOME != null) {
				JSH_RHINO_CLASSPATH = new java.io.File(JSH_HOME, "lib/js.jar").getCanonicalPath();
			}
			if (JSH_RHINO_CLASSPATH != null) {
				System.setProperty("jsh.classpath.rhino", JSH_RHINO_CLASSPATH);
			} else {
				throw new RuntimeException("No Rhino classpath: JSH_RHINO_CLASSPATH = "
					+ System.getenv("JSH_RHINO_CLASSPATH")
					+ " codeUrl=" + codeUrlString
				);
			}
		} catch (java.io.IOException e) {
		}
		if (debug) System.err.println("Launcher: JSH_RHINO_CLASSPATH = " + JSH_RHINO_CLASSPATH);
		List<String> pathElements = new ArrayList<String>();
		pathElements.addAll(Arrays.asList(JSH_RHINO_CLASSPATH.split(colon)));
//		pathElements.add(System.getProperty("sun.boot.library.path"));
		java.net.URL[] urls = new java.net.URL[pathElements.size()];
		for (int i=0; i<pathElements.size(); i++) {
			if (debug) System.err.println("Path element = " + pathElements.get(i));
			try {
				urls[i] = new java.io.File(pathElements.get(i)).toURI().toURL();
			} catch (java.net.MalformedURLException e) {
			}
		}
		ClassLoader loader = new java.net.URLClassLoader(urls);

		String JSH_RHINO_JS = null;
		String RHINO_JS = null;
		try {
			//	TODO	Right now we assume that JSH_RHINO_SCRIPT is in native OS format, but we should not assume that: under
			//			Cygwin, it would be better to allow the use of a Cygwin path here. See above.
			if (System.getenv("JSH_RHINO_SCRIPT") != null) {
				JSH_RHINO_JS = System.getenv("JSH_RHINO_SCRIPT");
			} else {
				if (JSH_HOME != null) {
					JSH_RHINO_JS = JSH_HOME.getCanonicalPath() + slash + "script" + slash + "launcher" + slash + "jsh.rhino.js";
				}
			}
			if (JSH_RHINO_JS != null) {
				RHINO_JS = new java.io.File(new java.io.File(JSH_RHINO_JS).getParentFile(), "api.rhino.js").getCanonicalPath();				
			}
			if (JSH_RHINO_JS == null || !new java.io.File(JSH_RHINO_JS).exists() || !new java.io.File(RHINO_JS).exists()) {
				throw new RuntimeException("Could not find jsh.rhino.js and api.rhino.js: JSH_RHINO_SCRIPT = "
					+ System.getenv("JSH_RHINO_SCRIPT") + " JSH_HOME = " + JSH_HOME
				);
			}
		} catch (java.io.IOException e) {
		}
		if (debug) System.err.println("JSH_RHINO_JS = " + JSH_RHINO_JS);
		if (debug) System.err.println("RHINO_JS = " + RHINO_JS);

		try {
			String mainClassName = (System.getenv("JSH_DEBUG") != null) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			//	TODO	Allow launch of launcher in debugger?
			Class shell = loader.loadClass(mainClassName);
			java.lang.reflect.Method main = shell.getMethod("main", new Class[] { String[].class });
			if (debug) System.err.println("Rhino shell main = " + main);
			List arguments = new ArrayList();
			arguments.add("-opt");
			arguments.add("-1");
			arguments.add("-f");
			arguments.add(RHINO_JS);
			arguments.add(JSH_RHINO_JS);
			arguments.addAll(Arrays.asList(args));
			if (debug) System.err.println("Rhino shell arguments:");
			if (debug) {
				for (int i=0; i<arguments.size(); i++) {
					System.err.println("Rhino shell argument = " + arguments.get(i));
				}
			}
			main.invoke(null, new Object[] { arguments.toArray(new String[0]) });
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (NoSuchMethodException e) {
			e.printStackTrace();
		} catch (IllegalAccessException e) {
			e.printStackTrace();
		} catch (java.lang.reflect.InvocationTargetException e) {
			e.printStackTrace();
		}
		//	Ensure the VM exits even if the debugger is displayed
		System.exit(0);
	}

	public static void main(String[] args) {
		new Main().run(args);
	}
}