# MoefmTray 小萌否

This is a little [moe.fm](http://moe.fm/) radio app running on your system notification tray. It's cross-platform (OSX, Linux, Windows), I have built OSX and Linux versions successfully. I'd appreciate if someone would like to build it on Windows.

![notify](https://github.com/kingdido999/moefm-tray/raw/master/asset/screenshots/notify.png)

![menu](https://github.com/kingdido999/moefm-tray/raw/master/asset/screenshots/menu.png)

## Download

Realease: [OSX](https://github.com/kingdido999/moefm-tray/releases/download/v0.1.0/MoefmTray-darwin-x64.zip) | [Linux](https://github.com/kingdido999/moefm-tray/releases/download/v0.1.0/MoefmTray-linux-x64.zip)

百度云：[OSX](http://pan.baidu.com/s/1c1fPEs4) | [Linux](http://pan.baidu.com/s/1ZipOy)

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
