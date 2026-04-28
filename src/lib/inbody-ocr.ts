export interface ParsedInbody {
  weightKg: number | null;
  skeletalMuscleKg: number | null;
  bodyFatKg: number | null;
  bodyFatPct: number | null;
  bmi: number | null;
  score: number | null;
}

export interface OcrParseResult {
  parsed: ParsedInbody;
  matchedFields: number;
  totalFields: number;
}

interface FieldDef {
  key: keyof ParsedInbody;
  patterns: RegExp[];
  integer?: boolean;
  range?: [number, number];
}

const FIELDS: FieldDef[] = [
  {
    key: 'weightKg',
    patterns: [
      /(?:체중|weight|wt\.?)\s*[:=]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:kg|㎏|키로|킬로)/i,
      /(\d{1,3}(?:\.\d{1,2})?)\s*(?:kg|㎏)\s*(?:체중|weight)/i,
    ],
    range: [20, 200],
  },
  {
    key: 'skeletalMuscleKg',
    patterns: [
      /(?:골격근량|골격근|smm|skeletal\s*muscle(?:\s*mass)?)\s*[:=]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:kg|㎏)?/i,
    ],
    range: [10, 80],
  },
  {
    key: 'bodyFatKg',
    patterns: [
      /(?:체지방량|bfm|body\s*fat\s*mass)\s*[:=]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:kg|㎏)?/i,
    ],
    range: [1, 100],
  },
  {
    key: 'bodyFatPct',
    patterns: [
      /(?:체지방률|체지방\s*률|pbf|percent\s*body\s*fat|body\s*fat\s*%?)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*%/i,
      /(?:체지방률|pbf)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)/i,
    ],
    range: [3, 60],
  },
  {
    key: 'bmi',
    patterns: [/(?:bmi|체질량\s*지수|body\s*mass\s*index)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)/i],
    range: [10, 50],
  },
  {
    key: 'score',
    patterns: [
      /(?:인바디\s*점수|inbody\s*score|점수|score)\s*[:=]?\s*(\d{1,3})/i,
    ],
    integer: true,
    range: [30, 100],
  },
];

function tryField(text: string, field: FieldDef): number | null {
  for (const re of field.patterns) {
    const m = text.match(re);
    if (!m || !m[1]) continue;
    const v = field.integer ? parseInt(m[1], 10) : parseFloat(m[1]);
    if (isNaN(v)) continue;
    if (field.range && (v < field.range[0] || v > field.range[1])) continue;
    return v;
  }
  return null;
}

export function parseInbodyText(rawText: string): OcrParseResult {
  const text = rawText.replace(/\s+/g, ' ');
  const parsed: ParsedInbody = {
    weightKg: null,
    skeletalMuscleKg: null,
    bodyFatKg: null,
    bodyFatPct: null,
    bmi: null,
    score: null,
  };
  let matched = 0;
  for (const f of FIELDS) {
    const v = tryField(text, f);
    if (v !== null) {
      (parsed[f.key] as number | null) = v;
      matched += 1;
    }
  }
  return { parsed, matchedFields: matched, totalFields: FIELDS.length };
}

export const FIELD_KEYS: Array<keyof ParsedInbody> = [
  'weightKg',
  'skeletalMuscleKg',
  'bodyFatKg',
  'bodyFatPct',
  'bmi',
  'score',
];
