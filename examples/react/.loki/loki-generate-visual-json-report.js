const {promisify} = require('util');
const {readdir, writeFile, readFile} = require('fs');
const {join: joinPath, relative} = require('path');

const readDirAsync = promisify(readdir);
const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

const lokiDir = joinPath(__dirname, '..', '.loki');
const actualDir = joinPath(lokiDir, 'current');
const expectedDir = joinPath(lokiDir, 'reference');
const diffDir = joinPath(lokiDir, 'difference');
const refReportFile = joinPath(lokiDir, 'reference-report.json');

(async function main() {
  let refReport;
  try {
    const refReportData = await readFileAsync(refReportFile);
    if (refReportData) {
      refReport = JSON.parse(refReportData);
    }
  } catch (e) {}
  const refReportExpectedItems = refReport && refReport.expectedItems ? refReport.expectedItems : [];
  const actualItems = await readDirAsync(actualDir);
  const expectedItems = await readDirAsync(expectedDir);
  const diffItems = await readDirAsync(diffDir);
  const passedItems = expectedItems.filter(item => !diffItems.includes(item));
  const failedItems = expectedItems.filter(item => diffItems.includes(item));
  const newItems = refReportExpectedItems.length ? expectedItems.filter(item => !refReportExpectedItems.includes(item)) : [];
  const deletedItems = newItems.length ? expectedItems.filter(item => ![...actualItems, ...newItems].includes(item)) : [];

	await writeFileAsync(joinPath(lokiDir, 'report.json'), JSON.stringify({
		newItems,
		deletedItems,
		passedItems,
		failedItems,
		expectedItems,
		actualItems,
		diffItems,
		actualDir: relative(lokiDir, actualDir),
		expectedDir: relative(lokiDir, expectedDir),
		diffDir: relative(lokiDir, diffDir)
	}));
})();