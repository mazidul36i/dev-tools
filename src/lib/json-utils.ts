export function formatJSON(jsonData: string | object, indent: number | string = 2): string {
  const jsonObj = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  const indentValue = indent === 'tab' ? '\t' : Number(indent);
  return JSON.stringify(jsonObj, null, indentValue);
}

export function minifyJSON(jsonString: string): string {
  return JSON.stringify(JSON.parse(jsonString));
}

export function stringifyJSON(jsonString: string): string {
  return JSON.stringify(JSON.stringify(JSON.parse(jsonString)));
}

export function parseStringifiedJSON(stringifiedJson: string): string {
  const jsonString = JSON.parse(stringifiedJson);
  return JSON.stringify(JSON.parse(jsonString), null, 2);
}

// DTO Parsing

export function parseDtoString(input: string, autoDetect: boolean = true, stripClass: boolean = true): Record<string, unknown> {
  input = input.trim();
  const dtoMatch = input.match(/^([A-Za-z_$][\w.$]*)?\((.+)\)$/s);
  if (!dtoMatch) {
    throw new Error('Invalid DTO format. Expected: ClassName(key=value, ...) or (key=value, ...)');
  }
  const className = dtoMatch[1] || null;
  const content = dtoMatch[2];
  const parsed = parseDtoContent(content, autoDetect);
  if (!stripClass && className) return { [className]: parsed };
  return parsed;
}

function parseDtoContent(content: string, autoDetect: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;
  const len = content.length;

  while (i < len) {
    while (i < len && /[\s]/.test(content[i])) i++;
    if (i >= len) break;

    let keyStart = i;
    while (i < len && content[i] !== '=') i++;
    if (i >= len) break;
    const key = content.substring(keyStart, i).trim();
    i++;

    const { value, nextIndex } = readDtoValue(content, i, autoDetect);
    result[key] = value;
    i = nextIndex;
    while (i < len && /[,\s]/.test(content[i])) i++;
  }
  return result;
}

interface DtoReadResult {
  value: unknown;
  nextIndex: number;
}

function readDtoValue(content: string, start: number, autoDetect: boolean): DtoReadResult {
  let i = start;
  const len = content.length;
  while (i < len && content[i] === ' ') i++;
  if (i >= len) return { value: null, nextIndex: i };

  const remaining = content.substring(i);
  const nestedDtoMatch = remaining.match(/^([A-Za-z_$][\w.$]*)\(/);
  if (nestedDtoMatch) {
    const classNameLen = nestedDtoMatch[1].length;
    let parenStart = i + classNameLen;
    let depth = 0, j = parenStart;
    while (j < len) {
      if (content[j] === '(') depth++;
      else if (content[j] === ')') { depth--; if (depth === 0) break; }
      j++;
    }
    if (depth !== 0) throw new Error('Unmatched parentheses in nested DTO');
    const nestedContent = content.substring(parenStart + 1, j);
    return { value: parseDtoContent(nestedContent, autoDetect), nextIndex: j + 1 };
  }

  if (content[i] === '[') {
    let depth = 0, j = i;
    while (j < len) {
      if (content[j] === '[') depth++;
      else if (content[j] === ']') { depth--; if (depth === 0) break; }
      j++;
    }
    const arrContent = content.substring(i + 1, j).trim();
    const arrValues = arrContent === ''
      ? []
      : splitTopLevel(arrContent).map(v => coerceValue(v.trim(), autoDetect));
    return { value: arrValues, nextIndex: j + 1 };
  }

  let valueStr = '';
  let depth = 0;
  while (i < len) {
    const ch = content[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && ch === ',') break;
    if (depth < 0) break;
    valueStr += ch;
    i++;
  }
  return { value: coerceValue(valueStr.trim(), autoDetect), nextIndex: i };
}

function splitTopLevel(str: string): string[] {
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && ch === ',') { parts.push(current); current = ''; }
    else current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function coerceValue(val: string, autoDetect: boolean): unknown {
  if (!autoDetect) return val;
  if (val === 'null') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}
