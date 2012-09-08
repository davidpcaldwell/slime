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