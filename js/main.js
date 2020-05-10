import {Disassembler} from '../js/disassembler.js';
import { CPU } from './interpreter.js';

export class Main {

    constructor() {
        let self = this;
        this.disassembler = null;
        this.cpu = null;
        this.arrayBuffer = null;
        this.input = document.getElementById("file-input");
        this.input.addEventListener("change", function (e) { self.readSingleFile(e); }, false);

    }

    /**
     * readSingleFile - load a single file from a file input on the screen
     * and display
     * @param {object} e Event object
     */
    readSingleFile(input) {

        let self = this;
        let file = input.target.files[0];
        if (!file) {
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            self.arrayBuffer = new Uint8Array(reader.result);
            self.postLoad();
        };

        reader.readAsArrayBuffer(file);
    };
    
    postLoad() {
        this.disassembler = new Disassembler(this.arrayBuffer);
        this.cpu = new CPU(this.arrayBuffer);
    };
}