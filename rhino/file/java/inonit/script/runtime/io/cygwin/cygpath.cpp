//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
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
				FTS* fts = fts_open(paths,FTS_PHYSICAL||FTS_COMFOLLOW,NULL);
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