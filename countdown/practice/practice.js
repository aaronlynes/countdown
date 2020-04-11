$('#letters-switch').click(letters_switch);
$('#numbers-switch').click(numbers_switch);

function shuffle(a) {
    var n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
}

function str_shuffle(s) {
    var a = s.split("");
    shuffle(a);
    return a.join("");
}

var clockstep = 100;
var basevowels = "AAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEIIIIIIIIIIIIIOOOOOOOOOOOOOUUUUU";
var basecons = "BBCCCDDDDDDFFGGGHHJKLLLLLMMMMNNNNNNNNPPPPQRRRRRRRRRSSSSSSSSSTTTTTTTTTVWXYZ";

var target;
var numbers;
var numbersteps;
var numbertimeout;

var is_conundrum;
var letteridx;
var clockinterval;
var clocksecs = 30;
var flashes;
var buttonflashes;
var nvowels;
var ncons;
var vowels, cons;
var letters;
var needreset;

$('#vowel-button').click(function() {
    addletter(true);
});
$('#consonant-button').click(function() {
    addletter(false);
});
$('#auto-fill-button').click(autofill);
$('#conundrum-button').click(conundrum);
$('#letters-reset-button').click(reset);
$('#letters-show-answers-button').click(showlettersanswer);
$('#numbers-show-answer-button').click(shownumbersanswer);
$('#halt-clock').click(stopclock);

$('#0large').click(function() { gennumbers(0); });
$('#1large').click(function() { gennumbers(1); });
$('#2large').click(function() { gennumbers(2); });
$('#3large').click(function() { gennumbers(3); });
$('#4large').click(function() { gennumbers(4); });
$('#random-large').click(function() {
    gennumbers(Math.floor(Math.random() * 5));
});
$('#numbers-reset-button').click(reset);

if (window.location.hash == '#numbers')
    numbers_switch();
else
    letters_switch();

function gennumbers(large) {
    if (needreset)
        reset();

    var largenums = [25, 50, 75, 100];
    var smallnums = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

    shuffle(largenums);
    shuffle(smallnums);

    numbers = [];

    for (var i = 1; i <= large; i++)
        numbers.push(largenums[i-1]);

    for (var i = large+1; i <= 6; i++)
        numbers.push(smallnums[i-(large+1)]);

    target = Math.floor(Math.random() * (899)) + 101;

    numbersteps = 30;
    addnumber();
}

function addnumber() {
    numbersteps--;

    if (numbers.length > 0) {
        $('#number' + numbers.length).html(numbers[numbers.length-1]);
        numbers = numbers.slice(0, numbers.length-1);
        numbertimeout = setTimeout(addnumber, 400);
    } else if (numbersteps > 0) {
        gentarget();
        numbertimeout = setTimeout(addnumber, 50);
    } else {
        $('#numbers-target').html(target);
        startclock();
    }
}

function gentarget() {
    $('#numbers-target').html(Math.floor(Math.random() * (899)) + 101);
}

function letters_switch() {
    $('#letters-switch').addClass('btn-primary');
    $('#numbers-switch').removeClass('btn-primary');
    $('#letters-game').css('display', 'block');
    $('#numbers-game').css('display', 'none');
    if (window.location.hash)
        window.location.hash = '';
    clocksecs = 30;
    stopclock();
    reset();
}

function numbers_switch() {
    $('#numbers-switch').addClass('btn-primary');
    $('#letters-switch').removeClass('btn-primary');
    $('#numbers-game').css('display', 'block');
    $('#letters-game').css('display', 'none');
    window.location.hash = 'numbers';
    clocksecs = 30;
    stopclock();
    reset();
}

function addletter(vowel) {
    if (needreset)
        reset();

    var letter = vowel ? getvowel() : getconsonant();

    $('#letter' + letteridx).html(letter);
    letters += letter;
    letteridx++;

    if (letteridx > 9) {
        startclock();
    }

    /* at most 6 consonants; at most 5 vowels */
    if (vowel)
        nvowels++;
    else
        ncons++;
    if (ncons == 6)
        $('#consonant-button').prop('disabled', true);
    if (nvowels == 5)
        $('#vowel-button').prop('disabled', true);
}

function getvowel() {
    var c = vowels.substring(0, 1);
    vowels = vowels.substring(1);
    return c;
}

function getconsonant() {
    var c = cons.substring(0, 1);
    cons = cons.substring(1);
    return c;
}

function autofill() {
    if (needreset)
        reset();

    if (letteridx <= 9) {
        if (ncons >= 6) {
            addletter(true);
        } else if (nvowels >= 5) {
            addletter(false);
        } else {
            if (Math.random() < 0.5)
                addletter(true);
            else
                addletter(false);
        }

        if (letteridx <= 9)
            setTimeout(autofill, 250);
    }
}

function conundrum() {
    var r = Math.random();
    jQuery.ajax('/countdown/practice/conundrum.php?r=' + r, {
        success: function(data, status, jqxhr) {
            reset();
            result = [];
            solve_letters(data.toLowerCase(), function(word) { if (word.length == 9) result.push(word); });
            if (result.length == 1) {
                a = data.toUpperCase().split("");
                letters = '';
                for (var i = 0; i < 9; i++) {
                    $('#letter' + (i+1)).html(a[i]);
                    letters += a[i];
                }
                letteridx = 9;
                is_conundrum = true;
                startclock();
            } else {
                conundrum();
            }
        },
    });
}

function startclock() {
    $('#vowel-button').prop('disabled', true);
    $('#consonant-button').prop('disabled', true);
    $('#auto-fill-button').prop('disabled', true);
    $('#conundrum-button').prop('disabled', true);
    for (var i = 0; i <= 4; i++)
        $('#' + i + 'large').prop('disabled', true);
    $('#random-large').prop('disabled', true);
    $('#halt-clock').prop('disabled', false);
    $('#letters-show-answers-button').prop('disabled', false);
    $('#numbers-show-answer-button').prop('disabled', false);
    clockinterval = setInterval(tickclock, clockstep);
    clocksecs = 30;
    needreset = true;
    renderclock();
    var myMusic=document.getElementById("music");
    myMusic.play();
}

function stopclock() {
    $('#vowel-button').prop('disabled', false);
    $('#consonant-button').prop('disabled', false);
    $('#auto-fill-button').prop('disabled', false);
    $('#conundrum-button').prop('disabled', false);
    for (var i = 0; i <= 4; i++)
        $('#' + i + 'large').prop('disabled', false);
    $('#random-large').prop('disabled', false);
    $('#check-word-word').prop('disabled', false);
    $('#check-word-button').prop('disabled', false);
    clearInterval(clockinterval);

    $('#halt-clock').prop('disabled', true);

    if (clocksecs != 30)
        buttonflash();
    var myMusic=document.getElementById("music");
    myMusic.pause();
}

function screenflash() {
    flashes = 2;
    $('#flash').css('width', $(document).width());
    $('#flash').css('height', $(document).height());
    togglescreenflash();
}

function togglescreenflash() {
    $('#flash').css('display', flashes % 2 == 0 ? 'block' : 'none');
    flashes--;
    if (flashes > 0)
        setTimeout(togglescreenflash, 250);
}

function buttonflash() {
    buttonflashes = 6;
    togglebuttonflash();
}

function togglebuttonflash() {
    if (buttonflashes % 2 == 0) {
        $('#letters-show-answers-button').addClass('btn-warning');
        $('#letters-show-answers-button').removeClass('btn-success');
        $('#numbers-show-answer-button').addClass('btn-warning');
        $('#numbers-show-answer-button').removeClass('btn-success');
    } else {
        $('#letters-show-answers-button').addClass('btn-success');
        $('#letters-show-answers-button').removeClass('btn-warning');
        $('#numbers-show-answer-button').addClass('btn-success');
        $('#numbers-show-answer-button').removeClass('btn-warning');
    }
    buttonflashes--;
    if (buttonflashes > 0)
        setTimeout(togglebuttonflash, 250);
}

function tickclock() {
    clocksecs -= clockstep / 1000;
    renderclock();

    if (clocksecs <= 0) {
        stopclock();
        screenflash();
    }
}

function renderclock() {
    var c = $('#clock-canvas').get()[0];
    var ctx = c.getContext("2d");

    /* parameters */
    var dim = 200;
    var mid = dim/2;

    ctx.clearRect(0, 0, dim, dim);

    /* outer ring */
    ctx.beginPath();
    ctx.arc(mid, mid, mid-5, 0, 2*Math.PI);
    ctx.strokeStyle = 'darkblue';
    ctx.lineWidth = 4;
    ctx.stroke();

    /* lit-up area */
    ctx.strokeStyle = 'khaki';
    ctx.lineWidth = 7;
    for (var a = 0; a <= (30 - clocksecs); a++) {
        if (a % 15 == 0)
            continue;
        ctx.beginPath();
        ctx.moveTo(
            mid + (mid-10) * Math.sin(Math.PI * 2 * a / 60),
            mid - (mid-10) * Math.cos(Math.PI * 2 * a / 60));
        ctx.lineTo(
            mid + (mid-50) * Math.sin(Math.PI * 2 * a / 60),
            mid - (mid-50) * Math.cos(Math.PI * 2 * a / 60));
        ctx.stroke();
    }

    /* pips */
    ctx.strokeStyle = 'darkblue';
    ctx.lineWidth = 2;
    for (var a = 0; a < 60; a += 5) {
        ctx.beginPath();
        ctx.moveTo(
            mid + (mid-10) * Math.sin(Math.PI * 2 * a / 60),
            mid + (mid-10) * Math.cos(Math.PI * 2 * a / 60));
        ctx.lineTo(
            mid + (mid-40) * Math.sin(Math.PI * 2 * a / 60),
            mid + (mid-40) * Math.cos(Math.PI * 2 * a / 60));
        ctx.stroke();
    }

    /* weird cross thing */
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.moveTo(mid, 5);
    ctx.lineTo(mid, dim-5);
    ctx.moveTo(5, mid);
    ctx.lineTo(dim-5, mid);
    ctx.stroke();

    /* hand */
    ctx.fillStyle = 'darkblue';
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mid, mid);
    ctx.lineTo(
            mid + 7 * Math.sin(Math.PI * 2 * (clocksecs - 15) / 60),
            mid + 7 * Math.cos(Math.PI * 2 * (clocksecs - 15) / 60));
    ctx.lineTo(
            mid + (mid-5) * Math.sin(Math.PI * 2 * clocksecs / 60),
            mid + (mid-5) * Math.cos(Math.PI * 2 * clocksecs / 60));
    ctx.lineTo(
            mid + 7 * Math.sin(Math.PI * 2 * (clocksecs + 15) / 60),
            mid + 7 * Math.cos(Math.PI * 2 * (clocksecs + 15) / 60));
    ctx.lineTo(mid, mid);
    ctx.fill();
    ctx.stroke();
}

function reset() {
    clearTimeout(numbertimeout);

    needreset = false;
    is_conundrum = false;

    stopclock();
    clearInterval(clockinterval);
    clocksecs = 30;
    renderclock();

    letters = '';
    nvowels = 0;
    ncons = 0;
    vowels = str_shuffle(basevowels);
    cons = str_shuffle(basecons);

    $('#vowel-button').prop('disabled', false);
    $('#consonant-button').prop('disabled', false);
    $('#auto-fill-button').prop('disabled', false);
    $('#conundrum-button').prop('disabled', false);
    $('#letters-show-answers-button').prop('disabled', true);
    $('#numbers-show-answer-button').prop('disabled', true);

    for (var i = 1; i <= 9; i++)
        $('#letter' + i).html('');
    letteridx = 1;

    $('#answer').html("");
    $('#working').val('');
    $('#check-word-word').val('');
    $('#check-word-output').html('');
    $('#check-word-output').removeClass('alert');
    $('#check-word-output').removeClass('alert-error');
    $('#check-word-output').removeClass('alert-success');
    $('#check-word-word').prop('disabled', true);
    $('#check-word-button').prop('disabled', true);

    for (var i = 1; i <= 6; i++)
        $('#number' + i).html('');
    $('#numbers-target').html('000');
    for (var i = 0; i <= 4; i++)
        $('#' + i + 'large').prop('disabled', false);

    $('#letters-show-answers-button').addClass('btn-success');
    $('#letters-show-answers-button').removeClass('btn-warning');
    $('#numbers-show-answer-button').addClass('btn-success');
    $('#numbers-show-answer-button').removeClass('btn-warning');
}

function showlettersanswer() {
    if (clocksecs > 0)
        stopclock();

    var result = [];

    solve_letters(letters.toLowerCase(), function(word, c) { result.push([word, c]); });

    result.sort(function(a, b) {
        if (b[0].length != a[0].length)
            return b[0].length - a[0].length;
        else
            return b[1] - a[1];
    });

    if (is_conundrum) {
        r = [];
        for (var i = 0; i < result.length; i++)
            if (result[i][0].length == 9)
                r.push(result[i]);
        result = r;
    }

    var extralines = '';
    for (var i = result.length; i < 10; i++)
        extralines += "\n";

    $('#answer').html(result.map(function(a) { return a[0]; }).join("\n"));

    var best = result.length ? result[0][0].toUpperCase() : '';
    if (best.length == 9) {
        best += '         ';
        for (var i = 0; i < 9; i++)
            $('#letter' + (i+1)).html(best.charAt(i));
    }

    $('#letters-show-answers-button').prop('disabled', true);
    $('#numbers-show-answer-button').prop('disabled', true);
}

function shownumbersanswer() {
    if (clocksecs > 0)
        stopclock();

    var numbers = [];
    var target = $('#numbers-target').html();

    for (var i = 1; i <= 6; i++)
        numbers.push(parseInt($('#number' + i).html()));

    $('#answer').html(solve_numbers(numbers, target, false));

    $('#letters-show-answers-button').prop('disabled', true);
    $('#numbers-show-answer-button').prop('disabled', true);
}

function checkword() {
    var word = $('#check-word-word').val();

    var errors = '';
    if (!sufficient_letters(word.toLowerCase(), letters.toLowerCase()))
        errors += "Wrong letters. "; /* TODO: be more specific */
    if (!word_in_dictionary(word.toLowerCase()))
        errors += "Word not in dictionary.";

    if (errors.length > 0) {
        $('#check-word-output').html(errors);
        $('#check-word-output').addClass('alert');
        $('#check-word-output').addClass('alert-error');
        $('#check-word-output').removeClass('alert-success');
    } else {
        $('#check-word-output').html('Nice word!');
        $('#check-word-output').addClass('alert');
        $('#check-word-output').addClass('alert-success');
        $('#check-word-output').removeClass('alert-error');
    }
}
