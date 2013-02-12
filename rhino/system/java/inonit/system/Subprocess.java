//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system;

public class Subprocess {
	public static abstract class Listener {
		public abstract void interrupted(InterruptedException e);
		public abstract void finished(int status);
	}

	private Command.Process p;

	Subprocess(Command.Process p) {
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