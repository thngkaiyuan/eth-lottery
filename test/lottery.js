contract('Lottery', function(accounts) {

	it("Should let you buy a ticket", function(done) {
		var guess = 42;
	  	var l = Lottery.deployed();
		var contract_initial_balance = web3.eth.getBalance(l.address).toNumber();
		var my_initial_balance = web3.eth.getBalance(accounts[0]).toNumber();

		l.bets_lengths.call(guess).then(function(initial_num_bets) {
			l.ticket_price.call().then(function(ticket_price) {
				l.make_bet.sendTransaction(guess, { from: accounts[0], value: ticket_price }).then(function() {
					var contract_final_balance = web3.eth.getBalance(l.address).toNumber();
					assert.equal(contract_final_balance - contract_initial_balance, ticket_price, "Contract did not receive the correct bet money");

					var my_final_balance = web3.eth.getBalance(accounts[0]).toNumber();
					assert(my_initial_balance - my_final_balance >= ticket_price, "I somehow managed to pay less than the ticket price");

					l.bets_lengths.call(guess).then(function(final_num_bets) {
						assert.equal(final_num_bets - initial_num_bets, 1, "Length of bets array did not increase");
					});
				});
			});
		}).then(done).catch(done);
	});

});
