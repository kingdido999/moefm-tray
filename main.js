"use strict";

const electron = require('electron');
const Moefou = require('moefou');
const Player = require('player');
const notifier = require('node-notifier');

const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;

const moefou = new Moefou('a8d18630d266f5ad6979c22e18d31ff4056a24105');
const player = new Player([]);

var appIcon = null;

// template for menu items
var template = [
  {
    label: 'Play',
    click: function(item) {
      // get playlist
      moefou.listenPlaylist({}, function(error, body) {
        if (error) {
          console.log(error);
        } else {
          var playlist = body.response.playlist;

          // add songs
          for (var i = 0; i < playlist.length; i++) {
            console.log('Adding: ' + playlist[i].title);
            var song = playlist[i];

            player.add({
              'src': song.url,
              'title': song.title,
              'artist': song.artist,
              'cover': {
                'small': song.cover.small
              }
            })
          }

          player.play();
        }
      });
    }
  },
  {
    label: 'Pause',
    click: function() {
      player.pause();
    }
  },
  {
    label: 'Next',
    click: function() {
      player.next();
    }
  },
  {
    label: 'Quit',
    click: function() {
      player.stop();
      app.quit();
    }
  }
];


app.on('ready', function(){
  appIcon = new Tray('icon.png');
  var contextMenu = Menu.buildFromTemplate(template);
  appIcon.setToolTip('萌否电台');
  appIcon.setContextMenu(contextMenu);
});

// event: on playing
player.on('playing',function(song){
  // console.log('Playing: ' + JSON.stringify(song, null, 4));

  notifier.notify({
    'title': 'Now playing: ',
    'message': song.title + ' / ' + song.artist
  });
});

// event: on playend
player.on('playend',function(item){
  // return a playend item
  console.log('src:' + item + ' play done, switching to next one ...');
});

// event: on error
player.on('error', function(err){
  // when error occurs
  console.log(err);
});
