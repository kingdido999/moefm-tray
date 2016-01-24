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

var tray = null; // Electron Tray module
var menu = null; // Electron Menu module
var controller = null; // Music controller


class Controller {
  constructor() {
    this.isSwitchingSong = false; // Prevent user from spamming 'Next' button
  }

  fetch(callback) {
    console.log('Fetching songs...');
    moefou.listenPlaylist({}, function(error, body) {
      if (error) {
        console.log(error);
      } else {
        let playlist = body.response.playlist;

        // Add songs
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

  play() {
    player.play();
  }

  pause() {
    player.pause();
  }

  next() {
    // If we are in the process of switching to next song, do nothing.
    if (this.isSwitchingSong) return;
    this.isSwitchingSong = true;

    // If not enough songs, we need to fetch before playing the next song.
    if (player.playing._id + 1 >= player.list.length) {
      this.fetch(function() {
        player.next();
      });
    } else {
      player.next();
    }
  }

  stop() {
    player.stop();
  }
}

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
  controller = new Controller();

  controller.fetch(function() {
    // Start playing
    controller.play();

    // Create global shortcuts
    globalShortcut.register('ctrl+right', function() {
      tray.setContextMenu(menu);
      controller.next();
    });

    globalShortcut.register('ctrl+down', function() {
      controller.pause();
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
 * Electron Menu & MenuItem Modules
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
      controller.next();
    }
  },
  pause: {
    label: 'Pause / Resume',
    click: function() {
      controller.pause();
    }
  },
  quit: {
    label: 'Quit',
    click: function() {
      controller.stop();
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
  menuItems.pause,
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
  controller.isSwitchingSong = false;
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
  controller.next();
})

player.on('error', function(error){
  console.log(error);
});

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
