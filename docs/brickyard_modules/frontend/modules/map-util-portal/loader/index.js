require('./main.css')
const html = require('html-loader!./index.html')

function showSpinner() {
	document.getElementById('spinner').removeAttribute('hidden')
}

function hideSpinner() {
	document.getElementById('spinner').setAttribute('hidden', '')
}

function showProgressBar() {
	document.getElementById('progress').removeAttribute('hidden')
}

function hideProgressBar() {
	document.getElementById('progress').setAttribute('hidden', '')
}

function setProgress(v) {
	const e = document.getElementById('progress-bar')
	e.setAttribute('style', `width: ${v}%;`)
	e.innerHTML = `${v}%`
}

function init(elementId) {
	const e = document.getElementById(elementId)
	e.innerHTML = html
}

module.exports = {
	showSpinner,
	hideSpinner,
	showProgressBar,
	hideProgressBar,
	setProgress,
	init,
}
