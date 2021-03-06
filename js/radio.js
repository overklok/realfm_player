const COLORS = ['#006996', '#fc0000'];

const __bar_container = document.getElementById('bars');
const __volume_toggle = document.getElementById('volume-toggle');
const __volume_slider = document.getElementById('volume-slider');
const __volume_bar = document.getElementById('volume-bar');
const __live = document.getElementById('live');
const __subtitle = document.getElementById('subtitle');
const __clock = document.getElementById('clock');
const __counter = document.getElementById('counter');
const __button = document.getElementById('button');
const __btnstat = document.getElementById('btnstat');
const __player = document.getElementById('player');
const __player_wrap = __player.parentNode;

var sound = undefined;
var timer = undefined;

var time = 0;
var state = {};
var play_after_stop = false;
var volumebar_show = false;
var volumebar_timer = false;

barColor();
syncState({
    playback: 'stop',
    volume: .8,
    mute: false,
    live: null,
});

window.addEventListener('load', onresize);
window.addEventListener('resize', onresize);

__button.addEventListener('click', togglePlayer);

__volume_bar.addEventListener('change', setVolume);

if (mobileCheck()) {
    __volume_toggle.addEventListener('click', toggleMute);
    __volume_slider.style.display = 'none';
} else {
    document.addEventListener('mouseover', toggleVolume);
}

__live.addEventListener('click', resetPlayback);

updateClock();
// refreshListeners();

// setInterval(refreshListeners, 5000);

function togglePlayer() {
    switch (state.playback) {
        case "stop":    play();     break;
        case "pause":   play();     break;
        case "play":    pause();    break;
    }
}

function toggleVolume(evt) {
    if (evt.target.parentNode.id == 'volume-toggle' || evt.target.id == 'volume-bar') {
        volumebar_show = true;
        __volume_slider.style.opacity = 1;

        if (volumebar_timer != null) {
            clearTimeout(volumebar_timer);

            volumebar_timer = null;
        }
    } else {
        if (volumebar_show === true) {
            volumebar_show = false;

            volumebar_timer = setTimeout(function() {
                if (volumebar_show === false) {
                    __volume_slider.style.opacity = 0;        
                }
            }, 5000);    
        }
    }
}

function toggleMute(evt) {
    syncState({mute: !state.mute});
}

function setVolume() {
    const level = Number(__volume_bar.value) / 100;
    syncState({volume: level});
}

function resetPlayback() {
    play_after_stop = true;
    stop();
}

function syncState(newState) {
    if (newState.playback != null && newState.playback != state.playback) {
        switch (newState.playback) {
            case "stop":
                __button.innerHTML = '<i class="fas fa-play"></i>';
                __subtitle.innerText = 'Остановлено';
                break;
            case "pause":
                __button.innerHTML = '<i class="fas fa-play"></i>';
                __subtitle.innerText = 'Пристановлено';
                break;
            case "play":
                __button.innerHTML = '<i class="fas fa-pause"></i>';
                __subtitle.innerText = 'Проигрывается';
                break;
            case "locked":
                __subtitle.innerText = 'Подождите...';
        }
    }

    if (newState.volume != null && newState.volume != state.volume) {
        volume(newState.volume);
    }

    if (newState.mute != null && newState.mute != state.mute) {
        mute(newState.mute);
    }

    Object.assign(state, newState);

    if ((state.volume > 0 && state.mute === false) && state.playback === 'play') {
        __bar_container.classList.add('bars_active');
    } else {
        __bar_container.classList.remove('bars_active');
    }

    if (state.playback === 'play') {
        __btnstat.classList.add('btnstat_active');
    } else {
        __btnstat.classList.remove('btnstat_active');
    }

    if (state.live) {
        __live.classList.add('live_active');
    } else {
        __live.classList.remove('live_active');
    }
}

function play() {
	if (!sound) {
		sound = new Howl({
	        src: 'https://mediaplus.radio-tochka.com/mediaplus/',
            // src: 'https://radio-tochka.com:6445',
	        html5: true,
            onplay: onplay,
            onpause: onpause,
            onstop: onstop,
            onseek: onseek,
            volume: state.volume,
            mute: state.mute,
            // onloaderror: function(d) {console.log('load error', d)},
            // onplayerror: function(d) {console.log('play error', d)}
	    });
	}

	sound.play();
	syncState({playback: "locked"});
}

function stop() {
	sound && sound.stop();
	syncState({playback: "locked"});
}

function pause() {
	sound && sound.pause();
	syncState({playback: "locked"});
}

function volume(vol) {
	sound && sound.volume(vol);

    __volume_bar.value = vol * 100;
}

function mute(enabled) {
	sound && sound.mute(enabled);

	if (enabled) {
	    __volume_toggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
	    __volume_toggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

function onplay() {
    syncState({playback: "play", live: state.live === null ? true: state.live});
    timer = setInterval(updateClock, 1000);
}

function onpause() {
    syncState({playback: "pause", live: false});
    timer && clearInterval(timer);
}

function onstop() {
    syncState({playback: "stop", live: null});

    if (play_after_stop) {
        play_after_stop = false;
        play();
    }

    timer && clearInterval(timer);
}

function onseek() {
    console.log('seek');
}

function onresize() {
    const w = __player_wrap.getBoundingClientRect().width * .8,
          w_max = __player_wrap.getBoundingClientRect().height * .8,
          size = Math.min(w, w_max) + 'px';

    player.style.height = size; 
    player.style.width = size; 
}

function refreshListeners() {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'text/html');
    myHeaders.append('Accept', 'text/html');

    fetch('http://radio-tochka.com:6445/7.html', {
        mode: 'no-cors',
        method: 'get',
        headers: myHeaders
    }).then(function(response) {
        console.log(response.body)

        response.text().then(function(text) {
            console.log(text);
        })
    }).catch(function(err) {
      console.log(err)
    });
}

function updateClock() {
    __clock.innerText = String(new Date(time * 1000).toISOString().substr(11, 8));
    time += 1;
}

function barColor() {
    const bars = document.getElementsByClassName('bar');

    for (let i = 0; i < bars.length; i++) {
        bars[i].style.setProperty('--background', COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
}

function mobileCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};