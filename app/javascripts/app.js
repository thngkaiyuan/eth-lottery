var accounts;
var account;

String.prototype.rjust = function( width, padding ) {
    padding = padding || " ";
    padding = padding.substr( 0, 1 );
    if( this.length < width )
        return padding.repeat( width - this.length ) + this;
    else
        return this;
}

function displayrise(val) {
    var s = val.toString();
    var res = "POOL "
    res += s.rjust(10, "0");
    res += " SZ";
    res = res.replace("5", "S");

    display.setValue(res);
}

function timeout_display(current, target, step) {
    if (current <= target) {
        displayrise(current);
        setTimeout(timeout_display, 1, current + step, target, step);
    }
}

function update_ticker() {
    var l = Lottery.deployed();

    l.total_bets.call().then(function(tbets) {
        l.ticket_price.call().then(function(tprice) {
            var szprice = tprice / 1000000000000;
            var total = tbets * szprice;
            if (total > 0) {
                timeout_display(total - 5000, total, 1);
            }
            return null;
        });
        return null;
    });
}

function update_cost() {
    var l = Lottery.deployed();

    l.ticket_price.call().then(function(tprice) {
        var pe = document.getElementById("guess_text");
        pe.textContent += web3.fromWei(tprice).toString() + " ETH";
    });
}

function init_slider() {
    $('#slide_01').on('input', function() {
        var s = "Purchase Ticket (Guess: " + this.value.toString() + ")";
        $('#purchase_button').text(s);
    });
}

function init_draw_button() {
    var l = Lottery.deployed();

    l.start_date.call().then(function(start_date) {
        l.waiting_period.call().then(function(waiting_period) {
            var now = Math.round(new Date().getTime()/1000);
            var diff = now - start_date;
            if (diff >= waiting_period) {
                $('#draw_button').removeAttr("disabled");
            }
            return null;
        });
        return null;
    });
}

function perform_drawing() {
    var l = Lottery.deployed();

    l.draw.estimateGas().then(function(gasEst) {
        l.draw.sendTransaction({from: accounts[2], gas: gasEst * 1.5});
    });
}

window.onload = function() {
  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    accounts = accs;
    account = accounts[0];

    init_slider();
    init_draw_button();
    update_cost();
    update_ticker();
  });
}
