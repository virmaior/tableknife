
type tkCellElement = HTMLElement & { colNum: number, checked: boolean };
type tkRowElement = HTMLElement & { rowNum: number };

type tkGridState = 'broken' | 'current';
type tkTableElement = HTMLTableElement & { gridSet: tkGridState, _rload: EventListener };
type tkShowState = 'show' | 'hide';

type hoverFunction = (ptd: tkCellElement, h_id: number) => string;
type sortFunction = (a: tkRowElement, b: tkRowElement, val: Function) => number;

class tableKnife {
	url = "";
	output = '';
	colNames: Record<number, string> = {};
	columns: string[] = [];
	context = "tableknife"
	maxRunCount = 50;
	debug = false;
	rtObj: tkTableElement;
	tbody: tkTableElement | HTMLTableSectionElement;
	csp: HTMLDivElement | null;
	dsr: HTMLDivElement;
	analysisRows: NodeListOf<HTMLTableRowElement>;

	log(x: string) {
		if (this.debug) {
			console.log(`${this.context} - ${x}`);
		}
	}
	sb() {
		this.log('binding');
	}
	eb() {
		this.log('bound');
	}

	binderFunction(targ: HTMLElement, sel: string, etype: string, f: EventListener, clearBind = true, onlyOnce = false) {
		const bName = `=_bind_${etype}`;
		type BindableElement = HTMLElement & { [key: string]: any };

		const params: AddEventListenerOptions = {};
		if (onlyOnce) {
			params.once = true;
		}

		targ.querySelectorAll<BindableElement>(sel).forEach(el => {
			if (clearBind) {
				if (Object.hasOwn(el, bName) && typeof el[bName] === 'function') {
					el.removeEventListener(etype, el[bName]);
				}
			}
			el[bName] = f;
			el.addEventListener(etype, el[bName], params);
		});
	}

	bindClickTarget(targ: HTMLElement, sel: string, f: EventListener, clearBind: boolean = true, onlyOnce: boolean = false) {
		this.binderFunction(targ, sel, "click", f, clearBind, onlyOnce);
	}

	constructor(public rtId: number,
		public manager: tkManager) {
		this.log(`initialized`);

		this.dsr = document.querySelector(`.dsr_outer[rt_id="${this.rtId}"]`) as HTMLDivElement;
		if (!this.dsr) { console.error(`Failed to find DSR ${this.rtId}!`); }
		this.rtObj = document.querySelector<tkTableElement>(`.tableknife_TABLE[report_id="${this.rtId}"]`) as tkTableElement;
		if (!this.rtObj) { console.error(`Failed to load table ${this.rtId}!`); }

		this.tbody = this.rtObj.querySelector('tbody') || this.rtObj; //limit to just using the TBODY section (not THEAD or TFOOTER)
		this.analysisRows = this.tbody.querySelectorAll<HTMLTableRowElement>(':scope > tr.analysis_TR');

		this.csp = document.querySelector<HTMLDivElement>(`.csp_DIV[report_id="${this.rtId}"]`);

		this.bind();
	}

	cookieHide() {
		const myCookie = this.manager.readCookie(`rt_${this.rtId}`);
		if (!myCookie) { return false; }

		this.columns = myCookie.split(',');
		for (let col_id in this.columns) {
			let parts = col_id.split("=");
			if (Number(parts[1]) == 1) {
				this.rtObj.querySelectorAll<tkCellElement>(`tr > td:nth-child(${parts[0]})`)
					.forEach(td => td.checked = false);
				this.setColumn(Number(parts[0]), 'hide');
			}
		}
	}

	firstHide() {

		if (!this.csp) { this.log(`no hide columns in ${this.rtId}`); return false; }

		this.cookieHide();
		const topDIV = this.csp.querySelector<HTMLDivElement>('.csp_top_DIV');
		if (!topDIV) { return; }
		const ctypes = (topDIV.getAttribute('ctypes') ?? '').split(',');
		const hiddenCtypes = (topDIV.getAttribute('hidden_ctypes') ?? '').split(',');
		let topDivs = [];
		ctypes.forEach(ctype => {
			if (ctype == 'tableknife\\rfield_db') { return false; }

			let my_state = 'show';
			if (hiddenCtypes.indexOf(ctype) != -1) { my_state = 'hide'; }
			topDivs.push(`<div class="csp_show_ctype" ctype="${ctype}" state="${my_state}"> ${ctype}</div>`);
			this.csp?.querySelectorAll(`.csp_column_DIV[ctype=${ctype}]`).forEach(el => { el.setAttribute('state', my_state); });

		});
		topDivs.push('<div class="csp_show_all">Show All</div>');
		topDIV.innerHTML = topDivs.join('');

		//expand the ctypes onto each TD and to the analysis rows if existent
		this.rtObj.querySelectorAll<HTMLDivElement>('.header_TR TD > div, .header_TR TH > div').forEach((div) => {
			const ctype = div.getAttribute('ctype');
			if (ctype) {
				const parentTd = div.parentElement as HTMLElement;
				parentTd.setAttribute('ctype', ctype);
				const gpEl = parentTd.parentElement;
				if (!gpEl) { return; }
				const tdIndex = Array.from(gpEl.children).indexOf(parentTd);
				this.rtObj.querySelectorAll('.analysis_TR').forEach((analysisTr) => {
					const td = analysisTr.querySelectorAll(':scope > td')[tdIndex];
					if (td) {
						td.setAttribute('ctype', ctype);
					}
				});
			}
		});
		//hide the hidden ctypes in the table
		hiddenCtypes.forEach((item) => {
			this.ctypeState(item, 'hide');
		});
	}

	ctypeState(item: string, state: string) {
		this.rtObj.gridSet = 'broken';
		this.rtObj.querySelectorAll(`TD[ctype="${item}"], TH[ctype="${item}"]`).forEach(td => { td.setAttribute('state', state); });
	}

	colState(colId: number, state: string) {
		this.rtObj.gridSet = 'broken';
		this.rtObj.querySelectorAll(`td:nth-child(${colId}) , th:nth-child(${colId})`).forEach(td => { td.setAttribute('state', state); });
	}

	setColumn(colId: number, myState: tkShowState = 'show') {
		let myVal = 0;
		if (myState == 'hide') {
			myVal = 1;
		}
		this.columns[colId] = `${colId}=${myVal}`;
		this.colState(colId, myState);
		this.manager.createCookie(`rt_${this.rtId}`, this.columns.join());
	}
	showOnlyRow(rowId: number) {
		this.log(`showing only row ${rowId}`);
		this.rtObj.querySelectorAll<HTMLTableRowElement>(`tr[id^="row_${this.rtId}"]`).forEach(tr => {
			if (tr.id === `row_${this.rtId}_${rowId}`) {
				tr.classList.remove('hide_ROW');
			} else {
				tr.classList.add('hide_ROW');
			}
		});
	}
	showAllRows() {
		this.log('showing all rows');
		this.rtObj.querySelectorAll<HTMLTableRowElement>(`tr[id^="row_${this.rtId}"]`).forEach(tr => {
			tr.classList.remove('hide_ROW');
		});
	}
	showAll() {
		this.log('showing all columns');
		this.csp?.querySelectorAll<HTMLDivElement>('.csp_column_DIV').forEach(cspCol => { cspCol.setAttribute('state', 'show'); });
		this.rtObj.querySelectorAll<HTMLTableCellElement>('TD, TH').forEach(td => { td.setAttribute('state', 'show'); });
	}

	hideMany = (many: number[]) => {
		many.forEach( col => {
			this.setColumn(Number(col), 'hide');

		});
	}

	Reload = (e: Event) => {
		window.location.href = window.location.href;
	}

	cspBind = () => {
		if (!this.csp) { return; }
		this.bindClickTarget(this.csp, '.csp_show_all', (e: Event) => {
			e.preventDefault();
			this.showAll();
		});
		this.bindClickTarget(this.csp, '.csp_column_DIV', (e: Event) => {
			const t = e.currentTarget as HTMLElement;
			let newState: tkShowState = 'show';
			if (t.getAttribute('state') == 'show') {
				newState = 'hide';
			}
			t.setAttribute('state', newState);
			this.setColumn(Number(t.getAttribute('column')), newState);
		});
		this.bindClickTarget(this.csp, '.csp_show_ctype', (e: Event) => {
			e.preventDefault();
			const t = e.currentTarget as HTMLElement;
			const ctype = t.getAttribute('ctype') ?? '';
			let myState: tkShowState = 'show';
			if (t.getAttribute('state') === 'show') {
				myState = 'hide';
			}
			t.setAttribute('state', myState);
			this.ctypeState(ctype, myState);
		});
	}

	sortTable = (e: Event) => {
		const t = e.currentTarget as HTMLElement;
		e.preventDefault();
		const col = t.getAttribute('col');
		const sortType = t.getAttribute('sort') || 'alpha';

		const current = t.getAttribute('activeSort');
		const dir = current === 'asc' ? 'desc' : 'asc';
		const dirInt = dir === 'asc' ? 1 : -1;
		this.rtObj.querySelectorAll('.sortCol[activeSort]').forEach(el => el.removeAttribute('activeSort'));
		t.setAttribute('activeSort', dir);
		const rows = Array.from(this.tbody.querySelectorAll<tkRowElement>(':scope > tr'));

		const decipherCell = (tr: tkRowElement) => {
			const cell = tr.querySelector<tkCellElement>(`:scope > td[col="${col}"], :scope > th[col="${col}"]`);
			return cell ? cell.textContent.trim() : '';
		};

		const cmp = this.manager.loadSorter(sortType);
		rows.sort((a, b) => cmp(a, b, decipherCell) * dirInt);
		rows.forEach(tr => this.tbody.appendChild(tr));

		this.analysisRows.forEach(tr => this.tbody.appendChild(tr));
		this.rtObj.gridSet = 'broken';
	}
	interfaceFilter = (e: Event) => {
		const t = e.currentTarget as HTMLSelectElement;
		const showRow = Number(t.value);
		if (showRow > 0) {
			this.showOnlyRow(showRow);
		}
		else { this.showAllRows(); }
	}

	hoverPower = (e: Event) => {
		e.preventDefault();
		const t = e.currentTarget as tkCellElement;
		if (t.querySelector('.hoveri_DIV')) { return false; }
		this.manager.compose_hoveri(t);
	}
	exportButton = (e: Event) => {
		e.preventDefault();
		const pasteType = (e.currentTarget as HTMLElement).getAttribute('pastetype');
		this.log(`click fired on ${pasteType}`);
		this.processTable();
		switch (pasteType) {
			case 'XLS': this.pasteXLS(); break;
			case 'G': this.pasteG(); break;
			case 'TSV': this.saveTSV(); break;
		}
		this.dsr.setAttribute('state', 'done');

	};

	changeSelect = (e: Event) => {
		const t = e.currentTarget as HTMLSelectElement;
		e.preventDefault();

		const hash = t.getAttribute('hash');
		const selectedOption = t.options[t.selectedIndex];
		if (!selectedOption) return;

		const selectedText = selectedOption.textContent;

		// Set both cookies with consistent attributes
		// Adjust path/domain/SameSite/expires as needed for your app
		const cookieOptions = '; path=/; SameSite=Lax; max-age=31536000';  // 1 year; tweak as needed

		document.cookie = `obsjump=${hash}${cookieOptions}`;
		document.cookie = `${hash}=${selectedText}${cookieOptions}`;

		this.rtObj.dispatchEvent(new CustomEvent('rload'));
	}

	buildCoordinates() {
		let row = 0;
		this.rtObj.querySelectorAll<tkRowElement>(':scope > tbody > tr , :scope > thead > tr').forEach(tr => {
			row++;
			tr.setAttribute('arow', String(row));
			let col = 0;

			tr.querySelectorAll<tkCellElement>(':scope > td ,:scope > th').forEach(td => {
				col++;
				td.setAttribute('row', String(row));
				td.setAttribute('col', String(col));
				td.setAttribute('cella', `${this.makeColumnLetter(col)}${row}`);
				if (row === 1) {
					if (td.hasAttribute('nopaste')) { return false; }
					const sortType = td.getAttribute('sort');
					if (sortType !== 'none') {
						td.classList.add('sortCol');
					}
				}
			});
		});
	}

	bind() {
		this.sb();
		this.buildCoordinates();
		this.bindClickTarget(this.rtObj, '.sortCol', this.sortTable);

		this.firstHide();
		if (this.csp) { this.cspBind(); }

		if (this.rtObj.querySelector('.rank_TD')) { this.rankColumn(); }
		this.binderFunction(document.body,`.tableknife_TABLE[rt_id="${this.rtId}"]`,'rload',this.Reload,true,false);
		this.binderFunction(this.rtObj, '.hoveri', 'mouseenter', this.hoverPower);
		if (!this.dsr) { this.log(`exiting out due to no dsr set${this.rtId}`); return false; }
		this.binderFunction(this.dsr, `.rt_view_SELECT`, 'change', this.interfaceFilter);
		this.bindClickTarget(this.dsr, '.dsr_button_BOX BUTTON', this.exportButton);
		this.binderFunction(this.dsr, '.obs_SELECT', 'change', this.changeSelect, true, true);
		this.eb();
	}

	makeColumnLetter(oval: number): string {
		if (this.colNames[oval]) { return this.colNames[oval]; }
		function upshiftAZ(match: string, offset: number) {
			let shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.toUpperCase().charCodeAt(0) + 9 + shift);
		}
		function upshift09(match: string, offset: number) {
			let shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.charCodeAt(0) + 16 + shift);
		}

		const outVal = oval.toString(27).replace(/[A-Za-z]/g, upshiftAZ).replace(/[0-9]/g, upshift09);
		this.colNames[oval] = outVal;
		return outVal;
	}

	processInnerTable(that: HTMLTableElement) {
		const pieces: string[] = []
		that.querySelectorAll<tkCellElement>('TABLE TD').forEach((p) => { pieces.push(p.textContent); });
		that.replaceWith(pieces.join(' '));
	}

	decodeFMLA(fmla: string, y: number) {
		let runCount = 0;
		let action = "";
		while (fmla.indexOf(String.fromCharCode(189)) > -1) {
			runCount++;
			const instructionStart = fmla.indexOf(String.fromCharCode(189));
			let instructionEnd = fmla.indexOf(String.fromCharCode(190));
			if (instructionEnd <= -1) {
				this.log("invalid magic formula length");
				return false;
			}
			instructionEnd = instructionEnd + 1; //correct to express inclusion
			const instruction = fmla.substring(instructionStart, instructionEnd);
			const parts = instruction.split("");

			this.log(`magic instuction: ${instruction} found. Length = ${instruction.length} (=  ${instructionEnd - instructionStart}) command = ${parts[0]} mode = ${parts[1]}${instruction.substr(3, instruction.length - 4)}`);
			{
				let yletter = '';
				action = parts[2];
				switch (action) {
					case 'A':
						//if (x == 21) { this.log('instruction:' + instruction + ' from ' + fmla); }
						const target = instruction.slice(3, -1);
						const targ_bits = target.split('_');
						const targTD = this.rtObj.querySelector<tkCellElement>(`TD[row="${targ_bits[1]}"][col="${targ_bits[2]}"]`);
						if (!targTD) { return; }
						const target_y = targTD.colNum + 1;
						yletter = this.makeColumnLetter(target_y);
						break;
					case '-':
					case '+': yletter = this.makeColumnLetter(y - Number(parts[3])); break;
					default: this.log(`unknown parse action ${action} in fmla`);

				}
				fmla = fmla.split(instruction).join(yletter);
			}
			if (runCount > this.maxRunCount) {
				this.log(`parse loop for fmla. dying due to inability to parse in ${runCount} attempts.`);
				return false;
			}
		}
		this.log(`resolved to ${fmla}`);
		return fmla;
	}

	decodeTdFMLA(me: tkCellElement) {
		const fmla = me.getAttribute('fmla') ?? '';
		this.makeGrid(this.rtObj);
		const y = me.colNum;
		this.log(`considering formula ${fmla} at col ${y}`);
		return this.decodeFMLA(fmla, y);
	}

	makeGrid(myTable: tkTableElement, vTest = true) {
		if ('gridSet' in myTable && myTable.gridSet == 'current') { return; }
		let x = 0;
		myTable.querySelectorAll<tkRowElement>('tr').forEach(tr => {
			if (vTest) { if (!tr.checkVisibility()) { return false; } }
			tr.rowNum = x;
			x = x + 1;
			let y = 0;
			tr.querySelectorAll<tkCellElement>('td').forEach(td => {
				if (vTest) { if (!td.checkVisibility()) { return false; } }
				td.colNum = y;
				y = y + 1;
			});
		});
		myTable.gridSet = 'current';
	}

	processTable() {
		this.log(`process action fired for rt_id = ${this.rtId}`);
		if (this.dsr.getAttribute('state') === 'processing') {
			alert('already in progress.');
			return false;
		}
		this.dsr.setAttribute('state', 'processing');

		const simplify = document.createElement('table') as tkTableElement;
		simplify.className = 'tableknife_TABLE';
		simplify.innerHTML = this.rtObj.innerHTML;

		simplify.querySelectorAll<HTMLTableElement>('table:not(.tableknife_TABLE)')
			.forEach(table => this.processInnerTable(table));
		this.log('stripped / simplified internal tables');

		simplify.querySelectorAll('[state=hide] , [nopaste]').forEach((me) => { me.remove() });
		this.log('removed no paste');

		simplify.querySelectorAll<HTMLElement>('.split_column').forEach(splitC => {
			const myTD = splitC.parentElement as HTMLElement;
			if (!myTD) { return; }
			const afters = [];
			let colCount = 1;
			let nextCol;
			while ((nextCol = splitC.getAttribute('col' + colCount)) !== null) {
				const newTD = document.createElement('td');
				newTD.innerHTML = nextCol;
				afters.push(newTD);
				colCount++;
			}
			myTD.after(...afters);


			if (Number(myTD.getAttribute('row') ?? '0') === 1) {
				simplify.querySelectorAll(`.analysis_TR > TD[col="${myTD.getAttribute('col')}"]`).forEach(el => {
					const fragment = document.createDocumentFragment();
					for (let i = 0; i < colCount - 2; i++) {
						fragment.appendChild(document.createElement('td'));
					}
					el.after(fragment);
				});
			}
			myTD.remove();
		});
		simplify.querySelectorAll<HTMLElement>('.alt_column').forEach(ac => {
			const alt = ac.getAttribute('alt');
			if (alt) ac.innerHTML = alt;
		});
		this.makeGrid(simplify, false);
		//add row coordinate information (needed for formulas)

		simplify.querySelectorAll<tkCellElement>('[fmla]').forEach((a) => {
			this.rtObj.setAttribute('wcell', a.getAttribute('cella') ?? '');
			a.innerHTML = String(this.decodeFMLA(a.getAttribute('fmla') ?? '', a.colNum + 1));
		});

		this.output = simplify.innerHTML;
		this.dsr.setAttribute('state', '');
	}
	pasteXLS() {
		this.log('pasted to clipboard in XLS mode');

		navigator.clipboard.writeText(`<x:Workbook  
			xmlns="urn:schemas-microsoft-com:office:spreadsheet"  xmlns:o="urn:schemas-microsoft-com:office:office"  
			xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"  xmlns:x="urn:schemas-microsoft-com:office:excel" >
			<Worksheet ss:Name="Test"><table >${this.output}</table></Worksheet></Workbook>`);
	}
	pasteG() {
		let output = this.output.replace('<thead', '<tx').replace('<th', '<ty').replace('<tr', '<tx').replace('<td', '<ty'). //remove first offset
			replaceAll('<th', '<td'). //switch all TH to TD
			replaceAll('<td', String.fromCharCode(9) + '<td'). //replace all <td with control character
			replaceAll('<tr', String.fromCharCode(13) + String.fromCharCode(10) + '<tr'). //replace all <TR with control character
			replaceAll('&nbsp;', ' '). //replace space entity with space
			replaceAll('&amp;', '&');
		output = output.replace(/<[^>]*>?/gm, '').replaceAll(String.fromCharCode(13) + String.fromCharCode(10) + String.fromCharCode(9), String.fromCharCode(13) + String.fromCharCode(10));
		this.log('pasted to clipboard in Sheets mode: ' + output);
		navigator.clipboard.writeText(output);
	}
	buildTSV() {
		let oTRs: string[] = [];
		const z = document.createElement('div');
		z.innerHTML = `<table>${this.output}</table>`;
		z.querySelectorAll('tr').forEach(tr => {
			let oTDs: string[] = [];
			tr.querySelectorAll('td , th').forEach(td => {
				let me = td.textContent;
				if (me.includes(',')) {
					me = `"${me}"`;
				}
				if (me === "") {
					me = " ";
				}
				oTDs.push(`${me}`);
			});
			oTRs.push(oTDs.join(','));
		});

		return oTRs.join(String.fromCharCode(13) + String.fromCharCode(10));
	}
	saveTSV() {
		const output = this.buildTSV();
		const blob = new Blob([
			new Uint8Array([0xEF, 0xBB, 0xBF]), // UTF-8 BOM
			output
		],
			{ type: "text/plain;charset=utf-8" });

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');  // Create a new anchor element
		a.href = url;
		a.download = 'table.tsv';
		a.click();
	}

	rankColumn() {
		const ranks = this.rtObj.querySelectorAll<tkCellElement>('.rank_TD');
		this.log(`rt_${this.rtId} has ${ranks.length} ranks`);

		ranks.forEach(element => {
			const col = element.getAttribute('col');
			const row = element.getAttribute('row');
			const targetTd = this.rtObj.querySelector(`td[col="${Number(col) - 1}"][row="${row}"]`);
			const grandTotal = targetTd ? targetTd.innerHTML : '';
			element.setAttribute('grand_total', grandTotal);
		});

		const sortedRanks = Array.from(ranks).sort((a, b) => {
			const grandTotalA = parseFloat(a.getAttribute('grand_total') || "0");
			const grandTotalB = parseFloat(b.getAttribute('grand_total') || "0");
			return grandTotalB - grandTotalA;
		});

		let rankCount = 1;
		let equals = 1;
		let currentValue = 0;

		sortedRanks.forEach(element => {
			element.innerHTML = String(rankCount);
			const grandTotal = parseFloat(element.getAttribute('grand_total') || '');
			if (grandTotal > currentValue) {
				rankCount += equals;
				equals = 1;
			} else {
				equals++;
			}
		});

		this.log(`rank_column ran on rt id ${this.rtId}`);
	}
}

class tkManager {
	version = 2.0;
	tts: tableKnife[] = [];
	reportId = 100;
	hId = 0;
	upId = () => {
		return this.reportId++;
	}
	newHId = (): number => {
		this.hId++;
		return this.hId;
	}

	sorters = {
		alpha: (a, b, val) => { return val(a).localeCompare(val(b), undefined, { sensitivity: 'base' }) },
		currency: (a, b, val) => { return parseFloat(val(a).replace(/[^0-9.-]/g, '')) - parseFloat(val(b).replace(/[^0-9.-]/g, '')); },
		numeric: (a, b, val) => { return parseFloat(val(a)) - parseFloat(val(b)); }
	} as Record<string, sortFunction>

	createCookie(name: string, value: string, days: number | false = false) {
		let expires = "";
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/`;
	}

	readCookie(name: string) {
		const nameEQ = encodeURIComponent(name) + "=";
		const ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
		return null;
	}

	rank(table: HTMLTableElement) {
		const ranks = table.querySelector<HTMLDivElement>('.rank_data');
		if (!ranks) { return false; }
		const data = JSON.parse(ranks.textContent);
		Object.entries(data).forEach(([key, value]) => {
			const rankItem = document.getElementById(`row_rank_${key}`) as HTMLElement;
			if (rankItem) { rankItem.innerHTML = String(value); }
		});
	}

	loadSorter(sortType: string) {
		if (sortType in this.sorters) { return this.sorters[sortType]; }
		return this.sorters.alpha;
	}

	hovers: Record<string, hoverFunction> = {
		"val": (ptd, h_id) => {
			return ' >' + ptd.getAttribute('fmla');
		},
		"fmla": (ptd, h_id) => {
			const my_rt = ptd.closest('.tableknife_TABLE');
			const rt_id = Number(my_rt?.getAttribute('report_id') || '');
			const fmla = this.tts[rt_id].decodeTdFMLA(ptd);
			return ' >' + fmla;
		}
	}

	compose_hoveri = (ptd: tkCellElement) => {
		const h_id = this.newHId();
		const htype = ptd.getAttribute('htype') ?? '';
		if (typeof (this.hovers[htype]) !== "undefined") {
			const hout = this.hovers[htype](ptd, h_id);
			const myId = crypto.randomUUID();

			ptd.insertAdjacentHTML('beforeend',
				`<div id="${myId}" class="hoveri_DIV" h_id="${h_id}" htype="${htype}" ${hout}</div>`
			);

			const hoverDIV = document.getElementById(myId);
			if (!hoverDIV) { return; }
			requestAnimationFrame(() => {

				const rect2 = hoverDIV.getBoundingClientRect();
				const overflowRight = rect2.right - window.innerWidth;
				if (overflowRight > 0) { hoverDIV.style.left = `-${Math.ceil(overflowRight + 30)}px`; }
			});
		}

		ptd.addEventListener('mouseleave', (e: Event) => {
			e.preventDefault();
			document.querySelectorAll(`.hoveri_DIV[h_id="${h_id}"]`).forEach(element => element.remove());
		});
	}

	constructor() {
		const tables = document.querySelectorAll<HTMLTableElement>('.tableknife_TABLE');
		tables.forEach(table => {
			let reportId = Number(table.getAttribute('report_id') ?? '0');
			if (!reportId) {
				reportId = this.upId();
				table.setAttribute('report_id', String(reportId));
			}
			const y = new tableKnife(reportId, this);
			this.tts[reportId] = y;
			this.rank(table);
		});

		//jump to location if we have a jump cookie
		let obsLocation = this.readCookie('obsjump');
		if (obsLocation) {
			const obs = document.querySelector(`.obs_SELECT[hash="${obsLocation}"]`);
			if (obs) {
				window.scrollTo({ top: obs.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
				document.cookie = 'obsjump=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			}
		}
		queueMicrotask(() => {
			this.loaded();
		});
	}
	loaded()
	{
	document.dispatchEvent(new CustomEvent('tableknifeLoaded', {
		detail: { version: this.version }
	}));
	}
}

document.addEventListener('DOMContentLoaded', () => {
	(window as any).tkManager = new tkManager();
}, { once: true });