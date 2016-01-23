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
const API_KEY = 'a8d18630d266f5ad6979c22e18d31ff4056a24105';

const moefou = new Moefou(API_KEY);
const player = new Player().enable('stream');

/**
 * A state when the player is switching to next song before the song
 * plays out, it prevents multiple songs playing at the same time
 * caused by clicking 'Next' too frequently.
 * @type {Boolean}
 */
var isSwitchingSong = false;

var tray = null;
var menuInit = null;
var menuPlaying = null;
var menuPaused = null;

app.on('ready', function(){
  // initialize tray icon and menu items
  tray = new Tray('icon.png');

  menuInit = Menu.buildFromTemplate([
    menuItems.play,
    menuItems.quit
  ]);

  menuPlaying = Menu.buildFromTemplate([
    menuItems.next,
    menuItems.pause,
    menuItems.quit
  ]);

  menuPaused = Menu.buildFromTemplate([
    menuItems.next,
    menuItems.resume,
    menuItems.quit
  ]);

  tray.setContextMenu(menuInit);
});

// Menu items and event listeners ---------------------------------------------
const menuItems = {
  play: {
    label: 'Play',
    click: function() {
      tray.setContextMenu(menuPlaying);
      fetchSongs(function() {
        player.play();
      });
    }
  },
  next: {
    label: 'Next',
    click: function() {
      tray.setContextMenu(menuPlaying);
      nextSong();
    }
  },
  pause: {
    label: 'Pause',
    click: function() {
      tray.setContextMenu(menuPaused);
      player.pause();
    }
  },
  resume: {
    label: 'Resume',
    click: function() {
      tray.setContextMenu(menuPlaying);
      player.pause();
    }
  },
  quit: {
    label: 'Quit',
    click: function() {
      player.stop();
      app.quit();
    }
  }
}

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

player.on('downloading', function(src) {
  console.log('Downloading...');
})

player.on('error', function(err){
  console.log(err);
});
