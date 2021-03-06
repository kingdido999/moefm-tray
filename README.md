# MoefmTray

This is a little [moe.fm](http://moe.fm/) radio app running on your system notification tray. It's cross-platform (OSX, Linux, Windows), I have built OSX and Linux versions successfully. I'd appreciate if someone would like to build it on Windows.

OSX:

![notify-osx](https://github.com/kingdido999/moefm-tray/raw/master/asset/screenshots/1-24-2016/notify-osx.png)

![menu-osx](https://github.com/kingdido999/moefm-tray/raw/master/asset/screenshots/1-24-2016/menu-osx.png)

Linux (Ubuntu):

![notify-linux](https://github.com/kingdido999/moefm-tray/raw/master/asset/screenshots/1-24-2016/notify-linux.png)

## Development

Make sure you have installed the latest version of node and npm. To upgrade node and npm,

For OSX/Linux:

```
sudo npm cache clean -f
sudo npm install -g npm
sudo npm install -g n
sudo n stable
```

For windows, you can download the latest version [here](https://nodejs.org/en/download/).

Clone and cd into this repo, install packages and start the app:

```bash
git clone https://github.com/kingdido999/moefm-tray.git
cd moefm-tray
npm install
npm start
```

## Build

```bash
npm run build-linux # Build on Linux
npm run build-osx # Build on OSX
```

## Shortcuts

- Next: ctrl+right
- Pause/Resume: ctrl+down
