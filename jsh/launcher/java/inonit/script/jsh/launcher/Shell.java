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

package inonit.script.jsh.launcher;

import java.io.*;
import java.net.*;

public abstract class Shell {
	abstract ClassLoader getRhinoClassLoader() throws IOException;

	abstract URL getJrunscriptApi() throws IOException;
	abstract URL getLauncherScript() throws IOException;

	private URL[] specifiedRhino;

	final void setRhinoClasspath(URL[] urls) {
		this.specifiedRhino = urls;
	}

	abstract URL[] getDefaultRhinoClasspath();

	public final URL[] getRhinoClasspath() {
		if (specifiedRhino != null) return specifiedRhino;
		return getDefaultRhinoClasspath();
	}

	public abstract File getHome();
	public abstract File getPackaged();

	static Shell packaged(File file) {
		return new PackagedShell(file);
	}

	static Shell built(File home) throws IOException {
		return new BuiltShell(home);
	}

	static Shell unbuilt(String src) {
		File sourceroot = new File(src);
		return new UnbuiltShell(sourceroot);
	}

	private static class PackagedShell extends Shell {
		private File file;

		PackagedShell(File file) {
			this.file = file;
		}

		ClassLoader getRhinoClassLoader() {
			//	In earlier versions of the launcher and packager, Rhino was packaged at the following location inside the packaged
			//	JAR file. However, for some reason, loading Rhino using the below ClassLoader did not work. As a workaround, the
			//	packager now unzips Rhino and we simply load it from the system class loader.
			try {
				Class.forName("org.mozilla.javascript.Context");
				return ClassLoader.getSystemClassLoader();
			} catch (ClassNotFoundException e) {
				if (ClassLoader.getSystemResource("$jsh/rhino.jar") != null) {
					return new java.net.URLClassLoader(new java.net.URL[] { ClassLoader.getSystemResource("$jsh/rhino.jar") });
				} else {
					return new java.net.URLClassLoader(new java.net.URL[] {});
				}
			}
		}

		@Override URL getJrunscriptApi() throws IOException {
			return ClassLoader.getSystemResource("$jsh/launcher/jsh.js");
		}

		@Override URL getLauncherScript() throws IOException {
			return ClassLoader.getSystemResource("$jsh/launcher/launcher.js");
		}

		URL[] getDefaultRhinoClasspath() {
			//	TODO	should we return something more useful?
			try {
				Class.forName("org.mozilla.javascript.Context");
				//	we leave classpath blank because this is supposed to be a Rhino-specific classpath; it is supplied to loader
				//	as the first element of its classpath and if we use the system class loader, nothing can override the other
				//	classpath parts (like the shell classpath)
				//	TODO	revisit this; is this important?
				return new java.net.URL[0];
//				return ((URLClassLoader)ClassLoader.getSystemClassLoader()).getURLs();
			} catch (ClassNotFoundException e) {
				if (ClassLoader.getSystemResource("$jsh/rhino.jar") != null) {
					return new java.net.URL[] { ClassLoader.getSystemResource("$jsh/rhino.jar") };
				} else {
					return null;
				}
			}
		}

		public File getHome() {
			return null;
		}

		public File getPackaged() {
			return file;
		}
	}

	private static abstract class UnpackagedShell extends Shell {
		private String colon = java.io.File.pathSeparator;
		private ClassLoader rhinoClassLoader;

		final ClassLoader getRhinoClassLoader() throws IOException {
			if (rhinoClassLoader == null) {
				URL[] JSH_RHINO_CLASSPATH = getRhinoClasspath();
				if (JSH_RHINO_CLASSPATH == null) {
					rhinoClassLoader = new java.net.URLClassLoader(new java.net.URL[0]);
				} else {
					rhinoClassLoader = new java.net.URLClassLoader(JSH_RHINO_CLASSPATH);
				}
			}
			return rhinoClassLoader;
		}

		abstract URL[] getDefaultRhinoClasspath();

		public File getPackaged() {
			return null;
		}
	}

	private static class UnbuiltShell extends UnpackagedShell {
		private File sourceroot;

		UnbuiltShell(File sourceroot) {
			this.sourceroot = sourceroot;
		}

		public String toString() {
			return "Unbuilt: sourceroot=" + sourceroot + " rhino=" + getRhinoClasspath();
		}

		URL getJrunscriptApi() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "rhino/jrunscript/api.js").getCanonicalFile().toURI().toURL();
		}

		URL getLauncherScript() throws IOException {
			if (sourceroot == null) return null;
			return new File(sourceroot, "jsh/launcher/launcher.js").getCanonicalFile().toURI().toURL();
		}

		URL[] getDefaultRhinoClasspath() {
			return null;
		}

		public File getHome() {
			return null;
		}
	}

	private static class BuiltShell extends UnpackagedShell {
		private java.io.File HOME;
		private URL[] rhino;
		private URL jrunscript;
		private URL launcher;

		BuiltShell(java.io.File HOME) throws java.io.IOException, MalformedURLException {
			this.HOME = HOME.getCanonicalFile();
			File rhino = new java.io.File(this.HOME, "lib/js.jar");
			if (rhino.exists()) {
				this.rhino = new URL[] { rhino.toURI().toURL() };
			} else {
				this.rhino = new URL[0];
			}
			this.jrunscript = new java.io.File(this.HOME, "jsh.js").toURI().toURL();
			this.launcher = new java.io.File(this.HOME, "launcher.js").toURI().toURL();
		}

		public String toString() {
			return "BuiltShell: HOME=" + HOME;
		}

		URL getJrunscriptApi() {
			return jrunscript;
		}

		URL getLauncherScript() {
			return launcher;
		}

		URL[] getDefaultRhinoClasspath() {
			return rhino;
		}

		public File getHome() {
			return HOME;
		}
	}

}