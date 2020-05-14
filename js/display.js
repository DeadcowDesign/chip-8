/**
 * Display driver for the Chip-8 Interpreter
 * set up as a canvas. Because 64x32 px is probably
 * a bit small, we'll set it up to be arbitrary and
 * to split the canvas into a .
 * Note that the chip 8 coordinates system runs
 * top left to bottom right.
 */
export class Display {
    
    constructor() {
        this.display = [];
        this.displayContainer = document.getElementById("display");
        this.pixels = null;
        this.initializeDisplay();
    }

    /**
     * initializeDisplay - set up the display pixels and create the array.
     */
    initializeDisplay() {
        let row = 0;
        let rows = [];
        while (row < 32) {
            let cols = [];

            let col = 0;

            while (col < 64) {

                cols[col] = 0;

                col++

                let pixel = document.createElement("span");
                pixel.classList.add("pixel");
                this.displayContainer.appendChild(pixel);
            };

            rows[row] = cols;

            row++;
        }
        
        this.pixels = document.getElementsByClassName("pixel");
    }

    /**
     * CLS - clear the display. Remove the "on" class from any pixel that may have it
     * turning the display to it's "off" colour.
     */
    CLS() {

        for(const pixel of this.pixels) {
            pixel.classList.remove("on");
        }
    }

    /**
     * DRW - draw the sprite on the screen at the coordinates x,y
     * Note that if a sprite's bounds are beyond the screen edges,
     * they should loop to the opposite edge of the display.
     */
    DRW(x, y, sprite) {
        let collisionFlag = false;

        return collisionFlag;
    }
}