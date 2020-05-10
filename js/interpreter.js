/**
 * Chip-8 interpreter
 * Note - Uint8Array creates an array of 8 bit integers.
 * Hex in JS is written as 0x000.
 * Information on Chip-8 from:
 * http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
 * -----------------------------------------------------------------------------
 * Conversions:
 * 8 bits in 1 byte (so 0x00 = 0b00000000)
 * 1 byte range = 0-255 or (0b00000000 - 0b11111111) or (0x00 - 0xff)
 * 1024 bytes in a kilobyte
 */


/**
 *
Getting opcodes and params
Bitmask removes any bytes marked as 0 in the mask
let mask = 0xf00f;
let code = 0x8245;

if ((mask & code) == 0x8004) {console.log("Match");}
Shift >> will shift each number to the right the specified number of bytes -
each digit in hex is four bytes (0000 - 1111)

let p1 = (0x0f00 & code) >> 8;
let p2 = (0x00f0 & code) >> 4;
console.log(p1);
console.log(p2);

 */
export class CPU {
	constructor(arrayBuffer) {

		this.arrayBuffer = arrayBuffer || null;

		// Memory 4 kilobytes (4096 bytes). Note that programs should be loaded
		// in from address 0x200 - some programs start at 0x600 (TODO: how to 
		// tell the difference?)
		this.memory = new Uint8Array(4096);

		// Registers - 16 8-bit registers labelled Vx where x = hex register
		// value 0-f
		this.registers = new Uint8Array(16);

		// Stack
		this.stack = new Uint16Array(16);

		// Special register I
		this.I = 0x00;

		// 8 bit delay timer - when this is non-zero is should
		// decremented at a rate of 60Hz
		this.DT = 0x00;

		// 8 bit sound register - chip-8 can only play a single beep noise. 
		// The sound register acts as a time for how long the beep should
		// play. As per delay timer when non-zero this should be decremented
		// at a rate of 60Hz
		this.SR = 0x00;

		// 16 bit Program Counter
		this.PC = 0x0200;

		// 8 bit Stack pointer - the stack pointer references the current
		// position of the top of the stack. This tells the CPU where to
		// return to from a sub-function
		this.SP = 0x00;

		this.currentInstruction = 0x0000;
		this.instructionMask = 0xF000;

		this.memoryDisplay = document.getElementById("memory");

		this.audio = new AudioContext();

		this.chars();
		this.loadProgram();
		this.run();
		//this.displayMemory();
	}

	/**
	 * chars - the chip-8 has 16 built in character
	 * sprite representing the numbers 0-F. Characters
	 * are 5 bytes or 8x5 pixels (althoug only the first
	 * 4 bits of each byte are used). The should be stored in
	 * the interpreter memory from 0x00 to 0x1FF
	 */
	chars() {
		let sprites = [
			0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
			0x20, 0x60, 0x20, 0x20, 0x70, // 1
			0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
			0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
			0x90, 0x90, 0xF0, 0x10, 0x10, // 4
			0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
			0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
			0xF0, 0x10, 0x20, 0x40, 0x40, // 7
			0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
			0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
			0xF0, 0x90, 0xF0, 0x90, 0x90, // A
			0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
			0xF0, 0x80, 0x80, 0x80, 0xF0, // C
			0xE0, 0x90, 0x90, 0x90, 0xE0, // D
			0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
			0xF0, 0x80, 0xF0, 0x80, 0x80, // F
		];

		for (let i = 0x00; i < sprites.length; i++) {
			this.memory[i] = sprites[i];
		}
	}

	loadProgram() {

		let progMem = 0x200;

		for (let i = 0; i < this.arrayBuffer.length; i++) {
			this.memory[progMem] = this.arrayBuffer[i];
			progMem ++;
		}
	}

	displayMemory() {
		for (let i = 0; i < this.memory.length; i++) {
			let cell = document.createElement('span');
			cell.setAttribute("id", i.toString(16).padStart(2, "0"));
			cell.setAttribute("title", i.toString(16).padStart(2, "0"));
			cell.innerText = this.memory[i].toString(16).padStart(2, "0");
			if (this.PC == i) {cell.style.backgroundColor = "#ccc";}
			this.memoryDisplay.appendChild(cell);
		}
	}

	run() {

		while(this.doInstruction()) {
			this.PC ++;
		}
	}

	doInstruction() {
		if (this.PC%2 == 0) {
			this.currentInstruction = this.memory[this.PC];
		} else {
			this.currentInstruction = (this.currentInstruction << 8 | this.memory[this.PC]);
		}

		if (this.PC < this.memory.length) {
			return true;
		}

		return false;
	}

	doSound(time) {
		this.SR = time;
	
		while(this.SR > 0) {

		}
	}

	beep(vol, freq, duration) {
		oscillator = this.audio.createOscillator()
		gain = this.audio.createGain()
		oscillator.connect(gain)
		oscillator.frequency.value = freq
		oscillator.type = "square"
		gain.connect(this.audio.destination)
		gain.gain.value=vol*0.01
		oscillator.start(this.audio.currentTime)
		oscillator.stop(this.audio.currentTime+duration*0.001)
	}

	/***************************************************************************
 	* Chip instructions
 	* The Chip 8 has 36 different instructions each represented here by a
 	* function all functions are prefixed with an _
 	***************************************************************************/

 	/**
 	 * 0nnn - SYS addr
	 * Jump to a machine code routine at nnn.
	 * This instruction is only used on the old computers on which Chip-8 was
	 * originally implemented. It is ignored by modern interpreters.
 	 */
 	_0nnn(nnn) {
 		console.log(this.name);
 	}

 	/**
 	 * 00E0 - CLS
	 * Clear the display.
 	 */
 	_00E0() {
		 // TODO - attach to display
 		console.log(this.name);
 	}

 	/**
 	 * 00EE - RET
	 * Return from a subroutine.
	 *
	 * The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
	 */
	_00EE() {
 		console.log(this.name);
	}

	/**
	 * 1nnn - JP addr
	 * Jump to location nnn.
	 *
	 * The interpreter sets the program counter to nnn.
	 */
	 _1000(nnn){
 		console.log(this.name);
	 }

	/**
	 * 2nnn - CALL addr
	 * Call subroutine at nnn.
	 *
	 * The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
	 */
	 _2000(nnn){
		console.log(this.name);

	 }

	/**
	 * 3xkk - SE Vx, byte
	 * Skip next instruction if Vx = kk.
	 *
	 * The interpreter compares register Vx to kk, and if they are equal, increments PC by 2.
	 */
	 _3000(bytes){
	 	console.log(this.name);
	}

	/**
	 * 4xkk - SNE Vx, byte
	 * Skip next instruction if Vx != kk.
	 *
	 * The interpreter compares register Vx to kk, and if they are not equal, increments PC by 2.
	 */
	 _4000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 5xy0 - SE Vx, Vy
	 * Skip next instruction if Vx = Vy.
	 *
	 * The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
	 */
	 _5000(bytes){}
	/**
	 * 6xkk - LD Vx, byte
	 * Set Vx = kk.
	 *
	 * The interpreter puts the value kk into register Vx.
	 */
	 _6000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 7xkk - ADD Vx, byte
	 * Set Vx = Vx + kk.
	 *
	 * Adds the value kk to the value of register Vx, then stores the result in Vx.
	 */
	 _7000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy0 - LD Vx, Vy
	 * Set Vx = Vy.
	 *
	 * Stores the value of register Vy in register Vx.
	 */
	 _8000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy1 - OR Vx, Vy
	 * Set Vx = Vx OR Vy.
	 *
	 * Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
	 */
	 _8001(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy2 - AND Vx, Vy
	 * Set Vx = Vx AND Vy.
	 *
	 * Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
	 */
	 _8002(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy3 - XOR Vx, Vy
	 * Set Vx = Vx XOR Vy.
	 *
	 * Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
	 */
	_8003(bytes){
		console.log(this.name);
	}

	/**
	 * 8xy4 - ADD Vx, Vy
	 * Set Vx = Vx + Vy, set VF = carry.
	 *
	 * The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
	 */
	 _8004(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy5 - SUB Vx, Vy
	 * Set Vx = Vx - Vy, set VF = NOT borrow.
	 *
	 * If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
	 */
	 _8005(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xy6 - SHR Vx {, Vy}
	 * Set Vx = Vx SHR 1.
	 *
	 * If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
	 */
	_8006(bytes){
		console.log(this.name);
	}

	/**
	 * 8xy7 - SUBN Vx, Vy
	 * Set Vx = Vy - Vx, set VF = NOT borrow.

	 * If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
	 */
	 _8007(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 8xyE - SHL Vx {, Vy}
	 * Set Vx = Vx SHL 1.
	 *
	 * If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
	 */
	 _800E(bytes){
	 	console.log(this.name);
	 }

	/**
	 * 9xy0 - SNE Vx, Vy
	 * Skip next instruction if Vx != Vy.
	 *
	 * The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
	 */
	_9000(bytes){
		console.log(this.name);
	}

	/**
	 * Annn - LD I, addr
	 * Set I = nnn.

	 * The value of register I is set to nnn.
	 */
	 _A000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Bnnn - JP V0, addr
	 * Jump to location nnn + V0.
	 *
	 * The program counter is set to nnn plus the value of V0.
	 */
	_B000(bytes){
		console.log(this.name);
	}

	/**
	 * Cxkk - RND Vx, byte
	 * Set Vx = random byte AND kk.
	 *
	 * The interpreter generates a random number from 0 to 255, 
	 * which is then ANDed with the value kk. The results are stored in Vx. 
	 * See instruction 8xy2 for more information on AND.
	 */
	 _C000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Dxyn - DRW Vx, Vy, nibble
	 * Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
	 *
	 * The interpreter reads n bytes from memory, starting at the address stored in I. 
	 * These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). 
	 * Sprites are XORed onto the existing screen. If this causes any pixels to be erased, 
	 * VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it 
	 * is outside the coordinates of the display, it wraps around to the opposite side of the screen. 
	 * See instruction 8xy3 for more information on XOR, and section 2.4, Display, for more information 
	 * on the Chip-8 screen and sprites.
	 */
	 _D000(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Ex9E - SKP Vx
	 * Skip next instruction if key with the value of Vx is pressed.
	 *
	 * Checks the keyboard, and if the key corresponding to the value of Vx is 
	 * currently in the down position, PC is increased by 2.
	 */
	 _E09E(bytes){
	 	console.log(this.name);
	 }

	/**
	 * ExA1 - SKNP Vx
	 * Skip next instruction if key with the value of Vx is not pressed.
	 *
	 * Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
	 */
	 _E0A1(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx07 - LD Vx, DT
	 * Set Vx = delay timer value.
	 *
	 * The value of DT is placed into Vx.
	 */
	 _F007(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx0A - LD Vx, K
	 * Wait for a key press, store the value of the key in Vx.
	 *
	 * All execution stops until a key is pressed, then the value of that key is stored in Vx.
	 */
	 _F00A(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx15 - LD DT, Vx
	 * Set delay timer = Vx.
	 *
	 * DT is set equal to the value of Vx.
	 */
	 _F015(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx18 - LD ST, Vx
	 * Set sound timer = Vx.
	 *
	 * ST is set equal to the value of Vx.
	 */
	 _F018(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx1E - ADD I, Vx
	 * Set I = I + Vx.
	 *
	 * The values of I and Vx are added, and the results are stored in I.
	 */
	 _F01E(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx29 - LD F, Vx
	 * Set I = location of sprite for digit Vx.
	 *
	 * The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx. 
	 * See section 2.4, Display, for more information on the Chip-8 hexadecimal font.
	 */
	 _F029(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx33 - LD B, Vx
	 * Store BCD representation of Vx in memory locations I, I+1, and I+2.
	 *
	 * The interpreter takes the decimal value of Vx, and places the hundreds digit in 
	 * memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
	 */
	 _F033(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx55 - LD [I], Vx
	 * Store registers V0 through Vx in memory starting at location I.
	 *
	 * The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
	 */
	 _F055(bytes){
	 	console.log(this.name);
	 }

	/**
	 * Fx65 - LD Vx, [I]
	 * Read registers V0 through Vx from memory starting at location I.
	 *
	 * The interpreter reads values from memory starting at location I into registers V0 through Vx.
	 *
	 */
	_F065(bytes){
		console.log(this.name);
	}
}