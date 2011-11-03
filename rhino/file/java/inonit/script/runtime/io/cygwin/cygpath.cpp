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
#include <sys/types.h>
#include <sys/stat.h>
#include <fts.h>

int main() {
	char buf[MAX_PATH+2];
	ssize_t size;
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
				size = cygwin_conv_path(CCP_POSIX_TO_WIN_A, buf+1, NULL, 0);
				cygwin_conv_path(CCP_POSIX_TO_WIN_A, buf+1, wbuf, size);
				std::cout << wbuf << "\n";
				break;
			case 'u':
				char ubuf[MAX_PATH+1];
				size = cygwin_conv_path(CCP_WIN_A_TO_POSIX, buf+1, NULL, 0);
				cygwin_conv_path(CCP_WIN_A_TO_POSIX, buf+1, ubuf, size);
				std::cout << ubuf << "\n";
				break;
			case 'l':
				char* paths[2];
				paths[0] = buf+1;
				paths[1] = NULL;
				FTS* fts = fts_open(paths,FTS_PHYSICAL,NULL);
				fts_read(fts);
				FTSENT* dir = fts_children(fts,0);
				while(dir != NULL)
				{
					if (dir->fts_info == FTS_DP) {
						continue;
					}
					std::cout << dir->fts_name;
					if (dir->fts_info == FTS_SL)
					{
						std::cout << "@";
					}
					else if (dir->fts_info == FTS_D)
					{
						std::cout << "/";
					}
					dir = dir->fts_link;
					if (dir != NULL)
					{
						std::cout << "|";
					}
				}
				fts_close(fts);
				std::cout << "\n";
				break;
			default:
				std::cerr << "Illegal argument:" << buf << "\n";
		}
	}
}
