"use strict";

const electron = require('electron');
const Moefou = require('moefou');
const Player = require('player');
const notifier = require('node-notifier');
const path = require('path');

const app = electron.app;
const Tray = electron.Tray;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

const moefou = new Moefou('a8d18630d266f5ad6979c22e18d31ff4056a24105');
const player = new Player([]);

/**
 * A state when the player is switching to next song before the song
 * plays out, it prevents multiple songs playing at the same time
 * caused by clicking 'Next' too frequently.
 * @type {Boolean}
 */
var isSwitchingSong = false;

var appIcon = null;
var menuInit = null;
var menuPlaying = null;
var menuPaused = null;

app.on('ready', function(){
  // initialize tray icon and menu items
  appIcon = new Tray('icon.png');
  menuInit = Menu.buildFromTemplate(templateInit);
  menuPlaying = Menu.buildFromTemplate(templatePlaying);
  menuPaused = Menu.buildFromTemplate(templatePaused);
  appIcon.setContextMenu(menuInit);
});

// Templates for menu items ---------------------------------------------------
var templateInit = [
  {
    label: 'Play',
    click: function() {
      appIcon.setContextMenu(menuPlaying);
      fetchSongs(function() {
        player.play();
      });
    }
  },
  {
    label: 'Quit',
    click: function() {
      app.quit();
    }
  }
];

var templatePlaying = [
  {
    label: 'Pause',
    click: function() {
      appIcon.setContextMenu(menuPaused);
      player.pause();
    }
  },
  {
    label: 'Next',
    click: function() {
      appIcon.setContextMenu(menuPlaying);
      nextSong();
    }
  },
  {
    label: 'Quit',
    click: function() {
      app.quit();
    }
  }
];

var templatePaused = [
  {
    label: 'Resume',
    click: function() {
      appIcon.setContextMenu(menuPlaying);
      player.pause();
    }
  },
  {
    label: 'Next',
    click: function() {
      appIcon.setContextMenu(menuPlaying);
      nextSong();
    }
  },
  {
    label: 'Quit',
    click: function() {
      app.quit();
    }
  }
];


// Player event listeners -----------------------------------------------------
player.on('playing',function(song){
  console.log('Now playing: ' + song.title);
  isSwitchingSong = false;

  // show notification panel
  notifier.notify({
    'title': 'Now playing: ',
    'message': song.title + (song.artist ? ' | ' + song.artist : ''),
    'icon': path.join(__dirname, 'notify-icon.jpeg')
  });
});

player.on('error', function(err){
  console.log(err);
});

/**
 * Fetch songs and add them to the music list.
 * @param  {Function} callback
 */
function fetchSongs(callback) {
  console.log('Fetching songs...');
  moefou.listenPlaylist({}, function(error, body) {
    if (error) {
      console.log(error);
    } else {
      let playlist = body.response.playlist;

      // add songs
      for (var i = 0; i < playlist.length; i++) {
        console.log('Adding: ' + playlist[i].title);
        let song = playlist[i];

        player.add({
          'src': song.url,
          'title': song.title,
          'artist': song.artist
        });
      }

      callback();
    }
  });
}

/**
 * Go to next song, fetch songs if necessary.
 */
function nextSong() {
  if (isSwitchingSong) {
    return;
  } else {
    console.log('Next song...');
    isSwitchingSong = true;

    if (notEnoughSongs()) {
      fetchSongs(function() {
        player.next();
      });
    } else {
      player.next();
    }
  }
}

/**
 * Check if the list has enough songs.
 * @return {boolean}
 */
function notEnoughSongs() {
  let current = player.playing;
  let nextIndex = player.options.shuffle ?
    chooseRandom(_.difference(list, [current._id])) :
    current._id + 1;

  return nextIndex >= player.list.length;
}
