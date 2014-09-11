//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

public class Main {
	private Main() {
	}

	public static void initialize() {
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
	}
}