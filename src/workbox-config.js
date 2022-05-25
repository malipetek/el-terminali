module.exports = {
	globDirectory: 'public/',
	maximumFileSizeToCacheInBytes: 5000000,
	globPatterns: [
		'**/*.{css,js,png,ttf,woff,woff2,html}'
	],
	skipWaiting: true,
	mode: 'development',
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	
};