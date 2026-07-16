class tn_grandpa 
{
	me;
	context = "";
	url = "";
	/**
	 * this is helper function to provide a referenec back to actual object based on how this works in JavaScript
	 */
	set_me(x)
	{
		this.log('me set');
		this.me = x;
	}
	get_me()
	{
		return this.me;
	}
		
	log(x)	
	{
		console.log( `${this.context} - ${x}`)
	}
}

class tn_dad extends tn_grandpa
{
		sb()
		{
			const ho = this.get_me();
			ho.log('binding');
		}
		eb() {
			const ho = this.get_me();
			ho.log('bound');
		}
		first_init()
		{
			this.set_me(this);
			this.init();
		}
		init()
		{
			const ho = super.get_me();
			ho.log(`initialized ${ho.context}`);
			ho.bind();
		}
		/**
		 * does a bind
		 * @param {string} sel - selector string
		 * @param {string} etype - event type , e.g., click or submit
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		binderFunction(targ,sel,etype, f,clearBind = true,onlyOnce = false)
		{
			const bName = "=_bind_" + etype;
			let params = {};
			if (onlyOnce) {
				params["once"] = true;
			}
			targ.querySelectorAll(sel).forEach( el => {
				if (clearBind) { 
					if (Object.hasOwn(el,bName )) {
						el.removeEventListener(etype,el[bName]);
					}
				}
				el[bName] = f;
				el.addEventListener(etype,f,params);
			});
		}

		/**
		 * Performs an operation with various parameters.
		 * @param {string} sel - selector string
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		bindClick(sel,f,clearBind,onlyOnce) 
		{
			this.bindClickTarget(document,sel,f,clearBind,onlyOnce);
		}


		/**
		 * Performs an operation with various parameters.
		 * @param {HTMLElement} targ 
		 * @param {string} sel - selector string
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		bindClickTarget(targ,sel,f,clearBind,onlyOnce) 
		{
			this.binderFunction(targ,sel,"click",f,clearBind,onlyOnce);
		}	
		/**
		 * Performs an operation with various parameters.
		 * @param {string} sel - selector string
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		bindChange(sel,f,clearBind,onlyOnce) 
		{
			this.binderFunction(document,sel,"change",f,clearBind,onlyOnce);
		}

		/**
		 * Performs an operation with various parameters.
		 * @param {string} sel - selector string
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		bindForm(sel,f,clearBind = true, onlyOnce = true) 
		{
			this.binderFunction(document,sel,"submit",f,clearBind,onlyOnce);
		}
			
		/**
		 * Performs an operation with various parameters.
		 * @param {string} sel - selector string
		 * @param {function} f - function to occur when that event
		 * @param {boolean} clearBind - whether or not to clear any current binding
		 * @param {boolean} onlyOnce - whether or not to make event occur only once
		 */
		bindInput(sel,f,clearBind,onlyOnce)
		{
			this.binderFunction(document,sel,"input",f,clearBind,onlyOnce);
		}
			
		/**
		 * @param {HTMLElement}  t
		 */
		getAction(t)
		{
			return t.getAttribute('action');
		}		
}

class TableKnife extends tn_dad {
	output = '';
	col_names = [];
	rt_id = 0;
	columns = [];
	context="tableknife"
	max_run_count = 50;
	
	/**
	 * @param {number} report_id 
	 * @param {*} rt_manager }
	 */
	constructor(report_id, rt_manager)
	{
		super();
		this.la = [];		
		this.set_me(this);
		this.manager = rt_manager;
		this.rt_id = report_id;
		this.bind();
	}

	cookieHide()
	{
		const ho = super.get_me();
		const my_string = ho.manager.readCookie(`rt_${ho.rt_id}`);

		if (!my_string) { return false; }

		ho.columns = my_string.split(',');
		for (let col_id in ho.columns) {
			let parts = col_id.split("=")
			if (parts[1] == 1) {
				ho.rtObj.querySelectorAll(`tr > td:nth-child(${parts[0]})`)
				         .forEach(td => td.checked = false);		
		 		ho.setColumn(1, parts[0], 'hide');
			}
		}
	}	
	first_hide() 
	{
		const ho = super.get_me();
		
		if (!ho.csp) { ho.log(`no hide columns in ${ho.rt_id}`);  return false; }
		
		ho.cookieHide();
		const topDIV =  ho.csp.querySelector('.csp_top_DIV');
		const ctypes = topDIV.getAttribute('ctypes').split(',');
		const hidden_ctypes = topDIV.getAttribute('hidden_ctypes').split(',');
		let top_divs = [];
		ctypes.forEach( ctype => {
			if (ctype == 'tableknife\\rfield_db') { return false; }

			let my_state = 'show';
			if (hidden_ctypes.indexOf(ctype) != -1) { my_state = 'hide'; }
			top_divs.push(`<div class="csp_show_ctype" ctype="${ctype}" state="${my_state}"> ${ctype}</div>`);
			ho.csp.querySelectorAll(`.csp_column_DIV[ctype=${ctype}]`).forEach( el => {  el.setAttribute('state',my_state); });

		});
		top_divs.push('<div class="csp_show_all">Show All</div>');
		topDIV.innerHTML = top_divs.join('');
		
		//expand the ctypes onto each TD and to the analysis rows if existent
		ho.rtObj.querySelectorAll('.header_TR TD > div, .header_TR TH > div').forEach(( div) => {
		  const ctype = div.getAttribute('ctype');
		  if (ctype) {
			const parentTd = div.parentElement;
		    parentTd.setAttribute('ctype', ctype);
		    const tdIndex = Array.from(parentTd.parentElement.children).indexOf(parentTd);
		    ho.rtObj.querySelectorAll('.analysis_TR').forEach((analysisTr) => {
				const td = analysisTr.querySelectorAll(':scope > td')[tdIndex];
				if (td) {
				    td.setAttribute('ctype', ctype);
				}
		    });
		  }
		});
		//hide the hidden ctypes in the table
		hidden_ctypes.forEach( (item) => {
			ho.ctypeState(item,'hide');
		});
	}
	
	ctypeState(item,state)
	{
		this.rtObj.gridSet = 'broken';
		this.rtObj.querySelectorAll(`TD[ctype="${item}"], TH[ctype="${item}"]`).forEach(td => { td.setAttribute('state', state); } );
	}

	colState(col_id,state)
	{
		this.rtObj.gridSet = 'broken';
		this.rtObj.querySelectorAll(`td:nth-child(${col_id}) , th:nth-child(${col_id})`).forEach( td => { td.setAttribute('state',state); });
	}
	
	setColumn(col_id, myState) 
	{
		const ho = super.get_me();
		let myVal = 0;
		if (myState == 'hide') {
			myVal = 1;			
		} 
		ho.columns[col_id] = `${col_id}=${myVal}`;
		ho.colState(col_id,myState);
		ho.manager.createCookie(`rt_${ho.rt_id}`, ho.columns.join());
	}
	show_only_row(row_id) 
	{
		const ho = super.get_me();
		ho.log(`showing only row ${row_id}`);
		ho.rtObj.querySelectorAll(`tr[id^="row_${ho.rt_id}"]`).forEach(tr => {
		    if (tr.id === `row_${ho.rt_id}_${row_id}`) {
		        tr.classList.remove('hide_ROW');
		    } else {
		        tr.classList.add('hide_ROW');
		    }
		});
	}
	show_all_rows() 
	{
		const ho = super.get_me();
		ho.log('showing all rows');
		ho.rtObj.querySelectorAll(`tr[id^="row_${ho.rt_id}"]`).forEach(tr => {
			tr.classList.remove('hide_ROW');
		});
	}
	show_all() 
	{
		const ho = super.get_me();
		ho.log('showing all columns');
		ho.csp.querySelectorAll('.csp_column_DIV').forEach( cspCol =>  { cspCol.setAttribute('state', 'show'); } );
		ho.rtObj.querySelectorAll('TD, TH').forEach( td => { td.setAttribute('state','show'); });
	}

	hide_many(many_string) 
	{
		const ho = super.get_me();
		const many = many_string.split(',');
		for (let i = 0; i < many.length; i++) {
			ho.setColumn(many[i], false);
		}
	}

	rload() {
		window.location.href = window.location.href;
	}
	
	cspBind()
	{
		const ho = super.get_me();
		ho.bindClickTarget(ho.csp,'.csp_show_all', (e) => {
			e.preventDefault();
			ho.show_all();
		});
		ho.bindClickTarget(ho.csp,'.csp_column_DIV', (e) => {
			const t = e.currentTarget;
			let newState = 'show';
			if (t.getAttribute('state') == 'show') {
				newState = 'hide';
			} 
			t.setAttribute('state',newState);
			ho.setColumn(t.getAttribute('column'), newState);
		});
		ho.bindClickTarget(ho.csp,'.csp_show_ctype', (e) => {
			e.preventDefault();
			const t = e.currentTarget;
			const ctype =  t.getAttribute('ctype') ;
			let myState = 'show';
			if (t.getAttribute('state') === 'show') {
			    myState = 'hide';
			}
			t.setAttribute('state', myState);
			ho.ctypeState(ctype,myState);
		});
	}
	
	sortTable(e)
	{
		const ho = super.get_me();
		const t = e.currentTarget;
		e.preventDefault();
		const col = t.getAttribute('col');				
		const sortType = t.getAttribute('sort') || 'alpha';
	
		const current = t.getAttribute('activeSort');
		const dir = current === 'asc' ? 'desc' : 'asc';
		const dirInt = dir === 'asc' ? 1 : -1;
		ho.rtObj.querySelectorAll('.sortCol[activeSort]').forEach(el => el.removeAttribute('activeSort'));
		t.setAttribute('activeSort', dir);
		const rows = Array.from(ho.tbody.querySelectorAll(':scope > tr'));

		const decipherCell = (tr) => {
				const cell = tr.querySelector(`:scope > td[col="${col}"], :scope > th[col="${col}"]`);
				return cell ? cell.textContent.trim() : '';
		};

		const cmp = ho.manager.loadSorter(sortType);
		rows.sort((a, b) => cmp(a, b, decipherCell) * dirInt);
		rows.forEach(tr => ho.tbody.appendChild(tr));

		ho.analysisRows.forEach(tr => ho.tbody.appendChild(tr));
		ho.rtObj.gridSet = 'broken';			

	}
	bind() 
	{
		const ho = super.get_me();
		ho.sb();
		ho.rtObj = document.querySelector(`.tableknife_TABLE[report_id="${ho.rt_id}"]`);
		ho.csp = document.querySelector(`.csp_DIV[report_id="${ho.rt_id}"]`);
		ho.dsr = document.querySelector(`.dsr_outer[rt_id="${ho.rt_id}"]`);
		
		ho.tbody = ho.rtObj.querySelector('tbody') || ho.rtObj; //limit to just using the TBODY section (not THEAD or TFOOTER)
		ho.analysisRows = ho.tbody.querySelectorAll(':scope > tr.analysis_TR');
		
		let row = 0;
		ho.rtObj.querySelectorAll(':scope > tbody > tr , :scope > thead > tr').forEach(tr => {
		    row++;
		    tr.setAttribute('arow', row);
		    let col = 0;
			
		    tr.querySelectorAll(':scope > td ,:scope > th').forEach(td => {
		        col++;
		        td.setAttribute('row', row);
		        td.setAttribute('col', col);
		        td.setAttribute('cella', ho.make_column_letter(col) + row);
				if (row === 1 ) {
					if (td.hasAttribute('nopaste')) { return false; }
					const sortType = td.getAttribute('sort');
					if (sortType !== 'none') {
						td.classList.add('sortCol');
					}
				}
		    });
		});
		ho.bindClickTarget(ho.rtObj, '.sortCol', (e) => ho.sortTable(e));
		
		ho.first_hide();
		if (ho.csp) { ho.cspBind(); }
		
		if (ho.rtObj.querySelector('.rank_TD')) {
			ho.rank_column();
		}
		if (ho.rtObj._rload) {
			ho.rtObj.removeEventListener('rload',ho.rtObj._rload); 
		}
		ho.rtObj._rload = () => {  ho.rload(); }
		ho.rtObj.addEventListener('rload',ho.rtObj._rload );

		
		ho.binderFunction(ho.rtObj,'.hoveri','mouseenter', (e) => {
			e.preventDefault();
			const t= e.currentTarget;
			if (t.querySelector('.hoveri_DIV')) { return false; }
			ho.manager.compose_hoveri(t);
		});
		
		ho.binderFunction(document,`.rt_view_SELECT[report_id="${ho.rt_id}"]`,'change', (e) => {
		const show_row = e.currentTarget.value;
		if (show_row > 0) {
			ho.show_only_row(show_row);
		}
		else { ho.show_all_rows(); }
		});
		
		if (!ho.dsr)  {
			ho.log(`exiting out due to no dsr set${ho.rt_id}`);
			return false; 
		}


		ho.bindClickTarget(ho.dsr,'.dsr_button_BOX BUTTON', (e) => {
			e.preventDefault();
			const pasteType = e.currentTarget.getAttribute('pastetype');
			ho.log(`click fired on ${pasteType}` );
			ho.processTable();
			switch (pasteType) {
				case 'XLS': ho.paste_xls(); break;
				case 'G': ho.paste_g(); break;
				case 'TSV': ho.saveTSV(); break;
			}
			ho.dsr.setAttribute('state','done');

		});
		ho.binderFunction(ho.dsr, '.obs_SELECT','change', (e) => {
			const t = e.currentTarget;
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
	
			ho.rtObj.dispatchEvent(new CustomEvent('rload'));
		},true,true);


		ho.eb();
	}

	make_column_letter(oval) 
	{
		const ho = super.get_me();
		if (ho.col_names[oval]) { return ho.col_names[oval]; }
		function upshiftAZ(match, offset) {
			let shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.toUpperCase().charCodeAt(0) + 9 + shift);
		}
		function upshift09(match, offset) {
			let shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.charCodeAt(0) + 16 + shift);
		}

		const out_val = oval.toString(27).replace(/[A-Za-z]/g, upshiftAZ).replace(/[0-9]/g, upshift09);
		ho.col_names[oval] = out_val;
		return out_val;
	}

	process_inner_table(that) 
	{
		const pieces = []
		that.querySelectorAll('TABLE TD').forEach((p)  => { pieces.push(p.textContent); });
		that.replaceWith(pieces.join(' '));
	}

	decode_fmla(fmla, y) {
		const ho = super.get_me();
		let run_count = 0;
		let action="";
		while (fmla.indexOf(String.fromCharCode(189)) > -1) {
			run_count++;
			const instruction_start = fmla.indexOf(String.fromCharCode(189));
			let instruction_end = fmla.indexOf(String.fromCharCode(190));
			if (instruction_end <= -1) {
				ho.log("invalid magic formula length");
				return false;
			}
			instruction_end = instruction_end + 1; //correct to express inclusion
			const instruction = fmla.substring(instruction_start, instruction_end);
			const parts = instruction.split("");
		
			ho.log(`magic instuction: ${instruction} found. Length = ${instruction.length} (=  ${instruction_end - instruction_start}) command = ${parts[0]} mode = ${parts[1]}${instruction.substr(3, instruction.length - 4)}`);
			{
				let yletter = '';
				action = parts[2];
				switch (action) {
					case 'A':
						//if (x == 21) { ho.log('instruction:' + instruction + ' from ' + fmla); }
						const target = instruction.substr(3, instruction.length - 4);
						const targ_bits = target.split('_');
						const targTD = ho.rtObj.querySelector(`TD[row="${targ_bits[1]}"][col="${targ_bits[2]}"]`);
						const target_y = targTD.colNum + 1;
						yletter = ho.make_column_letter(target_y);
						break;
					case '-':
					case '+': yletter = ho.make_column_letter(y - parts[3]); break;
					default: ho.log(`unknown parse action ${action} in fmla`);

				}
				fmla = fmla.split(instruction).join(yletter);
			}
			if (run_count > ho.max_run_count) {
				ho.log(`parse loop for fmla. dying due to inability to parse in ${run_count} attempts.`);
				return false;
			}
		}
		ho.log(`resolved to ${fmla}`);
		return fmla;
	}

	decode_td_fmla(me) {
		const ho = super.get_me();
		const fmla = me.getAttribute('fmla');
		ho.makeGrid(ho.rtObj);
		const y = me.colNum;
		ho.log(`considering formula ${fmla} at col ${y}`);
		return ho.decode_fmla(fmla, y);
	}

	makeGrid(myTable, vTest = true)
	{
		if ('gridSet' in myTable && myTable.gridSet == 'curent')  { return; }
		let x = 0;
		myTable.querySelectorAll('tr').forEach( tr => {
			if (vTest) { if (!tr.checkVisibility()) { return false; }}
			tr.rowNum = x;
			x = x +1;
			let y = 0;
			tr.querySelectorAll('td').forEach (td => {
				if (vTest) { if (!td.checkVisibility()) { return false; } }
				td.colNum = y;
				y = y +1;
			});
		} );	
		myTable.gridSet = 'current';
	}
	
	processTable() 
	{
		const ho = super.get_me();
		ho.log(`process action fired for rt_id = ${ho.rt_id}`);
		if (ho.dsr.getAttribute('state') === 'processing') {
			alert('already in progress.');
			return false;
		}
		ho.dsr.setAttribute('state', 'processing');

		const simplify = document.createElement('table');
		simplify.className = 'tableknife_TABLE';
		simplify.innerHTML = ho.rtObj.innerHTML;
		
		simplify.querySelectorAll('table:not(.tableknife_TABLE)')
		        .forEach(table => ho.process_inner_table(table));
		ho.log('stripped / simplified internal tables');

		simplify.querySelectorAll('[state=hide] , [nopaste]').forEach((me) => { me.remove() });
		ho.log('removed no paste');

		simplify.querySelectorAll('.split_column').forEach (splitC =>  {
			const myTD = splitC.parentElement;
			const afters = [];
			let newTD = false;
			let col_count = 1;
			let next_col;
			while ((next_col = splitC.getAttribute('col' + col_count)) !== null) {
				newTD = document.createElement('td');
				newTD.innerHTML = next_col;
				afters.push(newTD);
				col_count++;
			}
			myTD.after(...afters);


			if (myTD.getAttribute('row') == 1) {
				simplify.querySelectorAll(`.analysis_TR > TD[col="${myTD.getAttribute('col')}"]`).forEach(el => {
				  const fragment = document.createDocumentFragment();
				  for (let i = 0; i < col_count - 2; i++) {
				    fragment.appendChild(document.createElement('td'));
				  }
				  el.after(fragment);
				});
			}
			myTD.remove();
		});
		simplify.querySelectorAll('.alt_column').forEach ( ac => {
			ac.innerHTML = ac.getAttribute('alt');
		});
		ho.makeGrid(simplify,false);
		//add row coordinate information (needed for formulas)

		simplify.querySelectorAll('[fmla]').forEach( (a) => {
			ho.rtObj.setAttribute('wcell', a.getAttribute('cella'));
			a.innerHTML= ho.decode_fmla(a.getAttribute('fmla'), a.colNum + 1);
		});

		ho.output = simplify.innerHTML;
		ho.dsr.setAttribute('state', '');
	}
	paste_xls() {
		const ho = super.get_me();
		ho.log('pasted to clipboard in XLS mode');

		navigator.clipboard.writeText(`<x:Workbook  
			xmlns="urn:schemas-microsoft-com:office:spreadsheet"  xmlns:o="urn:schemas-microsoft-com:office:office"  
			xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"  xmlns:x="urn:schemas-microsoft-com:office:excel" >
			<Worksheet ss:Name="Test"><table >${ho.output}</table></Worksheet></Workbook>`);
	}
	paste_g() {
		const ho = super.get_me();
		let output = ho.output.replace('<thead','<tx').replace('<th', '<ty').replace('<tr', '<tx').replace('<td', '<ty'). //remove first offset
			replaceAll('<th','<td'). //switch all TH to TD
			replaceAll('<td', String.fromCharCode(9) + '<td'). //replace all <td with control character
			replaceAll('<tr', String.fromCharCode(13) + String.fromCharCode(10) + '<tr'). //replace all <TR with control character
			replaceAll('&nbsp;', ' '). //replace space entity with space
			replaceAll('&amp;', '&');
		output = output.replace(/<[^>]*>?/gm, '').replaceAll(String.fromCharCode(13) + String.fromCharCode(10) + String.fromCharCode(9), String.fromCharCode(13) + String.fromCharCode(10));
		ho.log('pasted to clipboard in Sheets mode: ' + output);
		navigator.clipboard.writeText(output);
	}
	buildTSV() {
		const ho = super.get_me();
		let o_trs = [];
		const z = document.createElement('div');
		z.innerHTML = '<table>' +  ho.output + '</table>';
		z.querySelectorAll('tr').forEach(tr => {
		    let o_tds = [];
		    tr.querySelectorAll('td , th').forEach(td => {
		        let me = td.textContent;
		        if (me.includes(',')) {
		            me = `"${me}"`;
		        }
		        if (me === "") {
		            me = " ";
		        }
		        o_tds.push(`${me}`);
		    });
		    o_trs.push(o_tds.join(','));
		});

		return o_trs.join(String.fromCharCode(13) + String.fromCharCode(10));	
	}
	saveTSV() {
		const ho = super.get_me();
		const output = ho.buildTSV();
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

	rank_column() {
		const ho = super.get_me();
		const ranks = ho.rtObj.querySelectorAll('.rank_TD');
		ho.log(`rt_${ho.rt_id} has ${ranks.length} ranks`);

		ranks.forEach(element => {
		  const col = element.getAttribute('col');
		  const row = element.getAttribute('row');
		  const targetTd = ho.rtObj.querySelector(`td[col="${Number(col) - 1}"][row="${row}"]`);
		  const grandTotal = targetTd ? targetTd.innerHTML : '';
		  element.setAttribute('grand_total', grandTotal);
		});

		const sortedRanks = Array.from(ranks).sort((a, b) => {
		  const grandTotalA = parseFloat(a.getAttribute('grand_total')) || 0;
		  const grandTotalB = parseFloat(b.getAttribute('grand_total')) || 0;
		  return grandTotalB - grandTotalA;
		});

		let rankCount = 1;
		let equals = 1;
		let currentValue = 0;

		sortedRanks.forEach(element => {
		  element.innerHTML = rankCount;
		  const grandTotal = parseFloat(element.getAttribute('grand_total')) || 0;
		  if (grandTotal > currentValue) {
		    rankCount += equals;
		    equals = 1;
		  } else {
		    equals++;
		  }
		});

		ho.log(`rank_column ran on rt id ${ho.rt_id}`);
	}

	log(x) 
	{
		this.la.push(x);
	}
}


var tableknife_manager = {		//has to be var or else pagespeed_mod fails
	tts: [],
	report_id: 100,
	sorters: {
		alpha: (a, b, val) => { return  val(a).localeCompare(val(b), undefined, { sensitivity: 'base' }) } ,
		currency : (a, b, val) => {  return parseFloat(val(a).replace(/[^0-9.-]/g, '')) - parseFloat(val(b).replace(/[^0-9.-]/g, '')); },
		numeric: (a, b, val) => { return	parseFloat(val(a)) - parseFloat(val(b)); }
	},
	createCookie: function(name, value, days) {
		let expires = "";
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		}
		document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/`;
	},
	/**
	 * @param {string} name
	 */
	readCookie: function(name) {
		const nameEQ = encodeURIComponent(name) + "=";
		const ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
		return null;
	},
	/**
	 * @returns {integer} 
	 **/
	up_id: function() {
		return this.report_id++;
	},
	loadSorter(sortType) {
		if (sortType in this.sorters) { return this.sorters[sortType]; }
		return this.sorters.alpha;	
	},
	h_id: 0,
	/**
	 * @returns {integer} 
	 **/
	new_h_id() {
		this.h_id++;
		return this.h_id;
	},
	/**
	 * @param me
	 * @param {HTMLElement} ptd
	 * @param {integer}h_id 
	 */
	hovers: {
		"val": function(me, ptd, h_id) { return ' >' + ptd.getAttribute('fmla'); },
		"fmla": function(me, ptd, h_id) {
			const my_rt = ptd.closest('.tableknife_TABLE');
			const rt_id = my_rt.getAttribute('report_id');
			const fmla = me.tts[rt_id].decode_td_fmla(ptd);
			return ' >' + fmla;
		}
	},
	/**
	 * @param {HTMLTableElement} table 
	 */
	rank(table)
	{
		const ranks =  table.querySelector('.rank_data');
		if (!ranks) { return false; }
		
		const data = JSON.parse(ranks.content.textContent); 
		Object.entries(data).forEach(([key, value]) => {
			const rankItem = document.getElementById(`row_rank_${key}`);
			if (rankItem) { rankItem.innerHTML = value; }
		});

	},
	/**
	 * @param {HTMLElement} ptd
	 */
	compose_hoveri: function(ptd) {
		const h_id = this.new_h_id();
		const htype = ptd.getAttribute('htype');
		if (typeof (this.hovers[htype]) !== "undefined") {
			const hout = this.hovers[htype](this, ptd, h_id);
			const myId = crypto.randomUUID();
			
			ptd.insertAdjacentHTML('beforeend', 
			  `<div id="${myId}" class="hoveri_DIV" h_id="${h_id}" htype="${htype}" ${hout}</div>`
			);		
			
			const hoverDIV = document.getElementById(myId);
			requestAnimationFrame(() => {

			const rect2 = hoverDIV.getBoundingClientRect();
			const overflowRight = rect2.right - window.innerWidth;
			if (overflowRight > 0 ) {  hoverDIV.style.left = `-${Math.ceil(overflowRight + 30)}px`;  }
			});
		}		
			
		ptd.addEventListener('mouseleave', (e) =>  {
			e.preventDefault();
			document.querySelectorAll(`.hoveri_DIV[h_id="${h_id}"]`).forEach(element => element.remove());
		});
	},
	initialize: function() {
		const tables = document.querySelectorAll('.tableknife_TABLE');
		tables.forEach(table => {
		  let reportId = table.getAttribute('report_id');
		  if (reportId === null) {
		    reportId = this.up_id();
		    table.setAttribute('report_id', reportId);
		  }
		  const y = new TableKnife(reportId, this);
		  this.tts[reportId] = y;
		  this.rank(table);
		});

		//jump to location if we have a jump cookie
		let obs_location = this.readCookie('obsjump');
		if (obs_location) {
		  const obs = document.querySelector(`.obs_SELECT[hash="${obs_location}"]`);
		  if (obs) {
		    window.scrollTo({ top: obs.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
		    document.cookie = 'obsjump=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		  }
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
  tableknife_manager.initialize();
  document.dispatchEvent(new CustomEvent('tableknifeLoaded', {
    detail: { version: '1.1' }
  }));
	},{once:true});