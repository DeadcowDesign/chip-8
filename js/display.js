/**
 * Display driver for the Chip-8 Interpreter
 * set up as a canvas. Because 64x32 px is probably
 * a bit small, we'll set it up to be arbitrary and
 * to split the canvas into a .
 * Note that the chip 8 coordinates system runs
 * top left to bottom right.
 */
export class Display {
    constructor(h, w, bgCol, pxCol) {
        this.displayBuffer = [];    // An array that holds the pixel values for the display
        this.displayCanvas = document.getElementById("display");
        this.display = this.displayCanvas.getContext("2d");
        this.w = w || 64;
        this.h = h || 32;
        this.bgCol = bgCol || "#000";
        this.pxCol = pxCol || "#FFF";
        this.pxW = this.displayCanvas.width / this.w;
        this.pxH = this.displayCanvas.height / this.h;
        this.collisionFlag = false;
    }

    /**
     * init - initialise the canvas for first draw. Clear the display buffer
     * and fill the canvas with the background colour.
     */
    initializeDisplay() {

        // Set up the screen buffer
        for (let rows = 0; rows < this.h; rows++) {

            let tmpRow = [];
            for (let cols = 0; cols < this.w; cols++) {
                tmpRow.push(0);
            }

            this.displayBuffer.push(tmpRow);
        }

        this.display.fillStyle = this.bgCol;
        this.display.fillRect(0,0,this.displayCanvas.width,this.displayCanvas.height);
        this.collisionFlag = false;
        console.log("Display booted");
        return true;
    }

    /**
     * CLS - clear the display. Remove the "on" class from any pixel that may have it
     * turning the display to it's "off" colour. This is the same process as initializing
     * so we just call that function
     */
    CLS() {
        this.initializeDisplay();
    }

    /**
     * DRW - draw the sprite on the screen at the coordinates x,y
     * Note that if a sprite's bounds are beyond the screen edges,
     * they should loop to the opposite edge of the display.
     */
    DRW(x, y, sprite) {

        if (this._spriteToBuffer(x,y,sprite)) {
            this._bufferToCanvas();
        }
    }

    /**
     * spriteToBuffer - dump the sprite data into a display buffer
     * @param {*} x 
     * @param {*} y 
     * @param {*} sprite 
     */
    _spriteToBuffer(x, y, sprite) {
        //console.log("Buffering");
        let currY = y;

        for (let byte of sprite ) {

            let bits = byte.toString(2).padStart(8, "0").split("").map(x => parseInt(x));
            
            let currX = x;

            for (let bit of bits) {
                try {
                    let currBit = this.displayBuffer[currY][currX];

                    if (bit === currBit) {
                        this.collisionFlag = true;
                    }

                    this.displayBuffer[currY][currX] = bit ^ currBit;
                } catch (Err) {
                    //console.log("Out of bounds display: x" + currX +", y" + currY );
                }

                    currX++;
            }

            currY++
        }

        return true;
    }

    _bufferToCanvas() {
        //console.log("Drawing");
        //console.log(typeof(this.displayBuffer));
        this.displayBuffer.forEach((row, rowIndex) => {
            
            row.forEach((col, colIndex) => {
                let startX = colIndex * this.pxW;
                let startY = rowIndex * this.pxH;
                let endX = startX + this.pxW;
                let endY = startY + this.pxH;

                this.display.fillStyle = col ? this.pxCol : this.bgCol;
                this.display.fillRect(startX, startY, endX, endY);
            })
        });

        
    }
}