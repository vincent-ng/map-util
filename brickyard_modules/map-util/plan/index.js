module.exports = {
	includes: ['webpack'],
	modules: [
		'framework-frontend/webpack/index-template',
		'map-util'
	],
	config: {
		'buildtask-webpack-babel': {
			compileJS: true,
		},
	}
}