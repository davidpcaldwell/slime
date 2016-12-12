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
}