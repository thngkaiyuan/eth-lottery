# eth-lottery

![image](https://cloud.githubusercontent.com/assets/10496851/20247030/5d2e21a4-a9fe-11e6-9698-422681e21aec.png)


# Description

Eth-Lottery is a decentralised lottery contract-cum-web app that is powered purely by the Ethereum blockchain. Players may place unlimited bets on numbers between 0 to 100 for a small price and the bet money accumulates in the lottery pool. At the end of the lottery cycle, a draw is triggered and a winning number is selected. The pool money (less overheads) will then be distributed equally amongst all the winners. If there are no winners for a round, the pool money is rolled over for the next draw.

<br>
# Features

There are several reasons why Eth-Lottery is a preferred choice over other lotteries:
- The lottery is **completely decentralized**. Therefore, there is no need to trust a centralized authority.
- Every step of the lottery is **transparent** and **auditable** because our source code is public.
- The winning number is as **unpredictable** as the blockchain itself.
- Transactions are completely **anonymous** (or pseudonymous). Only your Ether wallet address will be revealed.
- Our lottery code has been **thoroughly tested** with automated tests.
- We present an intuitive user interface for the **best user experience**.

<br>
# How It Works

1. **Initialization**

  During contract initialization, the following parameters will be set:
  - The ticket price (e.g. 0.1 ether)
  - The betting duration of each lottery cycle (e.g. 1 week)
  - The waiting duration after each betting period (e.g. 10 minutes)
  - The bounds of the winning number (e.g. 0 to 100)
  - The organiser of the lottery (e.g. us)
  On top of initializing the parameters mentioned above, the constructor will also set the total number of bets to zero and reset all bet records.
  
2. **Placing Bets**

  Bets are made by sending a transaction with the make_bet() function. When bets are made, validations checks are first done to ensure that (1) the bet is made within the betting period, (2) the correct amount was sent and (3) the bet number falls within the permitted bounds. Then, the sender’s wallet address is added to a data structure that maps valid bet numbers to a list of wallet addresses.
  
  ![image](https://cloud.githubusercontent.com/assets/10496851/20247157/0f56f4ae-aa00-11e6-8b07-72860b619678.png)
  
  The start date of the round is set to the current time if the ticket is the first one purchased in the current round. This implies that the round only truly begins after the first ticket is purchased. Players may place their bets from then until the betting period has elapsed.
  
  Every time a bet is placed, a Betted event is emitted containing the better’s address and the number bet.

3. **Performing the Draw**

  At the end of the betting period, a mandatory waiting period is imposed in which no action may be taken. After the waiting period has elapsed, players will be allowed (and in fact incentivized, as we will see later on) to perform the lottery draw. Draws are performed by sending a transaction with the draw() function. 
  
  First, the winning number will be generated from the blockchain (we will elaborate on this later). Then, 90% of the pool money will be distributed equally amongst all the winners. Another 5% of the pool money goes to the person who performed the lottery draw and the remaining 5% of the pool money remains in the pool (mainly to cover the cost of gas and to accrue profit for the organisers). Finally, the bet records are reset and a new lottery round starts.
  
  Every time the draw is performed, a Drawn event is emitted containing the drawer’s address, the winning number, and the number of winners.
  
4. **Ensuring the Randomness of the Winning Number**

  There are several options for obtaining a random winning number:
  - Consult an external oracle (e.g. Oracalize.It). This option requires everyone to trust the external oracle and its source of randomness. Obviously, this is undesirable as we want a solution that is completely decentralized from any single entity.
  - Combine “random” values from each player using commitments (e.g. RANDAO). This solution would be desirable if not for the fact that a well-funded adversary is be able to exert a huge influence on the generated value. An attack can be done by first placing many commitments before choosing whether or not to reveal each of them. The more commitments this adversary can make, the greater his influence on the generated value.
  - Derive the random value from the blockhash. This solution is ideal because it is secure and easy to implement. We argue its security using the following attack models:

    1. **Adversary’s objective**: Spot the winning number and buy it
    
      **What the adversary can do**: Perform bets during the betting period and perform a draw after the waiting period.

      **What the adversary cannot do**: Game the blockchain (i.e. predict the blockhash after the waiting period of say 10 minutes).

      Our model is **secure against this attack** because the blockhash in the distant future is not predictable. Note that in a short timespan of say 10 minutes, the blockchain would have grown by about 40 blocks based on the current block time of 15s. If the adversary can predict blockhashes in such a distant future, then he would already be able to game the blockchain.

    2. **Adversary’s objective**: Time the draw to be performed only when the blockhash is favourable to his bet.
    
      **What the adversary can do**: After the waiting period, the adversary continues waiting until the blockhash is favourable to his bets before performing the draw.

      **What the adversary cannot do**: Prevent other individuals from performing the draw.

      We argue that **this adversary would not be able to delay the draw** because other players are heavily incentivized (by the 5% commission) to be the first to perform the draw. Therefore, the time of draw is not within the adversary’s control.


<br>
# Setup Instructions

1. Make sure you have [TestRPC](https://github.com/ethereumjs/testrpc) and [Truffle](https://github.com/ConsenSys/truffle) installed
2. Run testrpc using `testrpc`
3. In a separate console, run:
  1. `truffle migrate --reset` to migrate and deploy
  2. `truffle test` to execute the test suite
  3. `truffle serve` to serve the web application
