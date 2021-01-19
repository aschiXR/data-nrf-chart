const dataArr = require('../../public/js/nerf-herders-test-data.json');

test('Data Array is not empty', () => {
  expect(dataArr.name.length).toEqual(1)
});

test('Data Array head entry contains all children', () => {
  expect(dataArr.children.length).toEqual(4)
});