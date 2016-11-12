var accounts;
var account;
var current_timeout;
var init_block;

String.prototype.rjust = function( width, padding ) {
    padding = padding || " ";
    padding = padding.substr( 0, 1 );
    if( this.length < width )
        return padding.repeat( width - this.length ) + this;
    else
        return this;
}

function displayrise(val) {
    var cval = Math.round(val);
    var s = cval.toString();
    var res = "POOL ";
    var unit = " SZ";
    if (s.length > 10) {
        s = Math.round(val/1000000).toString();
        unit = "ETH"
    }
    res += s.rjust(10, "0");
    res += unit;
    res = res.replace(/5/g, "S");

    display.setValue(res);
}

function timeout_display(current, target, step) {
    if (current <= target) {
        displayrise(current);
        current_timeout = setTimeout(timeout_display, 1, current + step, target, step);
    }
}

function update_ticker() {
    var l = Lottery.deployed();

    l.total_bets.call().then(function(tbets) {
        var tpool = web3.eth.getBalance(l.address);
        var te = document.getElementById("ticket_text");
        te.textContent = "Tickets in Pool: " + tbets.toString();
        var total = tpool / 1000000000000;
        if (total > 0) {
            var initial = total - 5000;
            if (initial < 0) {
                initial = 0;
            }
            if (current_timeout) {
                clearTimeout(current_timeout);
            }
            timeout_display(total - 5000, total, 1);
        }
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

function sync_guess(val) {
    if (isNaN(val)) {
        val = 0;
    }
    if (val > 100) {
        val = 100;
    }
    if (val < 0) {
        val = 0;
    }
    var s = "Purchase Ticket (Guess: " + val.toString() + ")";
    $('#purchase_button').text(s);
    $('#guess_textfield').get(0).value = val.toString();
    $("#slide_01").get(0).MaterialSlider.change(val);
}

function init_slider() {
    $('#slide_01').on('input', function() {
        sync_guess(this.value);
    });

    $('#guess_textfield').keyup(function() {
        if ($('#guess_textfield').val() != "") {
            var val = parseInt($('#guess_textfield').val());
            sync_guess(val);
        }
    });
}

function init_draw_button() {
    var l = Lottery.deployed();


    if (web3.eth.getBalance(l.address).toNumber() == 0) {
        $('#draw_button').prop("disabled", true);
        return;
    }

    l.start_date.call().then(function(start_date) {
        l.waiting_period.call().then(function(waiting_period) {
            l.total_bets.call().then(function(total_bets) {
                if (total_bets == 0) {
                    $('#draw_button').prop("disabled", true);
                    return null;
                }
                var now = Math.round(new Date().getTime()/1000);
                var diff = now - start_date;
                if (diff >= waiting_period) {
                    $('#draw_button').removeAttr("disabled");
                }
                return null;
            });
            return null;
        });
        return null;
    });
}

function perform_drawing() {
    var l = Lottery.deployed();

    if (web3.eth.getBalance(l.address).toNumber() == 0) {
        show_toast("Sorry, you can't draw since there's nothing in the pool.");
        return;
    }

    l.draw.estimateGas().then(function(gasEst) {
        l.draw.sendTransaction({from: account, gas: 1000000}).then(function(tx) {
            show_toast("Thank you for drawing! Please check your account balance.");
            return null;
        });
        return null;
    });
}

function change_active_address(acc_change) {
    account = acc_change;
    $('#active_address').text(account.substring(2));

    show_toast('Active account switched to ' + account);
}

function show_toast(message, duration = 2000) {
    var snackbarContainer = document.querySelector('#demo-snackbar-example');
    var showSnackbarButton = document.querySelector('#demo-show-snackbar');
    var data = {
      message: message,
      timeout: duration,
    };
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

function populate_addresses() {
    var address_container = $('#account_menu');
    for (var i in accounts) {
        var ta = '<li class="mdl-menu__item" onclick="change_active_address(\''
            + accounts[i] + '\')">' + accounts[i].substring(2) + '</li>';
        address_container.append(ta);
    }
}

function perform_purchase() {
    var l = Lottery.deployed();

    var guess = $('#slide_01').get(0).value;
    l.ticket_price.call().then(function(price) {
        l.make_bet.sendTransaction(guess, {from: account, value: price, gas: 1000000}).then(function(tx) {
            show_toast("Ticket purchased!");
            update_ticker();
            return null;
        });
        return null;
    });
}

function add_event_watchers() {
    var l = Lottery.deployed();

    l.Drawn().watch(drawn_callback);
    l.Betted().watch(betted_callback);
}

function drawn_callback(err, res) {
    if (res.blockNumber > init_block) {
        var msg = "Lottery has been drawn by " + res.args._drawer;
    }
    else {
        var msg = "Lottery was last drawn by " + res.args._drawer;
    }
    msg += ".\nWinning number was " + res.args.winning_number.toString();
    msg += " (" + res.args.num_winners + " winners)";

    show_toast(msg, 10000);
    init_draw_button();
    update_ticker();
}

function betted_callback(err, res) {
    init_draw_button();
    update_ticker();
}

function pick_for_me() {
    var random_guess = Math.floor((Math.random() * 101));
    sync_guess(random_guess);
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
    init_block = web3.eth.blockNumber;

    populate_addresses();
    change_active_address(account);
    init_slider();
    init_draw_button();
    update_cost();
    update_ticker();
    add_event_watchers();
  });
}
