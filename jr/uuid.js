/*
File: Math.uuid.js
Version: 1.0
Change History:
  v1.0 - first release
  v1.1 - less code and 2x performance boost (by minimizing calls to Math.random())
  v1.2 - Add support for generating non-standard uuids of arbitrary length
  v1.3 - Fixed IE7 bug (can't use []'s to access string chars.  Thanks, Brian R.)
  v1.4 - Changed method to be "Math.uuid". Added support for radix argument.  Use module pattern for better encapsulation.

Latest version:   http://www.broofa.com/Tools/Math.uuid.js
Information:      http://www.broofa.com/blog/?p=151
Contact:          robert@broofa.com
----
Copyright (c) 2008, Robert Kieffer
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of Robert Kieffer nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Create and return a "version 4" RFC-4122 UUID string.
 */

/*
** 6/22/09: Note this is version 1.4 w/o the radix stuff, or more
** accurately version 1.0 with some of the later improvements,
** like version 1.3 and the module pattern.
*/
var jr_get_uuid		= (function() {
	// Private array of chars to use
	
	var		itoh	= '0123456789ABCDEF'.split('');


return function () {

	var		uuid		= [];

	// Add '-'s
	uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';

						// Conform to RFC-4122, section 4.4
	uuid[14] = '4';		// Set 4 high bits of time_high field to version

	for (var i = 0; i <36; i++) {
		if (! uuid[i]) {
			uuid[i] = itoh[ Math.floor(Math.random() * 16) ];
		}
	}

	var value = (uuid[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence

	if (value < 8 || value > 11) {
		value = 8;
	}

	uuid[19] = itoh[value];
	/*
	** 2-19-2013: was :
	**		uuid[19] = (uuid[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence
	**
	** But this returned the following: 8cd1a025-6868-4891-10d79-ec0b8875afb8
	** and one other with a 5 digit middle term, also starting with 10, like 10BCA.
	** Looks like rather than 'a' it's setting 10.
	** The spec for random uuid's is: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	** where y is 8, 9, 'a', 'b'.
	*/

	return uuid.join('');
};
})();

