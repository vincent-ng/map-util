const fileSaver = require('file-saver')
const XLSX = require('xlsx')
const spinner = require('../loader')
const FileDragReader = require('@brickyard/webpack-file-drag-reader')

const handler = {}
handler.onRead = () => {
	throw new Error('onRead handler not set')
}

function init(elementId) {
	const reader = new FileDragReader(elementId, { readAs: 'BinaryString' })
	reader.onRead('start', () => spinner.showSpinner())
	reader.onRead('end', () => spinner.hideSpinner())
	reader.onRead('file', ({ data }) => {
		const workbook = XLSX.read(data, {
			type: 'binary',
			cellText: false,
			cellDates: true,
		})
		const result = {}
		workbook.SheetNames.forEach((sheetName) => {
			const roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], { dateNF: 'YYYY-MM-DD HH:mm:ss' })
			if (roa.length > 0) {
				result[sheetName] = roa
			}
		})
		handler.onRead(result)
	})
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
