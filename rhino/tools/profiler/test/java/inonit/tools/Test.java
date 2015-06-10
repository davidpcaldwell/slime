//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.tools;

public class Test {
	private static void doIt() {
		System.err.println("Under profiler.");
		Object lock = new Object();
		try {
			synchronized(lock) {
				lock.wait(100);
			}
		} catch (Throwable t) {
		}
	}

	private static Class load(String name) {
		try {
			return Class.forName(name);
		} catch (ClassNotFoundException e) {
			return null;
		}
	}

	private static void environment() {
		System.err.println(load("inonit.tools.Profiler"));
		System.err.println(load("javassist.Loader"));
		//jsh.shell.echo(String(Packages.java.lang.System.getProperties().get("inonit.tools.Profiler")))
	}

	public static void main(String[] args) {
		doIt();
		environment();
		System.err.println("Finishing profiled application.");
	}
}