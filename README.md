# Eink Project

This project is in its very initial stage of development and the codebase may not be fully functional or well-organized at this point.

### Installation

Install dependencies

```
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Running the project

```
npx webpack-cli --config webpack.dev.js && npx ts-node src/ui/index.ts
```

### Configuration

#### List of environment variables

| Environment variable | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `DEV = true`         | The program uses fake sensor data and uses old cached weather data. |
| `WEBIMAGES = true`   | The program shows all of the views on the website                   |
