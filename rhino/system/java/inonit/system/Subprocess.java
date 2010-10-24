//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME operating system interface.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.system;

public class Subprocess {
	public static abstract class Listener {
		public abstract void interrupted(InterruptedException e);
		public abstract void finished(int status);
	}

	private Process p;

	Subprocess(Process p) {
		this.p = p;
	}
	
	public void wait(Listener listener) {
		try {
			int status = p.waitFor();
			listener.finished(status);
		} catch (InterruptedException e) {
			listener.interrupted(e);
		}
	}

	public void terminate() {
		p.destroy();
	}
}
