let externalQuotesValue = 'double';
const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
let quotes = getQuotes();
function encodeSVG(data) {
  // Use single quotes instead of double to avoid encoding.
  if (externalQuotesValue === `double`) {
    data = data.replace(/"/g, `'`);
  } else {
    data = data.replace(/'/g, `"`);
  }

  data = data.replace(/>\s{1,}</g, `><`);
  data = data.replace(/\s{2,}/g, ` `);

  // Using encodeURIComponent() as replacement function
  // allows to keep result code readable
  return data.replace(symbols, encodeURIComponent);
}

function getQuotes () {
  const double = `"`;
  const single = `'`;

  return {
    level1: externalQuotesValue === `double` ? double : single,
    level2: externalQuotesValue === `double` ? single : double
  };
}

function addNameSpace (data) {
  if (data.indexOf(`http://www.w3.org/2000/svg`) < 0) {
    data = data.replace(/<svg/g, `<svg xmlns=${quotes.level2}http://www.w3.org/2000/svg${quotes.level2}`);
  }

  return data;
}

export default (svgString) => {
  return `data:image\/svg\+xml,${encodeSVG(addNameSpace(svgString))}`;
}