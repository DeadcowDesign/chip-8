/**
 * Chip-8 interpreter
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

import { Display } from '../js/display.js';

export class CPU {
	constructor(arrayBuffer) {
		let pressedKeys = {};
		window.onkeyup = function (e) { pressedKeys[e.keyCode] = false; }
		window.onkeydown = function (e) { pressedKeys[e.keyCode] = true; }

		this.ArrayBuffer = arrayBuffer || null;

		/**
		 * The Chip-8 uses a 60Hz clock to decrement the SR and the DT.
		 * I've added this as a var so it can be changed for debugging.
		 */
		this.Clockspeed = 60;

		// Memory 4 kilobytes (4096 bytes). Note that programs should be loaded
		// in from address 0x200 - some programs start at 0x600 (TODO: how to 
		// tell the difference?)
		this.Memory = new Uint8Array(4096);

		// Registers - 16 8-bit registers labelled Vx where x = hex register
		// value 0-f
		this.Registers = new Uint8Array(16);

		// Stack
		this.Stack = new Uint16Array(16);

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

		this.CurrentInstruction = 0x0000;
		this.InstructionMask = 0xF000;

		this.MemoryDisplay = document.getElementById("memory");

		this.Audio = new(window.AudioContext || window.webkitAudioContext)();;
		this.Oscillator = audioCtx.createOscillator();
		this.BeepVolume = 0.5;
		this.BeepType = "square";
		this.BeepFrequency = 270;

		this.SRInterval = null;

		this.Display = new Display();

		this.initChars();
		this.initAudio();
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
	initChars() {
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
			this.Memory[i] = sprites[i];
		}
	}

	loadProgram() {

		let progMem = 0x200;

		for (let i = 0; i < this.ArrayBuffer.length; i++) {
			this.Memory[progMem] = this.ArrayBuffer[i];
			progMem++;
		}
	}

	displayMemory() {
		for (let i = 0; i < this.Memory.length; i++) {
			let cell = document.createElement('span');
			cell.setAttribute("id", i.toString(16).padStart(2, "0"));
			cell.setAttribute("title", i.toString(16).padStart(2, "0"));
			cell.innerText = this.Memory[i].toString(16).padStart(2, "0");
			if (this.PC == i) { cell.style.backgroundColor = "#ccc"; }
			this.MemoryDisplay.appendChild(cell);
		}
	}

	doInstruction() {
		if (this.PC % 2 == 0) {
			this.CurrentInstruction = this.Memory[this.PC];
		} else {
			this.CurrentInstruction = (this.CurrentInstruction << 8 | this.Memory[this.PC]);
		}

		if (this.PC < this.Memory.length) {
			return true;
		}

		return false;
	}

	/**
	 * initAudio - set up the beep noise for the Chip-8
	 */
	initAudio() {
		let gainNode = audioCtx.createGain();
	  
		this.Oscillator.connect(gainNode);
		gainNode.connect(audioCtx.destination);
	  
		gainNode.gain.value = this.BeepVolume;
		this.Oscillator.frequency.value = this.BeepFrequency;
		this.Oscillator.type = this.BeepType;
	};

	/**
	 * startSR - set up the interval and start playing
	 * @param {int} time The amount of time the beep should play for
	 */
	beep(time) {
		this.SR = time;
		this.SRInterval = setInterval(
			function() {
				if (self.SR > 0) {
					self.startBeep();
					self.SR--;
				} else {
					self.stopBeep();
					clearInterval(self.SRInterval);
				}
			}, this.Clockspeed);
	}

	startBeep() {
		this.Oscillator.start();
	}

	stopBeep() {
		this.Oscillator.stop();
	}

	/**
	 * Start the application
	 */
	run() {

		while (this.doInstruction()) {
			this.PC++;
		}
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
	_0000(nnn) {
		return;
	}

	/**
	 * 00E0 - CLS
   * Clear the display.
	 */
	_00E0() {
		this.Display.CLS();
	}

	/**
	 * 00EE - RET
   * Return from a subroutine.
   *
   * The interpreter sets the program counter to the address at the top of the stack, 
   * then subtracts 1 from the stack pointer.
   */
	_00EE() {
		this.PC = this.Stack(this.SP);
		this.SP--;
	}

	/**
	 * 1nnn - JP addr
	 * Jump to location nnn.
	 *
	 * The interpreter sets the program counter to nnn.
	 */
	_1000(OpCode) {
		let nnn = OpCode & 0x0FFF;
		this.PC = nnn;
	}

	/**
	 * 2nnn - CALL addr
	 * Call subroutine at nnn.
	 *
	 * The interpreter increments the stack pointer, then puts the current PC on the top of the stack. 
	 * The PC is then set to nnn.
	 */
	_2000(OpCode) {
		let nnn = OpCode & 0x0FFF;
		this.SP++;
		this.Stack[SP] = this.PC;
		this.PC = nnn;
	}

	/**
	 * 3xkk - SE Vx, byte
	 * Skip next instruction if Vx = kk.
	 *
	 * The interpreter compares register Vx to kk, and if they are equal, increments PC by 2.
	 */
	_3000(OpCode) {
		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let nn = OpCode & 0x00FF;

		if (Vx === nn) this.PC += 2;
	}

	/**
	 * 4xkk - SNE Vx, byte
	 * Skip next instruction if Vx != kk.
	 *
	 * The interpreter compares register Vx to kk, and if they are not equal, increments PC by 2.
	 */
	_4000(OpCode) {

		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let nn = OpCode & 0x00FF;

		if (Vx !== nn) this.PC += 2;
	}

	/**
	 * 5xy0 - SE Vx, Vy
	 * Skip next instruction if Vx = Vy.
	 *
	 * The interpreter compares register Vx to register Vy, 
	 * and if they are equal, increments the program counter by 2.
	 */
	_5000(OpCode) {

		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let Vy = this.Registers[(OpCode & 0x00F0) >> 4];

		if (Vx === Vy) this.PC += 2;
	}

	/**
	 * 6xkk - LD Vx, byte
	 * Set Vx = kk.
	 *
	 * The interpreter puts the value kk into register Vx.
	 */
	_6000(OpCode) {
		let Vx = (OpCode & 0x0F00) >> 8;
		let kk = (OpCode & 0x00FF);
		this.Registers[Vx] = kk;
	}

	/**
	 * 7xkk - ADD Vx, byte
	 * Set Vx = Vx + kk.
	 *
	 * Adds the value kk to the value of register Vx, then stores the result in Vx.
	 */
	_7000(OpCode) {
		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let kk = (OpCode & 0x00FF);
		this.Registers[Vx] = Vx + kk;
	}

	/**
	 * _8xyX - series of math options for registers. Last nibble is an option
	 * code corresponding to the operation to be performed within the 8xxx subset.
	 * All operation results are stored in Vx.
	 * @param {Hex} bytes 
	 */
	_8000(OpCode) {

		let option = OpCode & 0x000F;
		let VxPointer = (OpCode & 0x0F00) >> 8;
		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let Vy = this.Registers[(OpCode & 0x00F0) >> 4];

		switch (option) {
			/**
			 * 8xy0 - LD Vx, Vy
			 * Set Vx = Vy.
			 *
			 * Stores the value of register Vy in register Vx.
			 */
			case 0x0:
				this.Registers[VxPointer] = Vy;
				break;
			/**
			 * 8xy1 - OR Vx, Vy
			 * Set Vx = Vx OR Vy.
			 *
			 * Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. 
			 * A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, 
			 * then the same bit in the result is also 1. Otherwise, it is 0.
			 */
			case 0x1:
				this.Registers[VxPointer] = Vx | Vy;
				break;
			/**
			 * 8xy2 - AND Vx, Vy
			 * Set Vx = Vx AND Vy.
			 *
			 * Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
			 * A bitwise AND compares the corrseponding bits from two values, and if both bits are 1,
			 * then the same bit in the result is also 1. Otherwise, it is 0.
			 */
			case 0x2:
				this.Registers[VxPointer] = Vx & Vy;
				break;
			/**
			 * 8xy3 - XOR Vx, Vy
			 * Set Vx = Vx XOR Vy.
			 *
			 * Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. 
			 * An exclusive OR compares the corrseponding bits from two values, and if the bits are not 
			 * both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
			 */
			case 0x3:
				this.Registers[VxPointer] = Vx ^ Vy;
				break;
			/**
			 * 8xy4 - ADD Vx, Vy
			 * Set Vx = Vx + Vy, set VF = carry.
			 *
			 * The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) 
			 * VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
			 */
			case 0x4:
				this.Registers[0xF] = (Vx + Vy) >> 8;
				this.Registers[VxPointer] = (Vx + Vy) & 0x0FF;
				break;
			/**
			 * 8xy5 - SUB Vx, Vy
			 * Set Vx = Vx - Vy, set VF = NOT borrow.
			 *
			 * If Vx > Vy, then VF is set to 1, otherwise 0. 
			 * Then Vy is subtracted from Vx, and the results stored in Vx.
			 */
			case 0x5:
				this.Registers[0xF] = Vx > Vy ? 1 : 0;
				this.Registers[VxPointer] = Vx - Vy;
				break;
			/**
			 * 8xy6 - SHR Vx {, Vy}
			 * Set Vx = Vx SHR 1.
			 *
			 * If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0.
			 * Then Vx is divided by 2.
			 */
			case 0x6:
				this.Registers[0xF] = this.Regsiters[VxPointer] & 1;
				this.Registers[VxPointer] = this.Register[VxPointer] >> 1;
				break;
			/**
			* 8xy7 - SUBN Vx, Vy
			* Set Vx = Vy - Vx, set VF = NOT borrow.
			* If Vy > Vx, then VF is set to 1, otherwise 0. 
			* Then Vx is subtracted from Vy, and the results stored in Vx.
			*/
			case 0x7:
				this.Registers[0xF] = Vy > Vx ? 1 : 0;
				this.Registers[VxPointer] = Vy - Vx;
				break;
			/**
			 * 8xyE - SHL Vx {, Vy}
			 * Set Vx = Vx SHL 1.
			 *
			 * If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. 
			 * Store MSb in VF then shifts Vx << 1
			 * Then Vx is multiplied by 2.
			 */
			case 0xE:
				// TODO - Work out how to get MSb.
				let MSB = (Vx >> 0).toString(2).padStart(2, "8")[0]; // This is a bit of a punt tbh...
				this.Registers(0xF) = MSB;
				this.Registers[VxPointer] = this.Registers[VxPointer] << 1;
				break;
			default:
				throw new Error("Invalid Opcode out of bounds: " + OpCode.toString(16).padStart(4, "0"));

		}

	}

	/**
	 * 9xy0 - SNE Vx, Vy
	 * Skip next instruction if Vx != Vy.
	 *
	 * The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
	 */
	_9000(OpCode) {
		let Vx = (OpCode & 0x0F00) >> 8;
		let Vy = (OpCode & 0x00F0) >> 4;
		if (this.Registers[Vx] !== this.Registers[Vy]) this.PC++;
	}

	/**
	 * Annn - LD I, addr
	 * Set I = nnn.

	 * The value of register I is set to nnn.
	 */
	_A000(OpCode) {
		this.I = (OpCode & 0x0FFF);
	}

	/**
	 * Bnnn - JP V0, addr
	 * Jump to location nnn + V0.
	 *
	 * The program counter is set to nnn plus the value of V0.
	 */
	_B000(OpCode) {
		this.PC = this.Regsiters[0x0] + (OpCode & 0x0FFF);
	}

	/**
	 * Cxkk - RND Vx, byte
	 * Set Vx = random byte AND kk.
	 *
	 * The interpreter generates a random number from 0 to 255, 
	 * which is then ANDed with the value kk. The results are stored in Vx. 
	 * See instruction 8xy2 for more information on AND.
	 */
	_C000(OpCode) {
		let rnd = Math.floor(Math.random() * 256);
		let VxPointer = (OpCode & 0x0F00) >> 8;
		let nn = OpCode & 0X00FF;

		this.Registers[VxPointer] = rnd & nn;
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
	 */
	_D000(OpCode) {
		let Vx = (OpCode & 0x0F00) >> 8;
		let Vy = (OpCode & 0x00F0) >> 4;
		let len = (OpCode & 0x000F);
		let sprite = new Uint8Array(15);
		let memoryPointer = this.I;

		for (let i = 0; i < len; i++) {
			sprite[i] = this.Memory[memoryPointer];
			memoryPointer++;
		}

		VF = this.Display.DRW(Vx, Vy, sprite);
	}

	/**
	 * Ex9E - SKP Vx
	 * Skip next instruction if key with the value of Vx is pressed.
	 *
	 * Checks the keyboard, and if the key corresponding to the value of Vx is 
	 * currently in the down position, PC is increased by 2.
	 */
	_E09E(OpCode) {
		console.log(this.name);
	}

	/**
	 * ExA1 - SKNP Vx
	 * Skip next instruction if key with the value of Vx is not pressed.
	 *
	 * Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, 
	 * PC is increased by 2.
	 */
	_E0A1(OpCode) {
		console.log(this.name);
	}

	_F000(OpCode) {

		let option = OpCode & 0x000F;
		let VxPointer = (OpCode & 0x0F00) >> 8;
		let Vx = this.Registers[(OpCode & 0x0F00) >> 8];
		let Vy = this.Registers[(OpCode & 0x00F0) >> 4];

		switch (option) {
			/**
			 * Fx07 - LD Vx, DT
			 * Set Vx = delay timer value.
			 *
			 * The value of DT is placed into Vx.
			 */
			case 0x07:
				break;
			
			/**
			 * Fx0A - LD Vx, K
			 * Wait for a key press, store the value of the key in Vx.
			 *
			 * All execution stops until a key is pressed, then the value of that key is stored in Vx.
			 */
			case 0x0A:
				break;
			
			/**
			 * Fx15 - LD DT, Vx
			 * Set delay timer = Vx.
			 *
			 * DT is set equal to the value of Vx.
			 */
			case 0x15:
				break;
			
			/**
			 * Fx18 - LD ST, Vx
			 * Set sound timer = Vx.
			 *
			 * ST is set equal to the value of Vx.
			 */
			case 0x18:
				break;
			
			/**
			 * Fx1E - ADD I, Vx
			 * Set I = I + Vx.
			 *
			 * The values of I and Vx are added, and the results are stored in I.
			 */
			case 0x1E:
				break;
			
			/**
			 * Fx29 - LD F, Vx
			 * Set I = location of sprite for digit Vx.
			 *
			 * The value of I is set to the location for the hexadecimal sprite 
			 * corresponding to the value of Vx. 
			 */
			case 0x29:
				break;
			
			/**
			 * Fx33 - LD B, Vx
			 * Store BCD representation of Vx in memory locations I, I+1, and I+2.
			 *
			 * The interpreter takes the decimal value of Vx, and places the hundreds digit in 
			 * memory at location in I, the tens digit at location I+1, and the ones digit at 
			 * location I+2.
			 */
			case 0x33:
				break;
			
			/**
			 * Fx55 - LD [I], Vx
			 * Store registers V0 through Vx in memory starting at location I.
			 *
			 * The interpreter copies the values of registers V0 through Vx into memory, 
			 * starting at the address in I.
			 */
			case 0x55:
				break;
			
			/**
			 * Fx65 - LD Vx, [I]
			 * Read registers V0 through Vx from memory starting at location I.
			 *
			 * The interpreter reads values from memory starting at location I into registers 
			 * V0 through Vx.
			 *
			 */
			case 0x65:
				break;
			
			/**
			 * If OpCode is not listed above then for the Chip-8 instruction set it is invalid
			 */
			default:
				throw new Error("Invalid Opcode out of bounds: " + OpCode.toString(16).padStart(4, "0"));
		}
	}
}