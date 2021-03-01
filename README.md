<h2>Data Visualization Vue.js/D3.js app</h2>

<h4>Using the app:</h4>

The data charts contains all the data in a hierarchical structure (parent - children - grandchildren - …) from the connected source.
The following functionalities are available:
1. Click & Drag the mouse to move the data chart.
2. Click on one of the cards in order to view its details in a popup.
3. Click on the ‘+’ sign to expand a cards’ children.
4. Click on the ‘-’ sign to collapse that cards’ children.

<h4>Note:</h4> The number on the bottom left corner of each card indicate the number of children that exist under that card. If that number is ‘0’, then this card has no children entities and therefore none will be displayed.

<h4>How to:</h4>

This project is an example data tree visualization using the following tools (including their respective installation and run commands):
1. Vue.js - main app (npm install vue + npm install -g @vue/cli).
2. Css/Sass - styling with pre-processor (npm install -g sass).
3. D3.js (org chart) - visualization framework to display the requested data (npm install d3-org-chart).
4. Eslint AirBnB - linter for code analysis (npm install -g eslint-config-airbnb | npm run lint).
5. Jest - unit testing (npm install -g jest | npm run test:unit).

Key files of the app, used for development are the following:
1. ./src/App.vue - This is the main app project file.
2. ./src/components/mainPage.vue - This is the main content .vue file of the app.
3. ./public/index.html - This is the main markup structure of our app.
4. ./public/style/style.scss - This is the main styling file for our app in the pre-processor file format.
5. ./public/style/Chart.scss - This is the styling file of the data chart displayed.
6. ./public/js/Chart.js - This file contains the functionality of the data chart. For larger projects, it can be considered to break down this file into smaller files, for better maintenance.
7. ./public/js/nerf-herders-test-data.json - This file contains the retrieved data, reformatted for the children elements to be adopted in the data chart structure.
8. ./tests/unit/app.spec.js - This file conatins unit testing of our app, using Jest.

<h4>Note:</h4> Before running locally, run the command 'npm i' in the source directory, to install all dependencies.

<h4>Useful links:</h4>

* Vue.js - https://vuejs.org/
* Sass - https://sass-lang.com/
* D3.js - https://d3js.org/
* Eslint AirBnB - https://www.npmjs.com/package/eslint-config-airbnb
* Jest - https://jestjs.io/, https://jestjs.io/docs/en/getting-started.html
