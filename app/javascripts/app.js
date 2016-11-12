var accounts;
var account;
var current_timeout;
var current_bettimeout;
var current_drawtimeout;
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

function betcd_display(current) {
    if (current > 0) {
        var words = "Betting's closed in " + humanizeDuration(current * 1000) + "!";
        $("#bet_cd").text(words);
        current_bettimeout = setTimeout(betcd_display, 1000, current-1);
    }
    else {
        update_ticker();
    }
}

function drawcd_display(current) {
    if (current > 0) {
        var words = "Draw (Available in " + humanizeDuration(current * 1000) + ")";
        $("#draw_button").text(words);
        current_drawtimeout = setTimeout(drawcd_display, 1000, current-1);
    }
    else {
        init_draw_button();
    }
}

function update_ticker() {
    var l = Lottery.deployed();

    l.start_date.call().then(function(start_date) {
        l.betting_period.call().then(function(betting_period) {
            l.total_bets.call().then(function(tbets) {
                var tpool = web3.eth.getBalance(l.address);
                var te = document.getElementById("ticket_text");
                te.textContent = "Tickets in Pool: " + tbets.toString();
                var total = tpool / 1000000000000;
                if (total > 0) {
                    var initial = total - 10000;
                    if (initial < 0) {
                        initial = 0;
                    }
                    if (current_timeout) {
                        clearTimeout(current_timeout);
                    }
                    timeout_display(initial, total, 1);
                }
                if (current_bettimeout) {
                    clearTimeout(current_bettimeout);
                }
                if (tbets == 0) {
                    $("#bet_cd").text("There are no tickets in the pool. Be the first!");
                        $('#guess_textfield').removeAttr("disabled");
                        $('#slide_01').removeAttr("disabled");
                        $('#pick_button').removeAttr("disabled");
                        $('#purchase_button').removeAttr("disabled");
                }
                else {
                    var now = Math.round(new Date().getTime()/1000);
                    var diff = now - start_date.toNumber();
                    var bperiod = betting_period.toNumber();
                    if (diff >= bperiod) {
                        $('#guess_textfield').prop("disabled", true);
                        $('#slide_01').prop("disabled", true);
                        $('#pick_button').prop("disabled", true);
                        $('#purchase_button').prop("disabled", true);
                        $("#bet_cd").text("Betting period is over! Please wait for the draw.");
                    }
                    else {
                        $('#guess_textfield').removeAttr("disabled");
                        $('#slide_01').removeAttr("disabled");
                        $('#pick_button').removeAttr("disabled");
                        $('#purchase_button').removeAttr("disabled");
                        betcd_display(bperiod - diff);
                    }
                }
                return null;
            });
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
    var s = "(2) Get Lucky With The Number " + val.toString() + "!";
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
        l.betting_period.call().then(function(betting_period) {
            l.waiting_period.call().then(function(waiting_period) {
                l.total_bets.call().then(function(total_bets) {
                    if (total_bets == 0) {
                        $('#draw_button').prop("disabled", true);
                        return null;
                    }
                    var now = Math.round(new Date().getTime()/1000);
                    var diff = now - start_date.toNumber();
                    tperiod = betting_period.toNumber() + waiting_period.toNumber();
                    if (diff >= tperiod) {
                        $('#draw_button').removeAttr("disabled");
                        if (current_drawtimeout) {
                            clearTimeout(current_drawtimeout);
                        }
                        $('#draw_button').text("Draw")
                    }
                    else {
                        var count = tperiod - diff
                        drawcd_display(count);
                    }
                    return null;
                });
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

    l.draw.sendTransaction({from: account, gas: 1000000}).then(function(tx) {
        show_toast("Thank you for drawing! \n The commission will be transferred to you shortly if you are the first to perform the draw.", 5000);
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
            show_toast("May the odds be ever in your favour!");
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
    pick_for_me();
  });
}
