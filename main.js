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
const globalShortcut = electron.globalShortcut;
const shell = electron.shell;
const nativeImage = electron.nativeImage;
const PLAY_AT_STARTUP = true;

const moefou = new Moefou('a8d18630d266f5ad6979c22e18d31ff4056a24105');
const player = new Player().enable('stream');

/**
 * A state when the player is switching to next song before that song
 * plays out, it prevents multiple songs playing at the same time
 * caused by clicking 'Next' too frequently.
 */
var isSwitchingSong = false;

var tray = null; // App icon on the system tray
var menuInit = null; // The initial menu
var menuPlaying = null; // The menu when playing

/**
 * ----------------------------------------------------------------------------
 * Electron App Module
 * ----------------------------------------------------------------------------
 * The app module is responsible for controlling the application's lifecycle.
 *
 */

app.on('ready', function(){
  // initialize tray icon and menu items
  tray = new Tray(path.join(__dirname, 'asset/icon.png'));

  if (PLAY_AT_STARTUP) {
    fetchSongs(function() {
      player.play();
      registerShortcuts();
    });
  } else {
    menuInit = Menu.buildFromTemplate(menuInitTemplate);
    tray.setContextMenu(menuInit);
  }
});

app.on('will-quit', function() {
  globalShortcut.unregisterAll();
});

/**
 * ----------------------------------------------------------------------------
 * Electron Menu & MenuItems Modules
 * ----------------------------------------------------------------------------
 * The menu class is used to create native menus that can be used as
 * application menus and context menus. Each menu consists of
 * multiple menu items and each menu item can have a submenu.
 *
 */

// Menu items with event listeners
var menuItems = {
  play: {
    label: 'Play',
    click: function() {
      fetchSongs(function() {
        player.play();
        registerShortcuts();
      });
    }
  },
  next: {
    label: 'Next',
    click: function() {
      nextSong();
    }
  },
  toggle: {
    label: 'Pause / Resume',
    click: function() {
      player.pause();
    }
  },
  quit: {
    label: 'Quit',
    click: function() {
      player.stop();
      app.quit();
    }
  },
  separator: {
    type: 'separator'
  }
}

var menuInitTemplate = [
  menuItems.play,
  menuItems.quit
];

var menuPlayingTemplate = [
  menuItems.separator,
  menuItems.next,
  menuItems.toggle,
  menuItems.quit
];

/**
 * ----------------------------------------------------------------------------
 * Player Event Listeners
 * ----------------------------------------------------------------------------
 * A command line player, supports play mp3 both from url and local stream.
 * https://github.com/guo-yu/player
 *
 */

player.on('playing',function(song){
  console.log('Now playing: ' + song.title);
  isSwitchingSong = false;
  let info = song.title + ' ' + (song.artist ? '♫ ' + song.artist : '');

  // show notification panel
  notifier.notify({
    title: 'Now playing: ',
    message: info,
    icon: path.join(__dirname, 'asset/notify.jpg')
  });

  // show current song info in the menu, remove the previous song if necessary
  if (menuPlayingTemplate.length > 4) {
    menuPlayingTemplate.shift();
  }
  menuPlayingTemplate.unshift({
    label: info,
    click: function() {
      shell.openExternal(song.sub_url);
    }
  });
  menuPlaying = Menu.buildFromTemplate(menuPlayingTemplate);
  tray.setContextMenu(menuPlaying);
});

player.on('finish', function(current) {
  nextSong();
})

player.on('error', function(err){
  console.log(err);
});

/**
 * ----------------------------------------------------------------------------
 * Functions
 * ----------------------------------------------------------------------------
 *
 */

/**
 * Register global shortcut listeners.
 */
function registerShortcuts() {
  var next = globalShortcut.register('ctrl+right', function() {
    tray.setContextMenu(menuPlaying);
    nextSong();
  });

  if (!next) {
    console.log('ctrl+right (next) registration failed');
  }

  var pause = globalShortcut.register('ctrl+down', function() {
    player.pause();
  });

  if (!pause) {
    console.log('ctrl+down (pause) registration failed');
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
        let song = playlist[i];

        player.add({
          'src': song.url,
          'title': song.sub_title,
          'artist': song.artist,
          'sub_url': song.sub_url,
          'cover': {
            'small': song.cover.small
          }
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
    // If we are in the process of switching to next song, do nothing
    return;
  } else {
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
