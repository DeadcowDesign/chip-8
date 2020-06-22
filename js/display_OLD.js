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
        this.width = 64;
        this.height = 32;
    }

    /**
     * initializeDisplay - set up the display pixels and create the array.
     */
    initializeDisplay() {
        let row = 0;
        while (row < this.height) {
            let col = 0;

            while (col < this.width) {

                let pixel = document.createElement("span");
                pixel.classList.add("pixel");
                pixel.setAttribute("data-coord", col + "," + row);
                this.displayContainer.appendChild(pixel);
                col++

            };

            row++;
        }
        this.pixels = document.getElementsByClassName('pixel');
        console.log("Display booted");
        return true;
    }

    /**
     * CLS - clear the display. Remove the "on" class from any pixel that may have it
     * turning the display to it's "off" colour.
     */
    CLS() {
        //console.log(this.pixels);
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
        //console.log(x);
        //console.log(y);
        //console.log(sprite);
        let cX = x;
        let cY = y;
        let self = this;
        let collisionFlag = false;

        // Split our sprite into rows
        for (const row of sprite) {
            cX = x;
            // Convert row byte into binary and then split to give pixel
            // values
            let cols = row.toString(2).padStart(8, "0").split("");
            // Loop through the bits in the row
            cols.forEach(function (bit, index) {
                if (cX > self.width) {
                    cX = 0;
                }

                let pixel = document.querySelectorAll(`[data-coord="${cX},${cY}"]`)[0];
                
                if (!pixel) {
                    console.log("Pixel not found: x" + cX + " y" + cY);
                } else {

                    if (pixel.classList.contains('on')) {
                        collisionFlag = true;
                    };

                    if (bit === "1") { 
                        pixel.classList.add("on");
                    } else {
                        //pixel.classList.remove("on");
                    }
                }

                cX++;
            });

            cY++;

            if (cY > this.height) {
                cY = 0;
            }
        }

        //return window.setTimeout(function(){return true;}, 60);
        return true;
    }
}