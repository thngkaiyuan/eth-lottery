pragma solidity ^0.4.2;

contract Lottery {

	// price of a ticket
	uint public ticket_price;

	// waiting period to draw
	uint public waiting_period;

	// date when lottery is opened
	uint public start_date;

	// { guess => [address] }
	mapping(uint => address[]) public bets;
	// { guess => [address].length }
	mapping(uint => uint) public bets_lengths;

	// bounds of guess
	uint public lower_bound;
	uint public upper_bound;

	function Lottery() {
		ticket_price = 1;
		waiting_period = 1 weeks;
		lower_bound = 0;
		upper_bound = 1000;
		reset_state();
	}

	function reset_state() private {
		start_date = now;
		clear_all_bets();
	}

	function insert_bet(uint guess, address better) private {
		var index = bets_lengths[guess];

		if (index == bets[guess].length) {
			bets[guess].push(better);
		} else {
			bets[guess][index] = better;
		}

		bets_lengths[guess] += 1;
	}

	function clear_all_bets() private {
		for (uint i = lower_bound; i <= upper_bound; i++) {
			bets_lengths[i] = 0;
		}
	}

	/**
	 * Takes a guess from the player and adds it to the existing round
	 */
	function bet(uint guess) public {
		// Check if the sender sent the correct amount
		if (msg.value != ticket_price) throw;

		// Check if the guess is valid
		if (lower_bound > guess || guess > upper_bound) throw;

		// { guess => address } is recorded for prize distribution later
		insert_bet(guess, msg.sender);
	}


	/**
	 * Starts the draw for the existing round (if conditions are met)
	 */
	function draw() public {
		// check guard conditions
		if (now - start_date < waiting_period) throw;

		// pick winning number
		var winning_number = get_winning_number();

		// Calculate prizes
		var total_prize = this.balance * 19 / 20;
		var call_incentive = this.balance * 1 / 100;

		// distribute prize amongst winners
		var split_prize = total_prize / bets_lengths[winning_number];
		for (uint i = 0; i < bets_lengths[winning_number]; i++) {
			if (!bets[winning_number][i].send(split_prize)) throw;
		}

		// reward caller of draw function
		if (!msg.sender.send(call_incentive)) throw;

		// reset state to allow new bets
		reset_state();
	}

	function get_winning_number() private returns (uint) {
		var range = (upper_bound - lower_bound) + 1;
		var offset = uint256(block.blockhash(block.number)) % range;
		return lower_bound + offset;
	}

}
