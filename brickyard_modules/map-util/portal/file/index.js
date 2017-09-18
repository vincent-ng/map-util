require('./main.css')
const fileSaver = require('file-saver')
const XLSX = require('xlsx')
const html = require('html-loader!./index.html')
const spinner = require('../loader')

const handler = {}
handler.onRead = () => {
	throw new Error('onRead handler not set')
}

function to_json(workbook) {
	const result = {}
	workbook.SheetNames.forEach((sheetName) => {
		const roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName])
		if (roa.length > 0) {
			result[sheetName] = roa
		}
	})
	return result
}

function process_workbook(workbook) {
	return to_json(workbook)
}

function processFile(files, cb) {
	if (!files.length) { return }
	const file = files[0]
	const reader = new FileReader()
	spinner.showSpinner()
	reader.onload = function (event) {
		const data = event.target.result
		const wb = XLSX.read(data, {
			type: 'binary',
		})
		spinner.hideSpinner()
		cb(process_workbook(wb))
	}
	reader.readAsBinaryString(file)
}

function handleDragOver(event) {
	event.stopPropagation()
	event.preventDefault()
	event.dataTransfer.dropEffect = 'copy'
	event.target.className = (event.type === 'dragover' ? 'hover' : '')
}

function handleDrop(event) {
	event.stopPropagation()
	event.preventDefault()
	processFile(event.dataTransfer.files, handler.onRead)
	event.target.className = ''
}

function handleFile(event) {
	processFile(event.target.files, handler.onRead)
}

function init(elementId) {
	const e = document.getElementById(elementId)
	e.innerHTML = html
	const drop = document.getElementById('filedrag')
	const fileInput = document.getElementById('fileselect')

	drop.addEventListener('dragover', handleDragOver, false)
	drop.addEventListener('dragleave', handleDragOver, false)
	drop.addEventListener('drop', handleDrop, false)
	fileInput.addEventListener('change', handleFile, false)
}

function s2ab(s) {
	let buf
	let view
	if (typeof ArrayBuffer !== 'undefined') {
		buf = new ArrayBuffer(s.length)
		view = new Uint8Array(buf)
	} else {
		buf = new Array(s.length)
		view = buf
	}
	for (let i = 0; i !== s.length; i += 1) {
		view[i] = s.charCodeAt(i) & 0xFF
	}
	return buf
}

function exportFile(objectList, fileName, type = 'xlsx') {
	const wb = XLSX.utils.book_new()
	const ws = XLSX.utils.json_to_sheet(objectList)
	XLSX.utils.book_append_sheet(wb, ws, 'sheet')
	const wbout = XLSX.write(wb, { bookType: type, bookSST: true, type: 'binary' })
	fileSaver.saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), `${fileName}.${type}`)
}

handler.init = init
handler.exportFile = exportFile
module.exports = handler
