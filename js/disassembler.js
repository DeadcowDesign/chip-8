export class Disassembler {
    constructor(buffer) {

        let self = this;
        this.arrayBuffer = buffer || null;
        this.instructionOutput = document.getElementById("instructions");
        this.lookupTable = [
            { "code": "0nnn", "ins": "SYS addr" },
            { "code": "1nnn", "ins": "JP addr" },
            { "code": "2nnn", "ins": "CALL addr" },
            { "code": "3xkk", "ins": "SE Vx, byte" },
            { "code": "4xkk", "ins": "SNE Vx, byte" },
            { "code": "5xy0", "ins": "SE Vx, Vy" },
            { "code": "6xkk", "ins": "LD Vx, byte" },
            { "code": "7xkk", "ins": "ADD Vx, byte" },
            { "code": "8xy0", "ins": "LD Vx, Vy" },
            { "code": "8xy1", "ins": "OR Vx, Vy" },
            { "code": "8xy2", "ins": "AND Vx, Vy" },
            { "code": "8xy3", "ins": "XOR Vx, Vy" },
            { "code": "8xy4", "ins": "ADD Vx, Vy" },
            { "code": "8xy5", "ins": "SUB Vx, Vy" },
            { "code": "8xy6", "ins": "SHR Vx {, Vy}" },
            { "code": "8xy7", "ins": "SUBN Vx, Vy" },
            { "code": "8xyE", "ins": "SHL Vx {, Vy}" },
            { "code": "9xy0", "ins": "SNE Vx, Vy" },
            { "code": "Annn", "ins": "LD I, addr" },
            { "code": "Bnnn", "ins": "JP V0, addr" },
            { "code": "Cxkk", "ins": "RND Vx, byte" },
            { "code": "Dxyn", "ins": "DRW Vx, Vy, nibble" },
            { "code": "Ex9E", "ins": "SKP Vx" },
            { "code": "ExA1", "ins": "SKNP Vx" },
            { "code": "Fx07", "ins": "LD Vx, DT" },
            { "code": "Fx0A", "ins": "LD Vx, K" },
            { "code": "Fx15", "ins": "LD DT, Vx" },
            { "code": "Fx18", "ins": "LD ST, Vx" },
            { "code": "Fx1E", "ins": "ADD I, Vx" },
            { "code": "Fx29", "ins": "LD F, Vx" },
            { "code": "Fx33", "ins": "LD B, Vx" },
            { "code": "Fx55", "ins": "LD [I], Vx" },
            { "code": "Fx65", "ins": "LD Vx, [I]" },
        ];
        
        this.displayContents();
    }

    /**
     * decodeInstruction - take a two byte instuction (all chip-8 instructions
     * are a byte pair) and decode it into a human readable
     * @param {int} bytes 4 byte hexidecimal
     */
    decodeInstructions (firstInstruction, secondInstruction) {
        let instructionString = (firstInstruction << 8 | secondInstruction).toString(16).padStart(4, "0");
        let instructionResult = null;
        let testRegex = '';
        if (instructionString == "0000") {
            testRegex = '0000';
        }
        else if (instructionString.match(/00e0/i)) {
            testRegex = '00e0';
        }
        else if (instructionString.match(/00ee/i)) {
            testRegex = '00ee';
        }
        else if (instructionString.match(/(5|8|9)[0-9a-f]{3}/i)) {
            testRegex = instructionString[0] + '[0-9a-z]{2}' + instructionString[3];
        }
        else if (instructionString.match(/(e|f)[0-9a-f]{3}/i)) {
            testRegex = instructionString[0] + '[0-9a-z]{1}' + instructionString[2] + instructionString[3];
        }
        else {
            testRegex = instructionString[0] + '[0-9a-z]{3}';
        }
        instructionResult = this.getCode(testRegex);
        instructionResult.rawCode = instructionString;
        return instructionResult;
    };

    getCode (testRegex) {
        // Special cases where RegEx causes collisions - don't forget these don't live
        // in the lookup Table...
        if (testRegex == "0000") {
            return { "code": "0000", "ins": "Empty" };
        }
        if (testRegex.match(/00E0/i)) {
            return { "code": "00E0", "ins": "CLS" };
        }
        if (testRegex.match(/00ee/i)) {
            return { "code": "00EE", "ins": "RET" };
        }
        let test = new RegExp(testRegex, 'i');
        for (let i = 0; i < this.lookupTable.length; i++) {
            let lookupRef = this.lookupTable[i].code;
            if (lookupRef.match(test)) {
                return this.lookupTable[i];
            }
        }
        return { "code": "xxxx", "ins": "Not found or supported" };
    };

    /**
     * displayContents - output the file buffer to the screen
     * @param {array} arrayBuffer
     */
    displayContents () {
        let lineNo = 0;
        var fileContent = document.getElementById('file-content');
        fileContent.innerHTML = "";
        let tmpByte = 0x00;
        var instructionTable = document.getElementById("instructiontable");
        instructionTable.innerHTML = "";
        let tableRow = document.createElement("tr");
        let tableCell = document.createElement("th");
        tableCell.innerText = "Instruction";
        tableRow.appendChild(tableCell);
        tableCell = document.createElement("th");
        tableCell.innerText = "Reference";
        tableRow.appendChild(tableCell);
        instructionTable.appendChild(tableRow);
        // Add the initial line number
        let lineString = document.createTextNode((lineNo << 4).toString(16).padStart(4, "0") + "    ");
        fileContent.appendChild(lineString);
        lineNo++;
        let rawSpan = null;
        for (var i = 0; i < this.arrayBuffer.length; i++) {
            if (i % 2 == 0) {
                tmpByte = this.arrayBuffer[i];
                rawSpan = document.createElement("span");
                rawSpan.innerHTML += this.arrayBuffer[i].toString(16).padStart(2, "0") + "   ";
            }
            else {
                let instruction = this.decodeInstructions(tmpByte, this.arrayBuffer[i]);
                let rowNode = document.createElement('tr');
                rowNode.setAttribute("data-target", `ins-${i}`);
                let cellNode = document.createElement("td");
                cellNode.innerText = instruction.rawCode;
                rowNode.appendChild(cellNode);
                cellNode = document.createElement("td");
                cellNode.innerText = instruction.code;
                rowNode.appendChild(cellNode);
                cellNode = document.createElement("td");
                cellNode.innerText = instruction.ins;
                rowNode.appendChild(cellNode);
                rowNode.addEventListener("mouseover", function () {
                    let targetID = this.getAttribute("data-target");
                    document.getElementById(targetID).style.backgroundColor = "#bada55";
                    this.style.backgroundColor = "#bada55";
                });
                rowNode.addEventListener("mouseleave", function () {
                    let targetID = this.getAttribute("data-target");
                    document.getElementById(targetID).style.backgroundColor = "transparent";
                    this.style.backgroundColor = "transparent";
                });
                instructionTable.appendChild(rowNode);
                rawSpan.setAttribute("id", `ins-${i}`);
                rawSpan.innerHTML += this.arrayBuffer[i].toString(16).padStart(2, "0") + "   ";
                fileContent.appendChild(rawSpan);
            }
            //element.innerHTML += this.arrayBuffer[i].toString(16).padStart(2, "0") + "   ";
            if ((i + 1) % 16 == 0) {
                let linebreak = document.createElement("br");
                fileContent.appendChild(linebreak);
                let lineString = document.createTextNode((lineNo << 4).toString(16).padStart(4, "0") + "    ");
                fileContent.appendChild(lineString);
                lineNo++;
            }
        }
    }
}
