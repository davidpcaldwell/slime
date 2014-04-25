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

import inonit.system.*;
import inonit.script.engine.*;

public class Shell {
	public static abstract class Configuration {
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Stdio getStdio();

		/**
		 *
		 *	@return An object capable of loading modules bundled with a script if this is a packaged application, or
		 *	<code>null</code> if it is not.
		 */
		public abstract Code.Source getPackagedCode();

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
		
		static Configuration main() {
			return new Shell.Configuration() {
				private InputStream stdin = new Logging.InputStream(System.in);
				//	We assume that as long as we have separate launcher and loader processes, we should immediately flush stdout
				//	whenever it is written to (by default it only flushes on newlines). This way the launcher process can handle
				//	ultimately buffering the stdout to the console or other ultimate destination.
				private OutputStream stdout = new Logging.OutputStream(inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(System.out), "stdout");
				//	We do not make the same assumption for stderr because we assume it will always be written to a console-like
				//	device and bytes will never need to be immediately available
				private OutputStream stderr = new PrintStream(new Logging.OutputStream(System.err, "stderr"));

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
		}
	}
}