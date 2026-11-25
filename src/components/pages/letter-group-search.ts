const aliasesByGroup = {
  rain: ["ا א ألف אלף", "ب ב باء בא", "ت ת تاء תא", "ث ת׳ ثاء ת׳א", "ك ک כ ך كاف כאף", "ل ל لام לאם"],
  wheel: ["م מ ם ميم מים", "و ו واو ואו", "ه ة ה هاء הא", "ف פ ף فاء פא", "ق ק قاف קאף"],
  soup: ["ن נ ן نون נון", "س ס سين סין", "ش ש شין شين"],
  slide: ["ر ר راء רא", "ز ז زاي زاء זאי", "د ד دال דאל", "ذ ד׳ ذال ד׳אל"],
  butterfly: ["ج ג ג׳ جيم ג׳ים", "ح ח حاء חא", "خ ח׳ خاء ח׳א", "ع ע عين עין", "غ ע׳ غين ע׳ין", "ي ی י ياء יא"],
  egg: ["ص צ ץ صاد צאד", "ض דֿ ضاد דאד", "ط ט طاء טא", "ظ ט׳ ظاء ט׳א"],
} as const;

function normalizeLetter(value: string) {
  return value.normalize("NFKD")
    .replace(/דֿ/g, "ض")
    .replace(/[\p{M}\p{Join_Control}\p{Bidi_Control}ـ]/gu, "")
    .replace(/['’‘`]/g, "׳")
    .trim()
    .replace(/^(?:אות|حرف)\s+/u, "");
}

const letterByAlias = new Map(
  Object.entries(aliasesByGroup).flatMap(([group, letters]) =>
    letters.flatMap((aliases) => {
      const names = aliases.split(" ");
      const letter = names[0];
      const name = names.find((alias) => /^\p{Script=Arabic}{2,}$/u.test(alias))!;
      const result = { letter, name, group };
      return [...names, `ال${name}`].map((alias) => [normalizeLetter(alias), result] as const);
    })),
);

export function findLetter(value: string) {
  return letterByAlias.get(normalizeLetter(value));
}

export function findLetters(value: string) {
  const query = normalizeLetter(value);
  const exact = letterByAlias.get(query);
  if (exact) return [exact];

  return (query.match(/\p{L}׳?/gu) ?? []).flatMap((character) => {
    const letter = letterByAlias.get(character);
    return letter ? [letter] : [];
  });
}

export function findLetterGroup(value: string) {
  return findLetter(value)?.group;
}
