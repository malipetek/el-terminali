import { saveAs } from 'file-saver';
export default function downloadObjectAsJson(exportObj, exportName) {

var fileToSave = new Blob([JSON.stringify(exportObj, undefined, 2)], {
    type: 'application/json'
});

saveAs(fileToSave, `${exportName}.json`);
}