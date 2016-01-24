"use strict";

const electron = require('electron');
const Moefou = require('moefou');
const Player = require('player');
const notifier = require('node-notifier');
const path = require('path');
const request = require('request');
const fs = require('fs');

const app = electron.app;
const Tray = electron.Tray;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const globalShortcut = electron.globalShortcut;
const shell = electron.shell;
const nativeImage = electron.nativeImage;

const TRAY_ICON = path.join(__dirname, 'asset/icon.png');

const moefou = new Moefou('a8d18630d266f5ad6979c22e18d31ff4056a24105');
const player = new Player().enable('stream');

/**
 * A state when the player is switching to next song before that song
 * plays out, it prevents multiple songs playing at the same time
 * caused by clicking 'Next' too frequently.
 */
var isSwitchingSong = false;

var tray = null; // App icon on the system tray
var menu = null;

/**
 * ----------------------------------------------------------------------------
 * Electron App Module
 * ----------------------------------------------------------------------------
 * The app module is responsible for controlling the application's lifecycle.
 *
 */

app.on('ready', function(){
  // Initialize tray icon
  tray = new Tray(TRAY_ICON);

  fetchSongs(function() {
    // Start playing
    player.play();

    // Create global shortcuts
    globalShortcut.register('ctrl+right', function() {
      tray.setContextMenu(menu);
      nextSong();
    });

    globalShortcut.register('ctrl+down', function() {
      player.pause();
    });

    globalShortcut.register('ctrl+left', function() {
      player.stop();
      app.quit();
    });
  });
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

var menuTemplate = [
  // <== A menu item with song info will be inserted here
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
  let filename = 'tmp.jpg';

  // Download song cover
  download(song.cover.small, filename, function() {
    // show notification panel
    notifier.notify({
      title: 'Now playing: ',
      message: info,
      icon: path.join(__dirname, filename)
    }, function(error, response) {
      fs.unlinkSync(filename);
    });
  });

  let menuItem = {
    label: info,
    click: function() {
      shell.openExternal(song.sub_url);
    }
  };

  // Update current song info, remove previous song if necessary
  if (menuTemplate.length > 4) {
    menuTemplate.shift();
  }
  menuTemplate.unshift(menuItem);
  menu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(menu);
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
          'cover': song.cover
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

/**
 * Download a file from url.
 * @param  {String}   uri
 * @param  {String}   filename
 * @param  {Function} callback
 */
function download(uri, filename, callback) {
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}
