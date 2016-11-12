pragma solidity ^0.4.2;

contract Lottery {

    // price of a ticket
    uint public ticket_price;

    uint public betting_period;
    // waiting period before a draw can be made (after the betting period)
    uint public waiting_period;

    // date when lottery is opened
    uint public start_date;

    // total bets
    uint public total_bets;

    // { guess => [address] }
    mapping(uint => address[]) public bets;
    // { guess => [address].length }
    mapping(uint => uint) public bets_lengths;

    // bounds of guess
    uint public lower_bound;
    uint public upper_bound;

    // organiser of the lottery
    address public organiser;

    // Events
    event Drawn(address _drawer, uint winning_number, uint num_winners);
    event Betted(address _better, uint bet);

    function Lottery(uint _betting_period, uint _waiting_period) {
        ticket_price = 0.1 ether;
        betting_period = _betting_period;
        waiting_period = _waiting_period;
        lower_bound = 0;
        upper_bound = 100;
        total_bets = 0;
        organiser = msg.sender;
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
        total_bets += 1;
    }

    function clear_all_bets() private {
        for (uint i = lower_bound; i <= upper_bound; i++) {
            bets_lengths[i] = 0;
        }
        total_bets = 0;
    }

    /**
    * Takes a guess from the player and adds it to the existing round
    */
    function make_bet(uint guess) payable public {
        // Check if the bet is made within the betting period
        if (now - start_date > betting_period) throw;

        // Check if the sender sent the correct amount
        if (msg.value != ticket_price) throw;

        // Check if the guess is valid
        if (lower_bound > guess || guess > upper_bound) throw;

        // { guess => address } is recorded for prize distribution later
        insert_bet(guess, msg.sender);
        Betted(msg.sender, guess);
    }


    /**
    * Starts the draw for the existing round (if conditions are met)
    */
    function draw() payable public {
        // Check guard conditions
        if ((now - start_date) < (betting_period + waiting_period)) throw;

        // Pick winning number
        var winning_number = get_winning_number();

        // Calculate prizes
        var total_prize = this.balance * 4 / 5;
        var call_incentive = this.balance * 1 / 20;

        // Distribute prize amongst winners
        var num_of_winners = bets_lengths[winning_number];

        if (num_of_winners > 0) {
            var split_prize = total_prize / num_of_winners;
            for (uint i = 0; i < num_of_winners; i++) {
                if (!bets[winning_number][i].send(split_prize)) throw;
            }
        }

        // Reward caller of draw function
        if (!msg.sender.send(call_incentive)) throw;

        // Reset state to allow new bets
        reset_state();
        Drawn(msg.sender, winning_number, num_of_winners);
    }

    function get_winning_number() private returns (uint) {
        var range = (upper_bound - lower_bound) + 1;
        var offset = uint256(block.blockhash(block.number-1)) % range;
        return lower_bound + offset;
    }

    function shutdown() {
        if (total_bets == 0 && msg.sender == organiser) {
            suicide(organiser);
        }
        else {
            throw;
        }
    }
}
