//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

#include <iostream>
#include <windows.h>
#include <sys/cygwin.h>

int main() {
	char buf[MAX_PATH+2];
	int more = 1;
	while(more) {
		std::cin.getline(buf,MAX_PATH+1);
		switch(buf[0]) {
			case '\0': 
				std::cout << "EOF";
				more = 0; 
				break;
			case 'w':
				char wbuf[MAX_PATH+1];
				cygwin_conv_to_win32_path(buf+1, wbuf);
				std::cout << wbuf << "\n";
				break;
			case 'u':
				char ubuf[MAX_PATH+1];
				cygwin_conv_to_posix_path(buf+1, ubuf);
				std::cout << ubuf << "\n";
				break;
			default:
				std::cerr << "Illegal argument:" << buf << "\n";
		}
	}
}
