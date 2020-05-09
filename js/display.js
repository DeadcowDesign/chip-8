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
        this.itr = "foo";    
    }

    test() {
        let self = this;
        let arr = [1,2,3,4,5,6];

        arr.forEach(function(){
            console.log(self.itr);
        })
    }
}