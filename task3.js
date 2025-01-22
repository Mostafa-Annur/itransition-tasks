// Import necessary modules
const process = require("process");
const crypto = require("crypto");
const prompt = require("prompt-sync")();

class Dice {
    constructor(id, values) {
        this.id = id;
        this.values = values;
    }

    roll() {
        return this.values[crypto.randomInt(0, this.values.length)];
    }
}

class DiceParser {
    static parse(configurations) {
        if (configurations.length < 3) {
            throw new Error("You must provide at least three dice configurations. Each die must contain comma-separated integers. Example: 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
        }

        return configurations.map((config, index) => {
            const values = config.split(",").map(Number);

            if (values.some(isNaN)) {
                throw new Error(`Invalid input: ${config}. All dice must contain integers only. Example: 2,2,4,4,9,9`);
            }

            return new Dice(index + 1, values);
        });
    }
}

class FairRandomGenerator {
    static generateSecureRandomKey() {
        return crypto.randomBytes(32); // 256-bit key
    }

    static generateFairRandomInteger(range, key) {
        let randomInt;
        do {
            randomInt = crypto.randomInt(0, range);
        } while (randomInt >= range);

        const hmac = crypto.createHmac("sha3-256", key);
        hmac.update(randomInt.toString());
        const digest = hmac.digest("hex");

        console.log("HMAC for verification:", digest);
        return randomInt;
    }
}

class ProbabilityCalculator {
    static calculateWinningProbabilities(dice) {
        const probabilities = [];

        for (let i = 0; i < dice.length; i++) {
            probabilities[i] = [];
            for (let j = 0; j < dice.length; j++) {
                if (i === j) {
                    probabilities[i][j] = 0.5;
                } else {
                    const wins = this.simulateMatches(dice[i], dice[j]);
                    probabilities[i][j] = wins / 10000;
                }
            }
        }

        return probabilities;
    }

    static simulateMatches(dieA, dieB) {
        let wins = 0;

        for (let i = 0; i < 10000; i++) {
            const rollA = dieA.roll();
            const rollB = dieB.roll();

            if (rollA > rollB) {
                wins++;
            }
        }

        return wins;
    }
}

class ProbabilityTable {
    static generate(dice, probabilities) {
        let table = "\nWinning Probabilities Table:\n\n";
        table += "Dice\\Dice | " + dice.map(d => `Die ${d.id}`).join(" | ") + "\n";
        table += "-".repeat(10 + dice.length * 8) + "\n";

        probabilities.forEach((row, i) => {
            table += `Die ${dice[i].id}`;
            row.forEach(prob => {
                table += ` | ${(prob * 100).toFixed(2)}%`;
            });
            table += "\n";
        });

        console.log(table);
    }
}

class DiceGame {
    constructor(diceConfigurations) {
        this.dice = DiceParser.parse(diceConfigurations);
    }

    displayMenu() {
        console.log("\nSelect an option:");
        console.log("1. Choose a die for the user throw");
        console.log("2. Perform fair random generation");
        console.log("3. Help");
        console.log("4. Exit");
    }

    startGame() {
        console.log("\nWelcome to the Non-Transitive Dice Game!");
        console.log("Here are the dice configurations:", this.dice);

        while (true) {
            this.displayMenu();
            const choice = prompt("Enter your choice: ");

            switch (choice) {
                case "1":
                    this.userThrow();
                    break;
                case "2":
                    this.performFairRandomGeneration(this.dice.length);
                    break;
                case "3":
                    this.displayHelp();
                    break;
                case "4":
                    console.log("Exiting the game. Goodbye!");
                    return;
                default:
                    console.log("Invalid choice. Please select a valid option.");
            }
        }
    }

    userThrow() {
        console.log("\nChoose a die for your throw:");
        this.dice.forEach(die => console.log(`Die ${die.id}: [${die.values.join(",")}]`));

        const dieChoice = parseInt(prompt("Enter the number of the die: "), 10);
        const userDie = this.dice.find(die => die.id === dieChoice);

        if (!userDie) {
            console.log("Invalid die selection. Please try again.");
            return;
        }

        const userRoll = userDie.roll();
        console.log(`You rolled a ${userRoll}!`);

        const computerDie = this.dice[crypto.randomInt(0, this.dice.length)];
        const computerRoll = computerDie.roll();
        console.log(`Computer chose Die ${computerDie.id} and rolled a ${computerRoll}.`);

        if (userRoll > computerRoll) {
            console.log("You win!");
        } else if (computerRoll > userRoll) {
            console.log("Computer wins!");
        } else {
            console.log("It's a tie!");
        }
    }

    performFairRandomGeneration(range) {
        const key = FairRandomGenerator.generateSecureRandomKey();
        const computerNumber = FairRandomGenerator.generateFairRandomInteger(range, key);

        console.log("Computer has generated its number and HMAC.");
        const userNumber = parseInt(prompt(`Choose a number between 0 and ${range - 1}: `), 10);

        if (isNaN(userNumber) || userNumber < 0 || userNumber >= range) {
            console.log("Invalid number. Please try again.");
            return;
        }

        const result = (userNumber + computerNumber) % range;
        console.log(`Computer number: ${computerNumber}`);
        console.log(`Secret key: ${key.toString("hex")}`);
        console.log(`Final result (mod ${range}): ${result}`);
        return result;
    }

    displayHelp() {
        const probabilities = ProbabilityCalculator.calculateWinningProbabilities(this.dice);
        ProbabilityTable.generate(this.dice, probabilities);
    }
}

function main() {
    try {
        const args = process.argv.slice(2);
        const game = new DiceGame(args);
        game.startGame();
    } catch (error) {
        console.error("Error:", error.message);
        console.log("Usage example: node script.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
    }
}

if (require.main === module) {
    main();
}
