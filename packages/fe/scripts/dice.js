/**
 * Return true if we have a function that returns cryptographically random 
 * values. False otherwise.
 */
function iCanHasGoodCrypto() {
	// If we don't have a Window variable, we're in Node.js, probably doing unit tests, so
	// return true.
	//
	// Even if I screw this up and there exists a web browser that doesn't have window defined
	// worst case is that a non-existant crypto.getRandomValues() function is called, and I'd rather
	// have some sort of error versus a user accidentally using weak crypto.
	if (typeof(window) == "undefined") {
		return(true);
	}
	if (typeof(window) != "undefined") {
		if (window.crypto && window.crypto.getRandomValues) { 
			return(true);
		}
	}
	return(false);
} // End of i_can_has_good_crypto()

/**
 * Return a random integer between 0 and max, inclusive.
 */
function getRandomValue(max) {
	return new Promise(function(resolve, reject) {
		if (max <= 0) {
			reject("max can't be less or equal to zero!");
			return;
		}
		if (iCanHasGoodCrypto()) {
			new Promise((resolveRandom) => {
        const csprn = window.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000
				resolveRandom(csprn * max);
			})
			.then(function(number) {
				resolve(number);
			})
			.catch(function(err) {
				reject(err);
			});
		} else {
			// Fall back to something way less secure.  The user has already been warned.
			let retval = Math.floor(Math.random() * max);
			resolve(retval);
		}
	});
} // End of getRandomValue()

/**
* Convert a number from base 10 into base 6.
*
* @param integer roll The random value.
* @param integer num_dice The number of dice we're returning.
*
* @return array An array of the base 6 numbers.
*/
function getBase6 (roll, num_dice) {
	let retval = [];
	// Sanity check
	let max_dice_roll = Math.pow(6, num_dice) - 1;
	if (roll > max_dice_roll) {
		throw(new Error("Value too large!"));
	}
	if (roll < 0) {
		throw(new Error("Value cannot be negative!"));
	}
	// Go through each die, starting with the most significant one, and 
	// get its value.
	let num_dice_left = num_dice - 1;
	let dice_value_left = roll;
	for (let i = num_dice_left; i >= 0; i--) {
		let die_value = Math.pow(6, i);
		let value = Math.floor( dice_value_left / die_value);
		let left = dice_value_left % die_value;
		retval.push(value);
		dice_value_left = dice_value_left - (die_value * value);
	}
	return(retval);
} // End of getBase6()


/**
* Convert a base-6 number to a dice roll
*
* @param array roll An array of integers in base-6 notation
* @param integer num_dice The number of dice rolled
*
* @return array An array of integers representing dice rolls
*/
function convertBase6ToDice (roll, num_dice) {

	let retval = [];

	if (roll.length != num_dice) {
		throw("Mismatch between size of roll (" + roll.length + ") and number of dice (" + num_dice + ")");
	}

	for (let k in roll) {
		let num = roll[k];

		if (num < 0) {
			throw("Value " + num + " is negative!");
		}

		if (num > 5) {
			throw("Value " + num + " is too large!");
		}

		num++;
		retval.push(num);
	}

	return(retval);

} // End of convertBase6ToDice()


/**
* Get the maximum value from the number of dice we're rolling.
* This is in a separate function so it is testable.
*/
function getNumValuesFromNumDice (num_dice) {

	let retval;

	if (num_dice == 0) {
		throw("Number of dice cannot be zero!");

	} else if (num_dice < 0){
		throw("Number of dice is negative!");

	}

	retval = Math.pow(6, num_dice);

	return(retval);

} // End of getNumValuesFromNumDice()


/**
* This is our main entry point for rolling dice.
*
* Get our maximum number for a random value, turn it into base-6, 
* then turn it into a dice roll!
*
* @return object An object that contains a dice roll and the raw random value.
*
*/
export const rollDice = (num_dice) => {
	return new Promise(function(resolve, reject) {
		let retval = {};
		let max = getNumValuesFromNumDice(num_dice);

		new Promise((resolveRandom) => {
			resolveRandom(getRandomValue(max - 1));
		})
		.then(function(random) {
			let base6 = getBase6(random, num_dice);
			let dice = convertBase6ToDice(base6, num_dice);

			retval.value = random;
			retval.roll = dice;

			resolve(retval);
		})
		.catch(function(error) {
			reject(error);
		});
	});
} // End of rollDice()



