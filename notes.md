# Notes

### Bitwise Math
Always remember - bitwise _always_ works at bit level

Byte concatenation:
 <pre>(a << 8 | b).toString(16)</pre>

Shift right divides number by 2:
<pre>(20 >> 1) = 10</pre>

The opposite for shift left:
<pre>(20 << 1) = 40</pre>

Bitmasking - helpful for retrieving specific bytes from a string (for example in OpCodes). First mask, then shif. For example to get the "5" from 0x5431:
<pre>
let mask = 0xF000;
let num = 0x5432;

let result = num & mask;

// result will now be 0x5000 - shift 5 right

let result = result >>> 12
</pre>

In binary these steps look like this: 

* num 0x5432 in Binary is  0101|0100|0011|0010
mask 0xF000 in Binary is 1111|0000|0000|0000
<br/>**Note** I'm splitting 4 bit segments with a pipe
* mask AND num will set the bits to 1 where they are 1 in both numbers so this will give us:
0101|0000|0000|0000
* then we shift right 12 bits, removing the righmost bits as they shift which leaves:
0101 which equals 5
</pre>

### Display
64x32 labelled 0,0 in the top left to 63,31 bottom right. Pixels are xor for collisions. Display wraps.

Sprites are 8x15 pixels. 1x15 bytes. See interpreter.js Dxyn function for details.

Convert a Hex byte to a string array of 1s and 0s:

<pre>(0xF0.toString(2).split(''))</pre>

### General

Wikipedia has better descriptions for OpCodes than other resources.

Uint8Array creates a fixed array of 8 bit integers.
Also Uint16Array and Uint32Array

Hex is written as 0x0[...]
Binary is written as 0b0[...]

## Memory Map
0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
0x200-0xFFF - Program ROM and work RAM

### Conversions:
b = bit
n = nibble
B = Byte
Kb = Kilobits
KB = Kilobytes
Mb = megabits
MB = megabytes
etc...

4b = 1n = 0x0 -> 0xF = 0 -> 15
8b = 1B = 0x00 -> 0x0F = 0 -> 255

1024B = 1KB