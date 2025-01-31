# Eink Project

<p align="middle">
    <img src="docImages/display.jpg" alt="Eink" width="45%" />
    <img src="docImages/inside.jpg" alt="Eink" width="45%" />
</p>

### Description

The code is currently in only a kind of functional state. All of the code to do the drawing and sensor reading exists, although originally messily mashed together to quickly get working before winter assembly 2024. In its current state we are trying to clean up the mashed
together code to have a more gracefully managed start/stop procedure
and proper timing for updating minutes. In this sources current state,
the application only starts up and initializes everything.

The goal is to have appimage binaries released via ci that can just
directly be run on the device. This almost works but some web ui src
path resolving is broken. Also cross compilation in ci is having some
problems.

### Installation

Install system dependencies

```
libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Running the project

```
yarn dev
```

### Configuration

#### List of environment variables

| Environment variable | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `DEV = true`         | The program uses fake sensor data and uses old cached weather data. |
| `WEBIMAGES = true`   | The program shows all of the views on the website                   |
| `DISPLAY_VOLTAGE`    | Eink panel voltage. For dev just put -1.                            |
