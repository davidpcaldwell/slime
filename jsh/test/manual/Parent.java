//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

import java.io.*;

public class Parent {
	private static class Spooler implements Runnable {
		private InputStream in;
		private OutputStream out;

		static void start(InputStream in, OutputStream out) {
			Spooler s = new Spooler();
			s.in = in;
			s.out = out;
			Thread t = new Thread(s);
			t.setDaemon(true);
			t.start();
		}

		public void run() {
			try {
				int i;
				while((i = in.read()) != -1) {
					if (in == System.in) {
//						System.err.println("Read char from System.in in parent: " + i);
					}
					out.write(i);
					out.flush();
				}
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
	}

	public static void main(String[] args) throws IOException, InterruptedException {
		Process p = Runtime.getRuntime().exec(new String[] { "java", "-classpath", System.getProperty("java.class.path"), "Stdio" });
		Spooler.start(System.in, p.getOutputStream());
		Spooler.start(p.getErrorStream(), System.err);
		Spooler.start(p.getInputStream(), System.out);
		p.waitFor();
	}
}