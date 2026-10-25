/* Мини-интерпретатор C++ для C++ Академии.
   Поддерживает: переменные, int/long long/double/char/bool/string/vector, массивы (в т.ч. 2D),
   if/for/while/do/switch/range-for, функции (ссылки, перегрузка, значения по умолчанию, рекурсия),
   лямбды, struct (только поля), cin/cout/printf, часть <cmath> и <algorithm>.
   Не поддерживает: указатели, классы, шаблоны, map/set. */
(function (root) {
'use strict';

class CppError extends Error {
  constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line || 0; }
}
class ExitSignal { constructor(code) { this.code = code; } }
const ce = (msg, line) => new CppError('compile', msg, line);
const re = (msg, line) => new CppError('runtime', msg, line);

/* ======================= ЛЕКСЕР ======================= */
function esc(c) {
  switch (c) {
    case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r'; case '0': return '\0';
    case 'a': return '\x07'; case 'b': return '\b'; default: return c;
  }
}
function lex(src, baseLine, macros) {
  const toks = []; let i = 0, line = baseLine || 1; const n = src.length;
  macros = macros || {};
  const OPS3 = ['<<=', '>>='];
  const OPS2 = ['<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '->', '::'];
  const SINGLE = '+-*/%=<>!&|^~?:;,.()[]{}';
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\u00a0') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2; continue;
    }
    if (c === '#') {
      let j = i; while (j < n && src[j] !== '\n') j++;
      const text = src.slice(i, j);
      const m = /^#\s*define\s+([A-Za-z_]\w*)\s+(.+)$/.exec(text);
      if (m) macros[m[1]] = lex(m[2], line, {}).toks.filter(t => t.t !== 'eof');
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      const w = src.slice(i, j); i = j;
      if (macros[w]) { for (const t of macros[w]) toks.push(Object.assign({}, t, { line })); }
      else toks.push({ t: 'id', v: w, line });
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const rest = src.slice(i, i + 40);
      let m = /^0[xX][0-9a-fA-F]+/.exec(rest), kind, val, len;
      if (m) { val = parseInt(m[0], 16); len = m[0].length; kind = 'int'; }
      else {
        m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest); len = m[0].length;
        val = parseFloat(m[0]); kind = /[.eE]/.test(m[0]) ? 'double' : 'int';
      }
      i += len;
      const sm = /^[uUlLfF]*/.exec(src.slice(i, i + 4))[0]; i += sm.length;
      if (kind === 'int' && /l/i.test(sm)) kind = 'll';
      if (kind === 'int' && val > 2147483647) kind = 'll';
      toks.push({ t: 'num', v: val, kind, line });
      continue;
    }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\n') throw ce('строка не закрыта кавычкой "', line);
        if (src[j] === '\\') { j++; s += esc(src[j]); } else s += src[j];
        j++;
      }
      if (j >= n) throw ce('строка не закрыта кавычкой "', line);
      toks.push({ t: 'str', v: s, line }); i = j + 1; continue;
    }
    if (c === "'") {
      let j = i + 1, s = '';
      while (j < n && src[j] !== "'") {
        if (src[j] === '\n') throw ce("символьный литерал не закрыт кавычкой '", line);
        if (src[j] === '\\') { j++; s += esc(src[j]); } else s += src[j];
        j++;
      }
      if (j >= n) throw ce("символьный литерал не закрыт кавычкой '", line);
      if (s.length !== 1) throw ce("в одинарных кавычках должен быть ровно один символ ('a'); для текста используйте двойные кавычки", line);
      toks.push({ t: 'chr', v: s.charCodeAt(0), line }); i = j + 1; continue;
    }
    const t3 = src.substr(i, 3), t2 = src.substr(i, 2);
    if (OPS3.indexOf(t3) >= 0) { toks.push({ t: 'op', v: t3, line }); i += 3; continue; }
    if (OPS2.indexOf(t2) >= 0) { toks.push({ t: 'op', v: t2, line }); i += 2; continue; }
    if (SINGLE.indexOf(c) >= 0) { toks.push({ t: 'op', v: c, line }); i++; continue; }
    throw ce(`неизвестный символ '${c}'`, line);
  }
  toks.push({ t: 'eof', line });
  return { toks, macros };
}

/* ======================= ПАРСЕР ======================= */
const BASE_WORDS = new Set(['const', 'static', 'constexpr', 'unsigned', 'signed', 'long', 'short', 'int', 'double', 'float', 'char', 'bool', 'void', 'auto', 'size_t']);
const PREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);

class Parser {
  constructor(toks) {
    this.toks = toks; this.p = 0; this.structs = new Set(); this.aliases = {};
    this.prog = { funcs: {}, structs: {}, globals: [] };
  }
  peek(o) { const i = this.p + (o || 0); return this.toks[i < this.toks.length ? i : this.toks.length - 1]; }
  isOp(v, o) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  isId(v, o) { const t = this.peek(o); return t.t === 'id' && t.v === v; }
  accept(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
  show(t) { return t.t === 'eof' ? 'конец файла' : t.t === 'str' ? 'строка' : `'${t.t === 'chr' ? String.fromCharCode(t.v) : t.v}'`; }
  fail(exp) {
    const t = this.peek(), prev = this.toks[this.p - 1];
    let line = t.line;
    if ((exp === ';' || exp === ')' || exp === '}') && prev && prev.line < t.line) line = prev.line;
    throw ce(`ожидалось '${exp}', а найдено ${this.show(t)}`, line);
  }
  expect(v) { if (!this.accept(v)) this.fail(v); }
  expectGT() {
    if (this.isOp('>')) { this.p++; return; }
    if (this.isOp('>>')) {
      const t = this.peek();
      this.toks.splice(this.p, 1, { t: 'op', v: '>', line: t.line }, { t: 'op', v: '>', line: t.line });
      this.p++; return;
    }
    this.fail('>');
  }
  ident() {
    const t = this.peek();
    if (t.t !== 'id') throw ce(`ожидалось имя, а найдено ${this.show(t)}`, t.line);
    this.p++; return t.v;
  }
  isTypeStart(o) {
    const t = this.peek(o);
    if (t.t !== 'id') return false;
    return BASE_WORDS.has(t.v) || t.v === 'string' || t.v === 'vector' || this.structs.has(t.v) || !!this.aliases[t.v];
  }

  parseType() {
    const first = this.peek();
    let cst = false, uns = false, longs = 0, base = null, words = 0;
    for (;;) {
      const t = this.peek();
      if (t.t !== 'id') break;
      const w = t.v;
      if (w === 'const' || w === 'constexpr' || w === 'static') { cst = cst || w !== 'static'; this.p++; continue; }
      if (w === 'unsigned') { uns = true; words++; this.p++; continue; }
      if (w === 'signed') { words++; this.p++; continue; }
      if (w === 'long') { longs++; words++; this.p++; continue; }
      if (w === 'size_t') { longs++; words++; this.p++; continue; }
      if (w === 'short') { base = 'int'; words++; this.p++; continue; }
      if (w === 'int') { if (!base) base = 'int'; words++; this.p++; continue; }
      if (w === 'double' || w === 'float' || w === 'char' || w === 'bool' || w === 'void' || w === 'auto') { base = w; words++; this.p++; continue; }
      break;
    }
    let type;
    if (base === 'double' || base === 'float') type = { k: base };
    else if (base === 'char' || base === 'bool' || base === 'void' || base === 'auto') type = { k: base };
    else if (words > 0) type = { k: (longs || uns) ? 'll' : 'int' };
    else {
      const t = this.peek();
      if (t.t === 'id' && t.v === 'string') { this.p++; type = { k: 'str' }; }
      else if (t.t === 'id' && t.v === 'vector') {
        this.p++; this.expect('<'); const elem = this.parseType(); this.expectGT(); type = { k: 'vec', elem };
      }
      else if (t.t === 'id' && this.aliases[t.v]) { this.p++; type = JSON.parse(JSON.stringify(this.aliases[t.v])); }
      else if (t.t === 'id' && this.structs.has(t.v)) { this.p++; type = { k: 'struct', name: t.v }; }
      else throw ce(`ожидался тип данных, а найдено ${this.show(t)}`, t.line);
    }
    while (this.isId('const')) { this.p++; cst = true; }
    if (this.isOp('*')) throw ce('указатели (*) пока не поддерживаются в этом мини-компиляторе', this.peek().line);
    if (cst) type.cst = true;
    if (this.accept('&')) type.ref = true;
    return type;
  }

  parseProgram() {
    while (this.peek().t !== 'eof') this.parseTop();
    return this.prog;
  }
  parseTop() {
    const t = this.peek();
    if (t.t === 'id') {
      if (t.v === 'using') {
        this.p++;
        if (this.isId('namespace')) { this.p++; this.ident(); this.expect(';'); return; }
        const name = this.ident(); this.expect('='); const type = this.parseType(); this.expect(';');
        this.aliases[name] = type; return;
      }
      if (t.v === 'typedef') { this.p++; const type = this.parseType(); const name = this.ident(); this.expect(';'); this.aliases[name] = type; return; }
      if (t.v === 'struct') { this.parseStruct(); return; }
      if (t.v === 'class') throw ce('классы (class) пока не поддерживаются — используйте struct', t.line);
      if (t.v === 'template') throw ce('шаблоны (template) пока не поддерживаются', t.line);
    }
    const type = this.parseType();
    const nameTok = this.peek(); const name = this.ident();
    if (this.isOp('(')) {
      this.p++;
      const params = this.parseParams();
      if (this.accept(';')) return; // прототип
      const body = this.parseBlock();
      (this.prog.funcs[name] = this.prog.funcs[name] || []).push({ name, ret: type, params, body, line: nameTok.line });
      return;
    }
    this.p--;
    const decl = this.parseDecl(type, nameTok.line); this.expect(';');
    this.prog.globals.push(decl);
  }
  parseParams() { // после '(' , съедает ')'
    const params = [];
    if (!this.isOp(')')) {
      do {
        if (this.isId('void') && this.isOp(')', 1)) { this.p++; break; }
        let type = this.parseType(); let name = null;
        if (this.peek().t === 'id') name = this.ident();
        while (this.accept('[')) {
          while (!this.isOp(']') && this.peek().t !== 'eof') this.p++;
          this.expect(']'); type = { k: 'vec', elem: type, ref: true, arr: true };
        }
        let def = null;
        if (this.accept('=')) def = this.parseAssign();
        params.push({ type, name, def });
      } while (this.accept(','));
    }
    this.expect(')');
    return params;
  }
  parseStruct() {
    const line = this.peek().line; this.p++;
    const name = this.ident();
    if (!this.isOp('{')) throw ce(`ожидалось '{' после struct ${name}`, line);
    this.p++; this.structs.add(name);
    const fields = [], ftype = {};
    while (!this.isOp('}')) {
      if (this.peek().t === 'eof') throw ce("не хватает закрывающей '}' у struct " + name, line);
      const type = this.parseType();
      do {
        const fname = this.ident();
        if (this.isOp('(')) throw ce('функции внутри struct пока не поддерживаются — напишите их отдельно, рядом со struct', line);
        const dims = [];
        while (this.accept('[')) { dims.push(this.parseAssign()); this.expect(']'); }
        let init = null;
        if (this.accept('=')) init = this.isOp('{') ? this.parseInitList() : this.parseAssign();
        let full = type; for (let k = dims.length - 1; k >= 0; k--) full = { k: 'vec', elem: full, arr: true };
        fields.push({ name: fname, type, full, dims, init }); ftype[fname] = full;
      } while (this.accept(','));
      this.expect(';');
    }
    this.p++; this.expect(';');
    this.prog.structs[name] = { name, fields, ftype };
  }

  parseBlock() {
    const line = this.peek().line; this.expect('{');
    const body = [];
    while (!this.isOp('}')) {
      if (this.peek().t === 'eof') throw ce("не хватает закрывающей '}' (блок открыт здесь)", line);
      body.push(this.parseStmt());
    }
    this.p++;
    return { k: 'block', body, line };
  }
  parseDecl(type, line) {
    const items = [];
    do {
      const nt = this.peek(); const name = this.ident();
      const item = { name, dims: [], init: null, ctor: null, line: nt.line };
      while (this.accept('[')) {
        if (this.isOp(']')) item.dims.push(null); else item.dims.push(this.parseAssign());
        this.expect(']');
      }
      if (this.accept('=')) item.init = this.isOp('{') ? this.parseInitList() : this.parseAssign();
      else if (this.isOp('(')) item.ctor = this.parseArgs();
      else if (this.isOp('{')) item.init = this.parseInitList();
      items.push(item);
    } while (this.accept(','));
    return { k: 'decl', type, items, line };
  }
  parseStmt() {
    const t = this.peek(), line = t.line;
    if (t.t === 'op') {
      if (t.v === '{') return this.parseBlock();
      if (t.v === ';') { this.p++; return { k: 'empty', line }; }
    }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          this.p++; this.expect('('); const cond = this.parseAssign(); this.expect(')');
          const then = this.parseStmt(); let els = null;
          if (this.isId('else')) { this.p++; els = this.parseStmt(); }
          return { k: 'if', cond, then, else: els, line };
        }
        case 'else': throw ce("'else' без соответствующего 'if'", line);
        case 'for': return this.parseFor();
        case 'while': {
          this.p++; this.expect('('); const cond = this.parseAssign(); this.expect(')');
          return { k: 'while', cond, body: this.parseStmt(), line };
        }
        case 'do': {
          this.p++; const body = this.parseStmt();
          if (!this.isId('while')) this.fail('while');
          this.p++; this.expect('('); const cond = this.parseAssign(); this.expect(')'); this.expect(';');
          return { k: 'do', cond, body, line };
        }
        case 'switch': return this.parseSwitch();
        case 'break': this.p++; this.expect(';'); return { k: 'break', line };
        case 'continue': this.p++; this.expect(';'); return { k: 'continue', line };
        case 'return': {
          this.p++; let e = null;
          if (!this.isOp(';')) e = this.isOp('{') ? this.parseInitList() : this.parseAssign();
          this.expect(';'); return { k: 'return', e, line };
        }
        case 'using': while (!this.isOp(';') && this.peek().t !== 'eof') this.p++; this.expect(';'); return { k: 'empty', line };
        case 'goto': throw ce('goto не поддерживается', line);
      }
      if (this.isTypeStart() && !this.isOp('(', 1) && !this.isOp('::', 1)) {
        const type = this.parseType();
        const d = this.parseDecl(type, line); this.expect(';'); return d;
      }
    }
    const e = this.parseAssign();
    this.expect(';');
    return { k: 'expr', e, line };
  }
  parseFor() {
    const line = this.peek().line; this.p++; this.expect('(');
    const save = this.p;
    if (this.isTypeStart()) {
      const type = this.parseType();
      if (this.peek().t === 'id' && this.isOp(':', 1)) {
        const name = this.ident(); this.p++;
        const iter = this.isOp('{') ? this.parseInitList() : this.parseAssign();
        this.expect(')');
        return { k: 'rfor', type, name, iter, body: this.parseStmt(), line };
      }
      this.p = save;
    }
    let init = null;
    if (!this.isOp(';')) {
      if (this.isTypeStart()) { const type = this.parseType(); init = this.parseDecl(type, line); }
      else {
        const es = []; do es.push(this.parseAssign()); while (this.accept(','));
        init = { k: 'exprs', es, line };
      }
    }
    this.expect(';');
    let cond = null; if (!this.isOp(';')) cond = this.parseAssign();
    this.expect(';');
    const step = [];
    if (!this.isOp(')')) { do step.push(this.parseAssign()); while (this.accept(',')); }
    this.expect(')');
    return { k: 'for', init, cond, step, body: this.parseStmt(), line };
  }
  parseSwitch() {
    const line = this.peek().line; this.p++; this.expect('(');
    const e = this.parseAssign(); this.expect(')'); this.expect('{');
    const cases = [];
    while (!this.isOp('}')) {
      if (this.peek().t === 'eof') this.fail('}');
      if (this.isId('case')) { this.p++; const val = this.parseTernary(); this.expect(':'); cases.push({ val, body: [] }); }
      else if (this.isId('default')) { this.p++; this.expect(':'); cases.push({ val: null, body: [] }); }
      else {
        if (!cases.length) throw ce("внутри switch ожидалось 'case' или 'default'", this.peek().line);
        cases[cases.length - 1].body.push(this.parseStmt());
      }
    }
    this.p++;
    return { k: 'switch', e, cases, line };
  }

  parseInitList() {
    const line = this.peek().line; this.expect('{');
    const items = [];
    while (!this.isOp('}')) {
      items.push(this.isOp('{') ? this.parseInitList() : this.parseAssign());
      if (!this.accept(',')) break;
    }
    this.expect('}');
    return { k: 'init', items, line };
  }
  parseArgs() {
    this.expect('(');
    const args = [];
    if (!this.isOp(')')) {
      do args.push(this.isOp('{') ? this.parseInitList() : this.parseAssign()); while (this.accept(','));
    }
    this.expect(')');
    return args;
  }
  parseAssign() {
    const l = this.parseTernary();
    const t = this.peek();
    if (t.t === 'op' && ASSIGN_OPS.has(t.v)) {
      this.p++;
      const r = this.isOp('{') ? this.parseInitList() : this.parseAssign();
      return { k: 'assign', op: t.v, l, r, line: t.line };
    }
    return l;
  }
  parseTernary() {
    const c = this.parseBin(1);
    if (this.isOp('?')) {
      const line = this.peek().line; this.p++;
      const a = this.parseAssign(); this.expect(':'); const b = this.parseAssign();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }
  parseBin(min) {
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'op') break;
      const pr = PREC[t.v];
      if (!pr || pr < min) break;
      this.p++;
      const r = this.parseBin(pr + 1);
      l = (t.v === '&&' || t.v === '||') ? { k: 'logic', op: t.v, l, r, line: t.line } : { k: 'bin', op: t.v, l, r, line: t.line };
    }
    return l;
  }
  parseUnary() {
    const t = this.peek(), line = t.line;
    if (t.t === 'op') {
      switch (t.v) {
        case '!': case '-': case '+': case '~': case '*':
          this.p++; return { k: 'un', op: t.v, e: this.parseUnary(), line };
        case '&': throw ce('адреса и указатели (&) пока не поддерживаются', line);
        case '++': case '--':
          this.p++; return { k: 'incdec', e: this.parseUnary(), d: t.v === '++' ? 1 : -1, post: false, line };
        case '(':
          if (this.isTypeStart(1)) {
            const save = this.p; this.p++;
            const type = this.parseType();
            if (this.isOp(')')) { this.p++; return { k: 'cast', type, e: this.parseUnary(), line }; }
            this.p = save;
          }
      }
    }
    return this.parsePostfix();
  }
  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'op') break;
      if (t.v === '[') { this.p++; const idx = this.parseAssign(); this.expect(']'); e = { k: 'index', base: e, idx, line: t.line }; }
      else if (t.v === '.') {
        this.p++; const name = this.ident();
        if (this.isOp('(')) e = { k: 'mcall', obj: e, name, args: this.parseArgs(), line: t.line };
        else e = { k: 'member', base: e, name, line: t.line };
      }
      else if (t.v === '->') throw ce('оператор -> (указатели) пока не поддерживается', t.line);
      else if (t.v === '++' || t.v === '--') { this.p++; e = { k: 'incdec', e, d: t.v === '++' ? 1 : -1, post: true, line: t.line }; }
      else break;
    }
    return e;
  }
  parsePrimary() {
    const t = this.peek(), line = t.line;
    switch (t.t) {
      case 'num': this.p++; return { k: 'val', val: { t: t.kind, v: t.v } };
      case 'chr': this.p++; return { k: 'val', val: { t: 'char', v: t.v } };
      case 'str': {
        this.p++; let s = t.v;
        while (this.peek().t === 'str') { s += this.peek().v; this.p++; }
        return { k: 'val', val: { t: 'str', v: s } };
      }
      case 'op':
        if (t.v === '(') { this.p++; const e = this.parseAssign(); this.expect(')'); return e; }
        if (t.v === '{') return this.parseInitList();
        if (t.v === '[') return this.parseLambda();
        break;
      case 'id': return this.parseIdPrimary(t);
    }
    throw ce(`неожиданный символ ${this.show(t)}`, line);
  }
  parseLambda() {
    const line = this.peek().line; this.p++;
    while (!this.isOp(']') && this.peek().t !== 'eof') this.p++;
    this.expect(']');
    let params = [];
    if (this.accept('(')) params = this.parseParams();
    if (this.accept('->')) this.parseType();
    const body = this.parseBlock();
    return { k: 'lambda', params, body, line };
  }
  parseIdPrimary(t) {
    const w = t.v, line = t.line;
    if (w === 'true' || w === 'false') { this.p++; return { k: 'val', val: { t: 'bool', v: w === 'true' } }; }
    if (w === 'static_cast' || w === 'const_cast' || w === 'reinterpret_cast') {
      this.p++; this.expect('<'); const type = this.parseType(); this.expectGT();
      this.expect('('); const e = this.parseAssign(); this.expect(')');
      return { k: 'cast', type, e, line };
    }
    if ((w === 'greater' || w === 'less') && this.isOp('<', 1)) {
      this.p++; this.p++; this.parseType(); this.expectGT(); this.expect('('); this.expect(')');
      return { k: 'cmpobj', name: w, line };
    }
    if (this.isOp('::', 1) && this.peek(2).t === 'id') {
      let name = w; this.p++;
      while (this.isOp('::') && this.peek(1).t === 'id') { this.p++; name += '::' + this.ident(); }
      if (this.isOp('(')) return { k: 'call', name, args: this.parseArgs(), line };
      return { k: 'id', name, line };
    }
    if (this.isTypeStart() && (this.isOp('(', 1) || this.isOp('{', 1) || (this.isOp('<', 1) && w === 'vector'))) {
      const type = this.parseType();
      if (this.isOp('{')) return { k: 'construct', type, init: this.parseInitList(), line };
      return { k: 'construct', type, args: this.parseArgs(), line };
    }
    this.p++;
    if (this.isOp('(')) return { k: 'call', name: w, args: this.parseArgs(), line };
    return { k: 'id', name: w, line };
  }
}

function parse(src) {
  const raw = lex(src).toks, toks = [];
  for (let k = 0; k < raw.length; k++) {
    if (raw[k].t === 'id' && raw[k].v === 'std' && raw[k + 1] && raw[k + 1].t === 'op' && raw[k + 1].v === '::') { k++; continue; }
    toks.push(raw[k]);
  }
  return new Parser(toks).parseProgram();
}

/* ======================= ВЫЧИСЛЕНИЕ ======================= */
const LONG_MSG = 'Программа выполняется слишком долго — похоже на бесконечный цикл';
const VOID = { t: 'void' };
const BREAK = { k: 'break' }, CONTINUE = { k: 'continue' };
const NUM = { int: 1, ll: 1, double: 1, bool: 1, char: 1 };
const mkBool = b => ({ t: 'bool', v: !!b });
const mkD = x => ({ t: 'double', v: x });
const mkL = x => ({ t: 'll', v: x });
const mkI = x => ({ t: 'int', v: x | 0 });
const mkS = s => ({ t: 'str', v: s });
const mkC = c => ({ t: 'char', v: c });

class Env {
  constructor(parent) { this.vars = new Map(); this.parent = parent || null; }
  lookup(name) {
    let e = this;
    while (e) { const c = e.vars.get(name); if (c !== undefined) return c; e = e.parent; }
    return null;
  }
}
function isLvalueNode(n) {
  return n.k === 'id' || n.k === 'index' || n.k === 'member' || (n.k === 'un' && n.op === '*') ||
    (n.k === 'mcall' && (n.name === 'back' || n.name === 'front' || n.name === 'at'));
}
function typeFromValue(v) {
  switch (v.t) {
    case 'int': return { k: 'int' }; case 'll': return { k: 'll' }; case 'double': return { k: 'double' };
    case 'bool': return { k: 'bool' }; case 'char': return { k: 'char' }; case 'str': return { k: 'str' };
    case 'vec': return { k: 'vec', elem: v.et || null };
    case 'struct': return { k: 'struct', name: v.name };
    default: return { k: 'auto' };
  }
}
function copyVal(v) {
  if (v.t === 'vec') return { t: 'vec', v: v.v.map(copyVal), et: v.et };
  if (v.t === 'struct') { const f = {}; for (const k in v.f) f[k] = copyVal(v.f[k]); return { t: 'struct', name: v.name, f }; }
  return v;
}
function fmtG(x, p) {
  if (x === 0) return (1 / x < 0) ? '-0' : '0';
  if (p < 1) p = 1;
  const ex = x.toExponential(p - 1);
  const parts = ex.split('e'); const exp = parseInt(parts[1], 10);
  if (exp < -4 || exp >= p) {
    let m = parts[0];
    if (m.indexOf('.') >= 0) m = m.replace(/0+$/, '').replace(/\.$/, '');
    return m + 'e' + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
  }
  let s = x.toFixed(Math.max(0, p - 1 - exp));
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

class Interp {
  constructor(prog, input, opts) {
    this.prog = prog; this.inp = input || ''; this.ip = 0; this.cinFail = false;
    this.out = ''; this.steps = 0; this.maxSteps = (opts && opts.maxSteps) || 3000000; this.depth = 0;
    this.st = { fixed: false, prec: 6, width: 0, fill: ' ', left: false, bool: false };
    this.global = new Env(null); this.rng = 12345;
  }
  run() {
    const mains = this.prog.funcs.main;
    if (!mains) throw ce('в программе нет функции main()', 0);
    for (const g of this.prog.globals) this.execDecl(g, this.global);
    const r = this.callDef(mains[0], [], this.global, mains[0].line);
    return r && r.t === 'int' ? r.v : 0;
  }

  /* ---------- преобразования ---------- */
  toNum(v, line) {
    if (NUM[v.t]) return +v.v;
    throw ce('здесь нужно число, а получено значение типа ' + this.tname(v), line);
  }
  toInt(v, line) { return Math.trunc(this.toNum(v, line)); }
  tname(v) { return { str: 'string', vec: 'vector/массив', struct: 'struct ' + (v.name || ''), stream: 'поток', void: 'void', fn: 'функция', it: 'итератор' }[v.t] || v.t; }
  toBool(v, line) {
    if (NUM[v.t]) return +v.v !== 0;
    if (v.t === 'stream') return !this.cinFail;
    if (v.t === 'it') return true;
    throw ce('это значение нельзя использовать как условие (тип ' + this.tname(v) + ')', line);
  }
  cellType(cell) { const t = cell.type; return (!t || t.k === 'auto') ? typeFromValue(cell.val) : t; }
  coerce(type, val, line) {
    switch (type.k) {
      case 'int': {
        if (val.t === 'int') return val;
        const n = this.toNum(val, line); return { t: 'int', v: Math.trunc(n) | 0 };
      }
      case 'll': { if (val.t === 'll') return val; return { t: 'll', v: Math.trunc(this.toNum(val, line)) + 0 }; }
      case 'double': { if (val.t === 'double') return val; return { t: 'double', v: this.toNum(val, line) }; }
      case 'float': return { t: 'double', v: Math.fround(this.toNum(val, line)) };
      case 'bool': { if (val.t === 'bool') return val; return { t: 'bool', v: this.toBool(val, line) }; }
      case 'char': { if (val.t === 'char') return val; return { t: 'char', v: Math.trunc(this.toNum(val, line)) & 255 }; }
      case 'str':
        if (val.t === 'str') return val;
        if (val.t === 'char') return mkS(String.fromCharCode(val.v));
        throw ce('нельзя присвоить значение типа ' + this.tname(val) + ' переменной типа string', line);
      case 'vec': {
        if (val.t !== 'vec') throw ce('нельзя присвоить значение типа ' + this.tname(val) + ' массиву/vector', line);
        const et = type.elem || val.et || null;
        return { t: 'vec', v: val.v.map(x => et ? this.coerce(et, x, line) : copyVal(x)), et };
      }
      case 'struct': {
        if (val.t === 'struct') {
          if (val.name !== type.name) throw ce(`нельзя присвоить struct ${val.name} переменной типа ${type.name}`, line);
          return copyVal(val);
        }
        if (val.t === 'vec') return this.structFromList(type.name, val.v, line);
        throw ce('нельзя присвоить значение типа ' + this.tname(val) + ' переменной struct ' + type.name, line);
      }
      case 'auto': return copyVal(val);
      case 'void': return VOID;
    }
    return val;
  }
  structFromList(name, items, line) {
    const def = this.prog.structs[name]; const f = {};
    def.fields.forEach((fd, i) => {
      f[fd.name] = i < items.length ? this.coerce(fd.full, items[i], line) : this.defaultField(fd, line);
    });
    return { t: 'struct', name, f };
  }
  defaultField(fd, line) {
    if (fd.dims.length) {
      const sizes = fd.dims.map(d => this.toInt(this.evalExpr(d, this.global), line));
      return this.makeArr(fd.full, sizes, 0, line);
    }
    if (fd.init) {
      const v = this.evalExpr(fd.init, this.global);
      return this.coerce(fd.type, v, line);
    }
    return this.defaultValue(fd.type, line);
  }
  defaultValue(type, line) {
    switch (type.k) {
      case 'int': return mkI(0); case 'll': return mkL(0);
      case 'double': case 'float': return mkD(0);
      case 'bool': return mkBool(false); case 'char': return mkC(0); case 'str': return mkS('');
      case 'vec': return { t: 'vec', v: [], et: type.elem || null };
      case 'struct': return this.structFromList(type.name, [], line);
    }
    throw ce('нельзя создать переменную такого типа', line);
  }
  makeArr(t, sizes, k, line) {
    if (k === sizes.length) return this.defaultValue(t, line);
    const n = sizes[k];
    if (!(n >= 0) || n > 5000000) throw re('недопустимый размер массива: ' + n, line);
    const v = new Array(n);
    for (let i = 0; i < n; i++) v[i] = this.makeArr(t.elem, sizes, k + 1, line);
    return { t: 'vec', v, et: t.elem };
  }
  arrFromInit(t, sizes, k, init, env, line) {
    const n = (sizes[k] !== null && sizes[k] !== undefined) ? sizes[k] : init.items.length;
    if (!(n >= 0) || n > 5000000) throw re('недопустимый размер массива: ' + n, line);
    const v = [];
    for (let i = 0; i < n; i++) {
      const item = init.items[i];
      if (k + 1 < sizes.length) {
        v.push(item && item.k === 'init' ? this.arrFromInit(t.elem, sizes, k + 1, item, env, line) : this.makeArr(t.elem, sizes, k + 1, line));
      } else v.push(item ? this.coerce(t.elem, this.evalExpr(item, env), line) : this.defaultValue(t.elem, line));
    }
    return { t: 'vec', v, et: t.elem };
  }
  construct(type, a, line) {
    switch (type.k) {
      case 'str':
        if (a.length === 0) return mkS('');
        if (a.length === 1) return this.coerce(type, a[0], line);
        return mkS(String.fromCharCode(a[1].v).repeat(Math.max(0, this.toInt(a[0], line))));
      case 'vec': {
        if (a.length === 0) return { t: 'vec', v: [], et: type.elem || null };
        if (a.length === 1 && a[0].t === 'vec') return this.coerce(type, a[0], line);
        const n = this.toInt(a[0], line);
        if (!(n >= 0) || n > 5000000) throw re('недопустимый размер vector: ' + n, line);
        const v = new Array(n);
        for (let i = 0; i < n; i++) v[i] = a.length > 1 ? this.coerce(type.elem, a[1], line) : this.defaultValue(type.elem, line);
        return { t: 'vec', v, et: type.elem || null };
      }
      case 'struct': return this.structFromList(type.name, a, line);
      default:
        if (a.length === 0) return this.defaultValue(type, line);
        return this.coerce(type, a[0], line);
    }
  }

  /* ---------- вывод ---------- */
  fmtDouble(x) {
    if (!isFinite(x)) return isNaN(x) ? 'nan' : (x < 0 ? '-inf' : 'inf');
    const st = this.st;
    if (st.fixed) return x.toFixed(Math.min(100, st.prec));
    return fmtG(x, st.prec);
  }
  fmtVal(v, line) {
    switch (v.t) {
      case 'int': case 'll': return String(v.v);
      case 'bool': return this.st.bool ? (v.v ? 'true' : 'false') : (v.v ? '1' : '0');
      case 'char': return String.fromCharCode(v.v);
      case 'str': return v.v;
      case 'double': return this.fmtDouble(v.v);
    }
    throw ce('значение типа ' + this.tname(v) + ' нельзя вывести через cout', line);
  }
  write(s, line) {
    this.out += s;
    if (this.out.length > 300000) throw re('слишком много вывода (больше 300 000 символов)', line);
  }
  streamOut(stream, rnode, env, line) {
    const v = this.evalExpr(rnode, env);
    if (stream.id === 'cin') throw ce("к cin нужно применять '>>', а не '<<'", line);
    if (v.t === 'manip') { this.applyManip(v, stream, line); return stream; }
    let s = this.fmtVal(v, line);
    const st = this.st;
    if (st.width > s.length) s = st.left ? s.padEnd(st.width, st.fill) : s.padStart(st.width, st.fill);
    st.width = 0;
    if (stream.id === 'cout') this.write(s, line);
    return stream;
  }
  applyManip(m, stream, line) {
    const st = this.st;
    switch (m.name) {
      case 'endl': if (stream.id === 'cout') this.write('\n', line); break;
      case 'fixed': st.fixed = true; break;
      case 'defaultfloat': case 'scientific': st.fixed = false; break;
      case 'setprecision': st.prec = m.arg; break;
      case 'setw': st.width = m.arg; break;
      case 'setfill': st.fill = String.fromCharCode(m.arg); break;
      case 'left': st.left = true; break;
      case 'right': st.left = false; break;
      case 'boolalpha': st.bool = true; break;
      case 'noboolalpha': st.bool = false; break;
    }
  }
  streamIn(stream, rnode, env, line) {
    if (stream.id !== 'cin') throw ce("к cout нужно применять '<<', а не '>>'", line);
    const cell = this.evalLV(rnode, env);
    this.readInto(cell, line);
    return stream;
  }
  readInto(cell, line) {
    const type = this.cellType(cell);
    let s = this.inp, p = this.ip;
    if (type.k !== 'char') while (p < s.length && /\s/.test(s[p])) p++;
    else while (p < s.length && /\s/.test(s[p])) p++;
    if (p >= s.length) { this.cinFail = true; this.ip = p; return; }
    const rest = s.slice(p, p + 400); let m;
    switch (type.k) {
      case 'int': case 'll':
        m = /^[+-]?\d+/.exec(rest);
        if (!m) { this.cinFail = true; return; }
        this.ip = p + m[0].length; cell.val = this.coerce(type, mkL(parseInt(m[0], 10)), line); return;
      case 'double': case 'float':
        m = /^[+-]?(\d+\.?\d*([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?)/.exec(rest);
        if (!m) { this.cinFail = true; return; }
        this.ip = p + m[0].length; cell.val = this.coerce(type, mkD(parseFloat(m[0])), line); return;
      case 'str':
        m = /^\S+/.exec(rest); this.ip = p + m[0].length; cell.val = mkS(m[0]); return;
      case 'char':
        this.ip = p + 1; cell.val = mkC(s.charCodeAt(p)); return;
      case 'bool':
        m = /^[01]/.exec(rest); if (!m) { this.cinFail = true; return; }
        this.ip = p + 1; cell.val = mkBool(m[0] === '1'); return;
    }
    throw ce('нельзя прочитать значение этого типа через cin', line);
  }

  /* ---------- выполнение инструкций ---------- */
  exec(n, env) {
    if (++this.steps > this.maxSteps) throw re(LONG_MSG, n.line);
    switch (n.k) {
      case 'expr': this.evalExpr(n.e, env); return;
      case 'block': {
        const e = new Env(env), b = n.body;
        for (let i = 0; i < b.length; i++) { const r = this.exec(b[i], e); if (r) return r; }
        return;
      }
      case 'if':
        if (this.toBool(this.evalExpr(n.cond, env), n.line)) return this.exec(n.then, env);
        if (n.else) return this.exec(n.else, env);
        return;
      case 'return': return { k: 'return', v: n.e ? this.evalExpr(n.e, env) : VOID };
      case 'decl': this.execDecl(n, env); return;
      case 'break': return BREAK;
      case 'continue': return CONTINUE;
      case 'empty': return;
      default: return this.execLoop(n, env);
    }
  }
  execLoop(n, env) {
    switch (n.k) {
      case 'exprs': for (const e of n.es) this.evalExpr(e, env); return;
      case 'for': {
        const e = new Env(env);
        if (n.init) this.exec(n.init, e);
        for (;;) {
          if (n.cond && !this.toBool(this.evalExpr(n.cond, e), n.line)) break;
          const r = this.exec(n.body, e);
          if (r) { if (r === BREAK) break; if (r !== CONTINUE) return r; }
          for (let i = 0; i < n.step.length; i++) this.evalExpr(n.step[i], e);
          if (++this.steps > this.maxSteps) throw re(LONG_MSG, n.line);
        }
        return;
      }
      case 'while':
        for (;;) {
          if (!this.toBool(this.evalExpr(n.cond, env), n.line)) break;
          const r = this.exec(n.body, env);
          if (r) { if (r === BREAK) break; if (r !== CONTINUE) return r; }
          if (++this.steps > this.maxSteps) throw re(LONG_MSG, n.line);
        }
        return;
      case 'do':
        for (;;) {
          const r = this.exec(n.body, env);
          if (r) { if (r === BREAK) break; if (r !== CONTINUE) return r; }
          if (!this.toBool(this.evalExpr(n.cond, env), n.line)) break;
          if (++this.steps > this.maxSteps) throw re(LONG_MSG, n.line);
        }
        return;
      case 'rfor': return this.execRFor(n, env);
      case 'switch': {
        const x = this.toNum(this.evalExpr(n.e, env), n.line), e = new Env(env);
        let start = -1;
        for (let i = 0; i < n.cases.length; i++) {
          const c = n.cases[i];
          if (c.val && this.toNum(this.evalExpr(c.val, e), n.line) === x) { start = i; break; }
        }
        if (start < 0) start = n.cases.findIndex(c => !c.val);
        if (start < 0) return;
        for (let i = start; i < n.cases.length; i++) {
          for (const s of n.cases[i].body) {
            const r = this.exec(s, e);
            if (r) { if (r === BREAK) return; return r; }
          }
        }
        return;
      }
    }
    throw ce('неизвестная инструкция', n.line);
  }
  execRFor(n, env) {
    const src = isLvalueNode(n.iter) ? this.evalLV(n.iter, env) : { val: this.evalExpr(n.iter, env) };
    const cont = src.val;
    if (cont.t !== 'vec' && cont.t !== 'str') throw ce('цикл for (x : ...) работает только с массивом, vector или string', n.line);
    const isStr = cont.t === 'str';
    const arr = isStr ? null : cont.v, s = isStr ? cont.v : null;
    const len = () => isStr ? s.length : arr.length;
    for (let i = 0; i < len(); i++) {
      const e = new Env(env); let cell;
      if (isStr) {
        const val = this.coerce(n.type.k === 'auto' ? { k: 'char' } : n.type, mkC(s.charCodeAt(i)), n.line);
        cell = { val, type: n.type.k === 'auto' ? { k: 'char' } : n.type };
      } else if (n.type.ref) {
        const idx = i;
        cell = { get val() { return arr[idx]; }, set val(x) { arr[idx] = x; }, type: n.type.k === 'auto' ? cont.et : n.type };
      } else {
        const val = this.coerce(n.type, arr[i], n.line);
        cell = { val, type: n.type.k === 'auto' ? typeFromValue(val) : n.type };
      }
      e.vars.set(n.name, cell);
      const r = this.exec(n.body, e);
      if (r) { if (r === BREAK) break; if (r !== CONTINUE) return r; }
      if (++this.steps > this.maxSteps) throw re('Программа выполняется слишком долго — похоже на бесконечный цикл', n.line);
    }
  }
  execDecl(n, env) {
    for (const it of n.items) {
      const type = n.type;
      if (type.ref) {
        if (!it.init) throw ce(`ссылка '${it.name}' должна сразу получить значение`, it.line);
        if (isLvalueNode(it.init)) env.vars.set(it.name, this.evalLV(it.init, env));
        else {
          const v = this.evalExpr(it.init, env);
          env.vars.set(it.name, { val: this.coerce(type, v, it.line), type: type.k === 'auto' ? null : type });
        }
        continue;
      }
      if (it.dims.length) {
        const sizes = it.dims.map(d => d ? this.toInt(this.evalExpr(d, env), it.line) : null);
        let t = type; for (let k = sizes.length - 1; k >= 0; k--) t = { k: 'vec', elem: t, arr: true };
        let val;
        if (it.init && it.init.k === 'init') val = this.arrFromInit(t, sizes, 0, it.init, env, it.line);
        else {
          if (sizes[0] === null) throw ce(`у массива '${it.name}' не указан размер`, it.line);
          val = this.makeArr(t, sizes, 0, it.line);
        }
        env.vars.set(it.name, { val, type: t });
        continue;
      }
      let v;
      if (it.init) {
        v = this.evalExpr(it.init, env);
        if (it.init.k === 'init' && type.k !== 'vec' && type.k !== 'struct' && type.k !== 'auto') {
          v = v.v.length ? v.v[0] : this.defaultValue(type, it.line);
        }
      } else if (it.ctor) v = this.construct(type, it.ctor.map(a => this.evalExpr(a, env)), it.line);
      else {
        if (type.k === 'auto') throw ce(`у переменной '${it.name}' типа auto должно быть начальное значение`, it.line);
        v = this.defaultValue(type, it.line);
      }
      const t = type.k === 'auto' ? typeFromValue(v) : type;
      env.vars.set(it.name, { val: this.coerce(t, v, it.line), type: t });
    }
  }

  /* ---------- lvalue ---------- */
  checkIdx(i, len, line) {
    if (!Number.isInteger(i) || i < 0 || i >= len) throw re(`индекс ${i} выходит за границы (размер ${len})`, line);
  }
  undeclared(n) { return ce(`'${n.name}' не объявлено в этой области видимости`, n.line); }
  evalLV(n, env) {
    switch (n.k) {
      case 'id': { const c = env.lookup(n.name); if (!c) throw this.undeclared(n); return c; }
      case 'index': {
        const bc = isLvalueNode(n.base) ? this.evalLV(n.base, env) : { val: this.evalExpr(n.base, env) };
        const cont = bc.val, idx = this.toNum(this.evalExpr(n.idx, env), n.line);
        if (cont.t === 'vec') {
          const arr = cont.v; this.checkIdx(idx, arr.length, n.line);
          return { get val() { return arr[idx]; }, set val(x) { arr[idx] = x; }, type: cont.et || null };
        }
        if (cont.t === 'str') {
          this.checkIdx(idx, cont.v.length, n.line);
          return {
            get val() { return mkC(bc.val.v.charCodeAt(idx)); },
            set val(x) { const s = bc.val.v; bc.val = mkS(s.slice(0, idx) + String.fromCharCode(x.v) + s.slice(idx + 1)); },
            type: { k: 'char' }
          };
        }
        throw ce('оператор [] можно применять только к массиву, vector или string', n.line);
      }
      case 'member': {
        const bc = isLvalueNode(n.base) ? this.evalLV(n.base, env) : { val: this.evalExpr(n.base, env) };
        const obj = bc.val;
        if (obj.t !== 'struct') throw ce('точка применима только к struct', n.line);
        const def = this.prog.structs[obj.name], name = n.name;
        if (!(name in def.ftype)) throw ce(`у struct ${obj.name} нет поля '${name}'`, n.line);
        return { get val() { return obj.f[name]; }, set val(x) { obj.f[name] = x; }, type: def.ftype[name] };
      }
      case 'un':
        if (n.op === '*') {
          const it = this.evalExpr(n.e, env);
          if (it.t !== 'it') throw ce('* применимо только к итератору', n.line);
          return this.iterCell(it, n.line);
        }
        break;
      case 'mcall':
        if (n.name === 'back' || n.name === 'front' || n.name === 'at') {
          const oc = isLvalueNode(n.obj) ? this.evalLV(n.obj, env) : { val: this.evalExpr(n.obj, env) };
          const cont = oc.val;
          if (cont.t === 'vec') {
            const arr = cont.v;
            let idx = n.name === 'at' ? this.toInt(this.evalExpr(n.args[0], env), n.line) : (n.name === 'front' ? 0 : arr.length - 1);
            this.checkIdx(idx, arr.length, n.line);
            return { get val() { return arr[idx]; }, set val(x) { arr[idx] = x; }, type: cont.et || null };
          }
        }
        break;
    }
    return { val: this.evalExpr(n, env), type: null };
  }
  iterCell(it, line) {
    if (it.arr) {
      const arr = it.arr, i = it.i; this.checkIdx(i, arr.length, line);
      return { get val() { return arr[i]; }, set val(x) { arr[i] = x; }, type: null };
    }
    const c = it.cell, i = it.i; this.checkIdx(i, c.val.v.length, line);
    return {
      get val() { return mkC(c.val.v.charCodeAt(i)); },
      set val(x) { const s = c.val.v; c.val = mkS(s.slice(0, i) + String.fromCharCode(x.v) + s.slice(i + 1)); }, type: { k: 'char' }
    };
  }

  /* ---------- выражения ---------- */
  evalExpr(n, env) {
    switch (n.k) {
      case 'val': return n.val;
      case 'id': { const c = env.lookup(n.name); return c ? c.val : this.builtinConst(n); }
      case 'bin': return this.evBin(n, env);
      case 'logic': return this.evLogic(n, env);
      case 'un': return this.unop(n, env);
      case 'cond': return this.toBool(this.evalExpr(n.c, env), n.line) ? this.evalExpr(n.a, env) : this.evalExpr(n.b, env);
      case 'index': return this.evIndex(n, env);
      case 'member': return this.evMember(n, env);
      case 'assign': return this.evAssign(n, env);
      case 'incdec': return this.evIncDec(n, env);
      case 'call': return this.evalCall(n, env);
      case 'mcall': return this.evalMethod(n, env);
      default: return this.evOther(n, env);
    }
  }
  evBin(n, env) {
    const a = this.evalExpr(n.l, env);
    if (a.t === 'stream') {
      if (n.op === '<<') return this.streamOut(a, n.r, env, n.line);
      if (n.op === '>>') return this.streamIn(a, n.r, env, n.line);
    }
    return this.binop(n.op, a, this.evalExpr(n.r, env), n.line);
  }
  evLogic(n, env) {
    const a = this.toBool(this.evalExpr(n.l, env), n.line);
    if (n.op === '&&') return mkBool(a && this.toBool(this.evalExpr(n.r, env), n.line));
    return mkBool(a || this.toBool(this.evalExpr(n.r, env), n.line));
  }
  evIndex(n, env) {
    const b = this.evalExpr(n.base, env), i = this.toNum(this.evalExpr(n.idx, env), n.line);
    if (b.t === 'vec') { this.checkIdx(i, b.v.length, n.line); return b.v[i]; }
    if (b.t === 'str') { this.checkIdx(i, b.v.length, n.line); return mkC(b.v.charCodeAt(i)); }
    throw ce('оператор [] можно применять только к массиву, vector или string', n.line);
  }
  evMember(n, env) {
    const b = this.evalExpr(n.base, env);
    if (b.t !== 'struct') throw ce('точка применима только к struct', n.line);
    const def = this.prog.structs[b.name];
    if (!(n.name in def.ftype)) throw ce(`у struct ${b.name} нет поля '${n.name}'`, n.line);
    return b.f[n.name];
  }
  evAssign(n, env) {
    const rv = this.evalExpr(n.r, env);
    const cell = this.evalLV(n.l, env);
    const t = this.cellType(cell);
    if (cell.type && cell.type.cst) throw ce('нельзя изменить константу (const)', n.line);
    if (n.op === '=') { cell.val = this.coerce(t, rv, n.line); return cell.val; }
    const op = n.op.slice(0, -1), cur = cell.val;
    if (cur.t === 'it') { cell.val = this.binop(op, cur, rv, n.line); return cell.val; }
    cell.val = this.coerce(t, this.binop(op, cur, rv, n.line), n.line);
    return cell.val;
  }
  evIncDec(n, env) {
    const cell = this.evalLV(n.e, env), old = cell.val;
    if (cell.type && cell.type.cst) throw ce('нельзя изменить константу (const)', n.line);
    let nv;
    if (old.t === 'it') nv = { t: 'it', arr: old.arr, cell: old.cell, i: old.i + n.d };
    else nv = this.coerce(typeFromValue(old), mkD(this.toNum(old, n.line) + n.d), n.line);
    cell.val = nv;
    return n.post ? old : nv;
  }
  evOther(n, env) {
    switch (n.k) {
      case 'construct': {
        if (n.init) {
          const l = this.evalExpr(n.init, env);
          return this.construct(n.type, n.type.k === 'vec' ? [l] : l.v, n.line);
        }
        return this.construct(n.type, n.args.map(a => this.evalExpr(a, env)), n.line);
      }
      case 'cast': return this.coerce(n.type, this.evalExpr(n.e, env), n.line);
      case 'init': return { t: 'vec', v: n.items.map(x => this.evalExpr(x, env)), et: null };
      case 'lambda': return { t: 'fn', def: { name: 'lambda', params: n.params, body: n.body, ret: null, line: n.line }, env };
      case 'cmpobj': {
        const g = n.name === 'greater';
        return { t: 'fn', native: (a, b) => mkBool(g ? this.lessVal(b, a) : this.lessVal(a, b)) };
      }
    }
    throw ce('неизвестное выражение', n.line);
  }
  builtinConst(n) {
    switch (n.name) {
      case 'cout': case 'cerr': case 'clog': return { t: 'stream', id: n.name === 'cout' ? 'cout' : 'cerr' };
      case 'cin': return { t: 'stream', id: 'cin' };
      case 'endl': case 'flush': case 'fixed': case 'scientific': case 'defaultfloat': case 'left': case 'right': case 'boolalpha': case 'noboolalpha': case 'ws':
        return { t: 'manip', name: n.name };
      case 'INT_MAX': return mkI(2147483647); case 'INT_MIN': return mkI(-2147483648);
      case 'LLONG_MAX': return mkL(9223372036854775807); case 'LLONG_MIN': return mkL(-9223372036854775808);
      case 'UINT_MAX': return mkL(4294967295);
      case 'DBL_MAX': return mkD(Number.MAX_VALUE); case 'DBL_MIN': return mkD(2.2250738585072014e-308);
      case 'M_PI': return mkD(Math.PI); case 'M_E': return mkD(Math.E);
      case 'RAND_MAX': return mkI(2147483647);
      case 'nullptr': case 'NULL': return mkI(0);
      case 'string::npos': return mkL(-1);
    }
    throw this.undeclared(n);
  }
  strOf(v, line) {
    if (v.t === 'str') return v.v;
    if (v.t === 'char') return String.fromCharCode(v.v);
    throw ce('нельзя склеить строку с числом — преобразуйте число через to_string()', line);
  }
  lessVal(a, b) {
    if (a.t === 'str' && b.t === 'str') return a.v < b.v;
    if (NUM[a.t] && NUM[b.t]) return +a.v < +b.v;
    throw ce('эти значения нельзя сравнивать', 0);
  }
  unop(n, env) {
    const v = this.evalExpr(n.e, env);
    switch (n.op) {
      case '!': return mkBool(!this.toBool(v, n.line));
      case '-': {
        const x = this.toNum(v, n.line);
        if (v.t === 'double') return mkD(-x);
        return v.t === 'll' ? mkL(-x + 0) : mkI(-x);
      }
      case '+': { const x = this.toNum(v, n.line); return v.t === 'double' ? v : (v.t === 'll' ? v : mkI(x)); }
      case '~': return v.t === 'll' ? mkL(-this.toNum(v, n.line) - 1) : mkI(~this.toNum(v, n.line));
      case '*':
        if (v.t === 'it') return this.iterCell(v, n.line).val;
        throw ce('* применимо только к итератору', n.line);
    }
  }
  binop(op, a, b, line) {
    const ta = a.t, tb = b.t;
    if (ta === 'str' || tb === 'str') {
      if (ta === 'str' && tb === 'str') {
        switch (op) {
          case '+': return mkS(a.v + b.v);
          case '==': return mkBool(a.v === b.v); case '!=': return mkBool(a.v !== b.v);
          case '<': return mkBool(a.v < b.v); case '>': return mkBool(a.v > b.v);
          case '<=': return mkBool(a.v <= b.v); case '>=': return mkBool(a.v >= b.v);
        }
      } else if (op === '+') return mkS(this.strOf(a, line) + this.strOf(b, line));
      throw ce(`оператор '${op}' нельзя применить к строке и значению другого типа`, line);
    }
    if (ta === 'it' || tb === 'it' || (ta === 'vec' && (op === '+' || op === '-'))) return this.iterOp(op, a, b, line);
    if (!NUM[ta] || !NUM[tb]) {
      if (op === '==' || op === '!=') throw ce('эти значения нельзя сравнивать через ' + op, line);
      throw ce(`оператор '${op}' нельзя применить к типам ${this.tname(a)} и ${this.tname(b)}`, line);
    }
    const x = +a.v, y = +b.v;
    switch (op) {
      case '==': return mkBool(x === y); case '!=': return mkBool(x !== y);
      case '<': return mkBool(x < y); case '>': return mkBool(x > y);
      case '<=': return mkBool(x <= y); case '>=': return mkBool(x >= y);
    }
    const dbl = ta === 'double' || tb === 'double';
    const ll = ta === 'll' || tb === 'll';
    if (dbl) {
      switch (op) {
        case '+': return mkD(x + y); case '-': return mkD(x - y);
        case '*': return mkD(x * y); case '/': return mkD(x / y);
        case '%': throw ce("оператор % не работает с дробными числами (используйте fmod)", line);
      }
      throw ce(`оператор '${op}' не работает с дробными числами`, line);
    }
    let r;
    switch (op) {
      case '+': r = x + y; break;
      case '-': r = x - y; break;
      case '*':
        if (ll) { r = x * y; if (!Number.isSafeInteger(r)) r = Number(BigInt.asIntN(64, BigInt(x) * BigInt(y))); }
        else r = Math.imul(x, y);
        break;
      case '/': if (y === 0) throw re('деление на ноль', line); r = Math.trunc(x / y); break;
      case '%': if (y === 0) throw re('остаток от деления на ноль', line); r = x % y; break;
      case '&': case '|': case '^': case '<<': case '>>': return this.bitop(op, x, y, ll);
      default: throw ce(`неизвестный оператор '${op}'`, line);
    }
    return ll ? mkL(r + 0) : mkI(r);
  }
  bitop(op, x, y, ll) {
    if (!ll) {
      switch (op) { case '&': return mkI(x & y); case '|': return mkI(x | y); case '^': return mkI(x ^ y); case '<<': return mkI(x << y); default: return mkI(x >> y); }
    }
    const X = BigInt(x), Y = BigInt(y); let r;
    switch (op) { case '&': r = X & Y; break; case '|': r = X | Y; break; case '^': r = X ^ Y; break; case '<<': r = X << Y; break; default: r = X >> Y; }
    return mkL(Number(BigInt.asIntN(64, r)));
  }
  iterOp(op, a, b, line) {
    const toIt = v => v.t === 'vec' ? { t: 'it', arr: v.v, cell: null, i: 0 } : v;
    a = toIt(a); b = toIt(b);
    if (a.t === 'it' && b.t === 'it') {
      switch (op) {
        case '-': return mkL(a.i - b.i);
        case '==': return mkBool(a.i === b.i); case '!=': return mkBool(a.i !== b.i);
        case '<': return mkBool(a.i < b.i); case '>': return mkBool(a.i > b.i);
        case '<=': return mkBool(a.i <= b.i); case '>=': return mkBool(a.i >= b.i);
      }
    } else if (a.t === 'it' && NUM[b.t]) {
      if (op === '+') return { t: 'it', arr: a.arr, cell: a.cell, i: a.i + this.toInt(b, line) };
      if (op === '-') return { t: 'it', arr: a.arr, cell: a.cell, i: a.i - this.toInt(b, line) };
    } else if (NUM[a.t] && b.t === 'it' && op === '+') return { t: 'it', arr: b.arr, cell: b.cell, i: b.i + this.toInt(a, line) };
    throw ce(`оператор '${op}' нельзя применить к этим значениям`, line);
  }

  /* ---------- вызовы функций ---------- */
  evalCall(n, env) {
    const defs = this.prog.funcs[n.name];
    if (defs) {
      const def = defs.length === 1 ? defs[0] : this.pickOverload(defs, n, env);
      return this.callDef(def, this.bindArgs(def, n.args, env, n.line, n.name), this.global, n.line);
    }
    const c = env.lookup(n.name);
    if (c && c.val.t === 'fn') {
      const f = c.val;
      if (f.native) return f.native.apply(null, n.args.map(a => this.evalExpr(a, env)));
      return this.callDef(f.def, this.bindArgs(f.def, n.args, env, n.line, n.name), f.env, n.line);
    }
    if (c) throw ce(`'${n.name}' — не функция`, n.line);
    return this.builtin(n.name, n, env);
  }
  pickOverload(defs, n, env) {
    const argc = n.args.length;
    const cands = defs.filter(d => argc <= d.params.length && argc >= d.params.filter(p => !p.def).length);
    if (!cands.length) throw ce(`нет версии функции '${n.name}' с ${argc} аргументами`, n.line);
    if (cands.length === 1) return cands[0];
    const vals = n.args.map(a => this.evalExpr(a, env));
    let best = null, bs = -1;
    for (const d of cands) {
      let s = 0, ok = true;
      for (let i = 0; i < argc; i++) {
        const k = d.params[i].type.k, t = vals[i].t;
        if (k === t || (k === 'struct' && t === 'struct')) s += 3;
        else if (NUM[t] && (k === 'int' || k === 'll' || k === 'double' || k === 'float' || k === 'bool' || k === 'char')) s += ((k === 'double' || k === 'float') !== (t === 'double')) ? 1 : 2;
        else if (k === 'auto') s += 1;
        else { ok = false; break; }
      }
      if (ok && s > bs) { bs = s; best = d; }
    }
    if (!best) throw ce(`ни одна версия функции '${n.name}' не подходит к таким аргументам`, n.line);
    return best;
  }
  bindArgs(def, nodes, env, line, name) {
    const ps = def.params, cells = [];
    if (nodes.length > ps.length) throw ce(`слишком много аргументов в вызове '${name}' (ожидается ${ps.length})`, line);
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i], an = nodes[i];
      if (!an) {
        if (p.def) { cells.push({ val: this.coerce(p.type, this.evalExpr(p.def, this.global), line), type: p.type }); continue; }
        throw ce(`слишком мало аргументов в вызове '${name}' (ожидается ${ps.length})`, line);
      }
      if (p.type.ref && isLvalueNode(an)) cells.push(this.evalLV(an, env));
      else cells.push({ val: this.coerce(p.type, this.evalExpr(an, env), line), type: p.type.k === 'auto' ? null : p.type });
    }
    return cells;
  }
  callDef(def, cells, closure, line) {
    if (++this.depth > 3000) { this.depth--; throw re('Переполнение стека: слишком глубокая рекурсия (функция вызывает себя без остановки?)', line); }
    const env = new Env(closure || this.global);
    for (let i = 0; i < def.params.length; i++) if (def.params[i].name) env.vars.set(def.params[i].name, cells[i]);
    let r;
    try { r = this.exec(def.body, env); } finally { this.depth--; }
    const val = r && r.k === 'return' ? r.v : null;
    if (!def.ret) return val || VOID;
    if (def.ret.k === 'void') return VOID;
    if (val === null || val.t === 'void') {
      if (def.name === 'main') return mkI(0);
      return this.defaultValue(def.ret, line);
    }
    return this.coerce(def.ret, val, line);
  }
  callFnValue(f, vals, line) {
    if (f.native) return f.native.apply(null, vals);
    return this.callDef(f.def, vals.map(v => ({ val: v, type: null })), f.env, line);
  }

  /* ---------- методы ---------- */
  evalMethod(n, env) {
    let cell, obj;
    if (isLvalueNode(n.obj)) { cell = this.evalLV(n.obj, env); obj = cell.val; }
    else { obj = this.evalExpr(n.obj, env); cell = { val: obj, type: null }; }
    const args = n.args.map(a => this.evalExpr(a, env));
    switch (obj.t) {
      case 'str': return this.strMethod(cell, n.name, args, n.line);
      case 'vec': return this.vecMethod(obj, n.name, args, n.line);
      case 'stream': return this.streamMethod(obj, n.name, args, n.line);
    }
    throw ce(`у значения типа ${this.tname(obj)} нет метода '${n.name}'`, n.line);
  }
  streamMethod(s, name, args, line) {
    switch (name) {
      case 'ignore': {
        const cnt = args.length ? this.toInt(args[0], line) : 1, dl = args.length > 1 ? +args[1].v : -1;
        let c = 0;
        while (this.ip < this.inp.length && c < cnt) { const ch = this.inp.charCodeAt(this.ip++); c++; if (ch === dl) break; }
        return s;
      }
      case 'get': if (this.ip >= this.inp.length) { this.cinFail = true; return mkI(-1); } return mkC(this.inp.charCodeAt(this.ip++));
      case 'peek': return this.ip >= this.inp.length ? mkI(-1) : mkC(this.inp.charCodeAt(this.ip));
      case 'fail': return mkBool(this.cinFail);
      case 'eof': return mkBool(this.ip >= this.inp.length && this.cinFail);
      case 'clear': this.cinFail = false; return VOID;
      case 'tie': case 'flush': case 'sync_with_stdio': return VOID;
      case 'precision': this.st.prec = this.toInt(args[0], line); return VOID;
    }
    throw ce(`у потока нет метода '${name}'`, line);
  }
  strMethod(cell, name, args, line) {
    const s = cell.val.v, num = i => this.toInt(args[i], line);
    switch (name) {
      case 'size': case 'length': return mkL(s.length);
      case 'empty': return mkBool(s.length === 0);
      case 'substr': {
        const pos = args.length ? num(0) : 0;
        if (pos < 0 || pos > s.length) throw re(`substr: позиция ${pos} вне строки (длина ${s.length})`, line);
        const len = args.length > 1 ? num(1) : s.length - pos;
        return mkS(s.substr(pos, Math.max(0, len)));
      }
      case 'find': return mkL(s.indexOf(this.strOf(args[0], line), args.length > 1 ? num(1) : 0));
      case 'rfind': return mkL(s.lastIndexOf(this.strOf(args[0], line)));
      case 'push_back': cell.val = mkS(s + this.strOf(args[0], line)); return VOID;
      case 'append': cell.val = mkS(s + this.strOf(args[0], line)); return VOID;
      case 'pop_back': if (!s.length) throw re('pop_back для пустой строки', line); cell.val = mkS(s.slice(0, -1)); return VOID;
      case 'clear': cell.val = mkS(''); return VOID;
      case 'back': if (!s.length) throw re('back() для пустой строки', line); return mkC(s.charCodeAt(s.length - 1));
      case 'front': if (!s.length) throw re('front() для пустой строки', line); return mkC(s.charCodeAt(0));
      case 'at': this.checkIdx(num(0), s.length, line); return mkC(s.charCodeAt(num(0)));
      case 'c_str': case 'data': return cell.val;
      case 'insert': { const pos = num(0); if (pos < 0 || pos > s.length) throw re('insert: позиция вне строки', line); cell.val = mkS(s.slice(0, pos) + this.strOf(args[1], line) + s.slice(pos)); return VOID; }
      case 'erase': { const pos = num(0); if (pos < 0 || pos > s.length) throw re('erase: позиция вне строки', line); const len = args.length > 1 ? num(1) : s.length; cell.val = mkS(s.slice(0, pos) + s.slice(pos + len)); return VOID; }
      case 'replace': { const pos = num(0), len = num(1); cell.val = mkS(s.slice(0, pos) + this.strOf(args[2], line) + s.slice(pos + len)); return VOID; }
      case 'compare': { const o = this.strOf(args[0], line); return mkI(s < o ? -1 : s > o ? 1 : 0); }
      case 'begin': return { t: 'it', arr: null, cell, i: 0 };
      case 'end': return { t: 'it', arr: null, cell, i: s.length };
    }
    throw ce(`у string нет метода '${name}'`, line);
  }
  vecMethod(obj, name, args, line) {
    const arr = obj.v, et = obj.et, num = i => this.toInt(args[i], line);
    const conv = x => et ? this.coerce(et, x, line) : copyVal(x);
    switch (name) {
      case 'size': case 'capacity': return mkL(arr.length);
      case 'empty': return mkBool(arr.length === 0);
      case 'push_back': arr.push(conv(args[0])); return VOID;
      case 'emplace_back':
        if (et && et.k === 'struct' && args.length !== 1) arr.push(this.structFromList(et.name, args, line));
        else arr.push(conv(args[0]));
        return VOID;
      case 'pop_back': if (!arr.length) throw re('pop_back для пустого vector', line); arr.pop(); return VOID;
      case 'back': if (!arr.length) throw re('back() для пустого vector', line); return arr[arr.length - 1];
      case 'front': if (!arr.length) throw re('front() для пустого vector', line); return arr[0];
      case 'at': this.checkIdx(num(0), arr.length, line); return arr[num(0)];
      case 'clear': arr.length = 0; return VOID;
      case 'reserve': case 'shrink_to_fit': return VOID;
      case 'resize': {
        const n = num(0);
        if (!(n >= 0) || n > 5000000) throw re('недопустимый размер vector: ' + n, line);
        if (n < arr.length) arr.length = n;
        else while (arr.length < n) arr.push(args.length > 1 ? conv(args[1]) : (et ? this.defaultValue(et, line) : mkI(0)));
        return VOID;
      }
      case 'assign': {
        const n = num(0); arr.length = 0;
        for (let i = 0; i < n; i++) arr.push(conv(args[1]));
        return VOID;
      }
      case 'begin': return { t: 'it', arr, cell: null, i: 0 };
      case 'end': return { t: 'it', arr, cell: null, i: arr.length };
      case 'insert': {
        const it = args[0]; if (it.t !== 'it') throw ce('insert ожидает итератор первым аргументом (например v.begin() + 1)', line);
        arr.splice(it.i, 0, conv(args[1])); return VOID;
      }
      case 'erase': {
        const it = args[0]; if (it.t !== 'it') throw ce('erase ожидает итератор (например v.begin() + 1)', line);
        if (it.i < 0 || it.i >= arr.length) throw re('erase: итератор вне vector', line);
        if (args.length > 1) arr.splice(it.i, args[1].i - it.i); else arr.splice(it.i, 1);
        return VOID;
      }
      case 'swap': {
        const o = args[0]; if (o.t !== 'vec') throw ce('swap ожидает vector', line);
        const tv = obj.v; obj.v = o.v; o.v = tv; return VOID;
      }
    }
    throw ce(`у vector нет метода '${name}'`, line);
  }

  /* ---------- диапазоны для <algorithm> ---------- */
  toIter(v, line) {
    if (v.t === 'it') return v;
    if (v.t === 'vec') return { t: 'it', arr: v.v, cell: null, i: 0 };
    throw ce('ожидался итератор (v.begin(), v.end()) или массив', line);
  }
  getRange(f, l) {
    if (f.arr) return f.arr.slice(f.i, l.i);
    const s = f.cell.val.v; return s.slice(f.i, l.i).split('').map(ch => mkC(ch.charCodeAt(0)));
  }
  setRange(f, l, items) {
    if (f.arr) { for (let k = 0; k < items.length; k++) f.arr[f.i + k] = items[k]; }
    else { const s = f.cell.val.v; f.cell.val = mkS(s.slice(0, f.i) + items.map(c => String.fromCharCode(c.v)).join('') + s.slice(l.i)); }
  }

  /* ---------- встроенные функции ---------- */
  builtin(name, n, env) {
    const line = n.line, A = n.args;
    const ev = i => { if (!A[i]) throw ce(`слишком мало аргументов для '${name}'`, line); return this.evalExpr(A[i], env); };
    const num = i => this.toNum(ev(i), line);
    const D = x => mkD(x);
    switch (name) {
      case 'sqrt': { const x = num(0); return D(Math.sqrt(x)); }
      case 'cbrt': return D(Math.cbrt(num(0)));
      case 'pow': return D(Math.pow(num(0), num(1)));
      case 'abs': { const v = ev(0), x = this.toNum(v, line); return v.t === 'double' ? D(Math.abs(x)) : (v.t === 'll' ? mkL(Math.abs(x)) : mkI(Math.abs(x))); }
      case 'fabs': return D(Math.abs(num(0)));
      case 'floor': return D(Math.floor(num(0)));
      case 'ceil': return D(Math.ceil(num(0)));
      case 'round': { const x = num(0); return D(Math.sign(x) * Math.round(Math.abs(x))); }
      case 'trunc': return D(Math.trunc(num(0)));
      case 'sin': return D(Math.sin(num(0))); case 'cos': return D(Math.cos(num(0))); case 'tan': return D(Math.tan(num(0)));
      case 'asin': return D(Math.asin(num(0))); case 'acos': return D(Math.acos(num(0))); case 'atan': return D(Math.atan(num(0)));
      case 'atan2': return D(Math.atan2(num(0), num(1)));
      case 'exp': return D(Math.exp(num(0))); case 'log': return D(Math.log(num(0)));
      case 'log2': return D(Math.log2(num(0))); case 'log10': return D(Math.log10(num(0)));
      case 'hypot': return D(Math.hypot(num(0), num(1)));
      case 'fmod': return D(num(0) % num(1));
      case 'fmax': return D(Math.max(num(0), num(1))); case 'fmin': return D(Math.min(num(0), num(1)));
      case 'min': case 'max': {
        let vals;
        if (A.length === 1) { const l = ev(0); if (l.t !== 'vec') throw ce(`${name} ожидает два значения`, line); vals = l.v; }
        else vals = [ev(0), ev(1)];
        let best = vals[0];
        for (let i = 1; i < vals.length; i++) {
          const v = vals[i];
          if (name === 'min' ? this.lessVal(v, best) : this.lessVal(best, v)) best = v;
        }
        if (vals.some(v => v.t === 'double') && NUM[best.t]) return D(+best.v);
        if (vals.some(v => v.t === 'll') && NUM[best.t] && best.t !== 'double') return mkL(+best.v);
        return best;
      }
      case 'gcd': case '__gcd': { let a = Math.abs(this.toInt(ev(0), line)), b = Math.abs(this.toInt(ev(1), line)); while (b) { const t = a % b; a = b; b = t; } return mkL(a); }
      case 'lcm': { let a = Math.abs(this.toInt(ev(0), line)), b = Math.abs(this.toInt(ev(1), line)), x = a, y = b; while (y) { const t = x % y; x = y; y = t; } return mkL(x ? a / x * b : 0); }
      case 'to_string': {
        const v = ev(0);
        if (v.t === 'double') return mkS(v.v.toFixed(6));
        if (v.t === 'char') return mkS(String(v.v));
        return mkS(String(+v.v));
      }
      case 'stoi': case 'stol': case 'stoll': {
        const s = this.strOf(ev(0), line), m = /^\s*[+-]?\d+/.exec(s);
        if (!m) throw re('stoi: строка "' + s + '" не является числом', line);
        return name === 'stoi' ? mkI(parseInt(m[0], 10)) : mkL(parseInt(m[0], 10));
      }
      case 'stod': case 'stof': {
        const s = this.strOf(ev(0), line), m = /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s);
        if (!m) throw re('stod: строка "' + s + '" не является числом', line);
        return D(parseFloat(m[0]));
      }
      case 'isdigit': { const c = num(0); return mkI(c >= 48 && c <= 57 ? 1 : 0); }
      case 'isalpha': { const c = num(0); return mkI((c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0); }
      case 'isalnum': { const c = num(0); return mkI((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0); }
      case 'isupper': { const c = num(0); return mkI(c >= 65 && c <= 90 ? 1 : 0); }
      case 'islower': { const c = num(0); return mkI(c >= 97 && c <= 122 ? 1 : 0); }
      case 'isspace': { const c = num(0); return mkI(c === 32 || (c >= 9 && c <= 13) ? 1 : 0); }
      case 'ispunct': { const c = num(0); return mkI(c > 32 && c < 127 && !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122)) ? 1 : 0); }
      case 'toupper': { const c = num(0); return mkI(c >= 97 && c <= 122 ? c - 32 : c); }
      case 'tolower': { const c = num(0); return mkI(c >= 65 && c <= 90 ? c + 32 : c); }
      case 'swap': {
        const a = this.evalLV(A[0], env), b = this.evalLV(A[1], env);
        const t = a.val; a.val = b.val; b.val = t; return VOID;
      }
      case 'getline': {
        const cell = this.evalLV(A[1], env);
        if (this.ip >= this.inp.length) { this.cinFail = true; return { t: 'stream', id: 'cin' }; }
        const j = this.inp.indexOf('\n', this.ip); let ln;
        if (j < 0) { ln = this.inp.slice(this.ip); this.ip = this.inp.length; } else { ln = this.inp.slice(this.ip, j); this.ip = j + 1; }
        cell.val = mkS(ln.replace(/\r$/, '')); return { t: 'stream', id: 'cin' };
      }
      case 'setprecision': return { t: 'manip', name, arg: this.toInt(ev(0), line) };
      case 'setw': return { t: 'manip', name, arg: this.toInt(ev(0), line) };
      case 'setfill': return { t: 'manip', name, arg: num(0) };
      case 'rand': this.rng = (Math.imul(this.rng, 1103515245) + 12345) & 0x7fffffff; return mkI(this.rng);
      case 'srand': this.rng = this.toInt(ev(0), line) & 0x7fffffff; return VOID;
      case 'time': return mkL(Math.floor(Date.now() / 1000));
      case 'exit': throw new ExitSignal(A.length ? this.toInt(ev(0), line) : 0);
      case 'system': case 'ios_base::sync_with_stdio': case 'ios::sync_with_stdio': return mkI(0);
      case 'puts': this.write(this.strOf(ev(0), line) + '\n', line); return mkI(0);
      case 'putchar': this.write(String.fromCharCode(num(0)), line); return mkI(0);
      case 'printf': return this.printf(A.map((a, i) => ev(i)), line);
      case 'sort': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line);
        const items = this.getRange(f, l);
        if (A.length > 2) {
          const fn = ev(2);
          if (fn.t !== 'fn') throw ce('третий аргумент sort должен быть функцией сравнения', line);
          const less = (x, y) => this.toBool(this.callFnValue(fn, [x, y], line), line);
          items.sort((x, y) => less(x, y) ? -1 : (less(y, x) ? 1 : 0));
        } else items.sort((x, y) => this.lessVal(x, y) ? -1 : (this.lessVal(y, x) ? 1 : 0));
        this.setRange(f, l, items); return VOID;
      }
      case 'reverse': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line);
        this.setRange(f, l, this.getRange(f, l).reverse()); return VOID;
      }
      case 'max_element': case 'min_element': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line), items = this.getRange(f, l);
        if (!items.length) return l;
        let bi = 0;
        for (let i = 1; i < items.length; i++) {
          if (name === 'max_element' ? this.lessVal(items[bi], items[i]) : this.lessVal(items[i], items[bi])) bi = i;
        }
        return { t: 'it', arr: f.arr, cell: f.cell, i: f.i + bi };
      }
      case 'accumulate': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line);
        let acc = ev(2); const t = typeFromValue(acc);
        for (const x of this.getRange(f, l)) acc = this.coerce(t, this.binop('+', acc, x, line), line);
        return acc;
      }
      case 'count': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line), v = ev(2); let c = 0;
        for (const x of this.getRange(f, l)) if (this.binop('==', x, v, line).v) c++;
        return mkL(c);
      }
      case 'fill': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line), v = ev(2);
        const items = this.getRange(f, l).map(() => v); this.setRange(f, l, items); return VOID;
      }
      case 'find': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line), v = ev(2), items = this.getRange(f, l);
        for (let i = 0; i < items.length; i++) if (this.binop('==', items[i], v, line).v) return { t: 'it', arr: f.arr, cell: f.cell, i: f.i + i };
        return l;
      }
      case 'binary_search': case 'lower_bound': case 'upper_bound': {
        const f = this.toIter(ev(0), line), l = this.toIter(ev(1), line), v = ev(2), items = this.getRange(f, l);
        let lo = 0, hi = items.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (name === 'upper_bound' ? !this.lessVal(v, items[mid]) : this.lessVal(items[mid], v)) lo = mid + 1; else hi = mid;
        }
        if (name === 'binary_search') return mkBool(lo < items.length && !this.lessVal(v, items[lo]));
        return { t: 'it', arr: f.arr, cell: f.cell, i: f.i + lo };
      }
    }
    throw ce(`функция '${name}' не объявлена (или пока не поддерживается)`, line);
  }
  printf(args, line) {
    const fmt = this.strOf(args[0], line); let ai = 1;
    const out = fmt.replace(/%([-+ 0#]*)(\d+)?(?:\.(\d+))?(hh|h|ll|l|z)?([diuxXfFeEgGcsp%])/g, (all, flags, width, prec, len, conv) => {
      if (conv === '%') return '%';
      const a = args[ai++]; if (!a) throw re('printf: не хватает аргументов для формата', line);
      let s;
      switch (conv) {
        case 'd': case 'i': case 'u': s = String(Math.trunc(this.toNum(a, line))); if (flags.indexOf('+') >= 0 && +s >= 0) s = '+' + s; break;
        case 'x': s = (Math.trunc(this.toNum(a, line)) >>> 0).toString(16); break;
        case 'X': s = (Math.trunc(this.toNum(a, line)) >>> 0).toString(16).toUpperCase(); break;
        case 'f': case 'F': s = this.toNum(a, line).toFixed(prec === undefined ? 6 : +prec); break;
        case 'e': case 'E': s = this.toNum(a, line).toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, 'e$10$2'); break;
        case 'g': case 'G': s = fmtG(this.toNum(a, line), prec === undefined ? 6 : +prec); break;
        case 'c': s = a.t === 'char' ? String.fromCharCode(a.v) : String.fromCharCode(this.toNum(a, line)); break;
        case 's': s = this.strOf(a, line); if (prec !== undefined) s = s.slice(0, +prec); break;
        default: s = String(a.v);
      }
      if (width && s.length < +width) {
        if (flags.indexOf('-') >= 0) s = s.padEnd(+width, ' ');
        else if (flags.indexOf('0') >= 0 && conv !== 's' && conv !== 'c') { const neg = /^[+-]/.test(s) ? s[0] : ''; s = neg + s.slice(neg.length).padStart(+width - neg.length, '0'); }
        else s = s.padStart(+width, ' ');
      }
      return s;
    });
    this.write(out, line);
    return mkI(out.length);
  }
}

/* ======================= ПУБЛИЧНОЕ API ======================= */
function run(src, input, opts) {
  let interp = null;
  const res = { ok: true, out: '', err: null, code: 0, steps: 0 };
  try {
    const prog = parse(src);
    interp = new Interp(prog, input, opts);
    res.code = interp.run();
  } catch (e) {
    if (e instanceof ExitSignal) res.code = e.code;
    else if (e instanceof CppError) res.err = { kind: e.kind, msg: e.message, line: e.line };
    else if (e instanceof RangeError && /call stack/i.test(e.message)) res.err = { kind: 'runtime', msg: 'Переполнение стека: слишком глубокая рекурсия', line: 0 };
    else res.err = { kind: 'runtime', msg: 'Внутренняя ошибка интерпретатора: ' + (e && e.message), line: 0 };
  }
  if (interp) { res.out = interp.out; res.steps = interp.steps; }
  if (res.err) { res.ok = false; if (res.err.kind === 'compile') res.out = ''; }
  return res;
}
function norm(s) {
  return String(s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}
function check(src, tests) {
  const results = []; let passed = 0, compileErr = null;
  let stop = false;
  for (const t of tests) {
    if (stop) { results.push({ ok: false, skipped: true, input: t.in || '', expected: t.out, got: '', err: null }); continue; }
    const r = run(src, t.in || '');
    const ok = !r.err && norm(r.out) === norm(t.out);
    if (ok) passed++;
    if (r.err && r.err.kind === 'compile' && !compileErr) compileErr = r.err;
    if (r.err && (r.err.kind === 'compile' || /долго/.test(r.err.msg))) stop = true;
    results.push({ ok, input: t.in || '', expected: t.out, got: r.out, err: r.err });
  }
  return { passed, total: tests.length, results, compileErr };
}

root.CppInterp = { run, check, norm, parse, CppError };
if (typeof module !== 'undefined' && module.exports) module.exports = root.CppInterp;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
