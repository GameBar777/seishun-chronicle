// デート会話データ（テキストのみ・未ボイス）。1件に複数行を入れるときは「\n」で区切る
export type Q4 = [string, [string, number], [string, number], [string, number]];
export type DateTalk = {
  /** 待ち合わせの第一声［段階0:他人〜顔見知り, 1:友人〜親友, 2:気になる〜夢中］ */
  greet: [string[], string[], string[]];
  /** スポットごと：[段階0の到着時, 段階1, 段階2, デート途中のひとこま] */
  spot: Record<string, [string, string, string, string]>;
  /** 返答への反応［とても良い, 良い, 普通, 悪い］ */
  react: [string[], string[], string[], string[]];
  /** 別れ際［失敗, まあまあ, 楽しかった, 最高］ */
  end: [string[], string[], string[], string[]];
  season: Record<'春' | '夏' | '秋' | '冬', string[]>;
  rain: string[];
  /** 同じ場所に再訪したとき（{L}=場所名） */
  again: string[];
  /** 過去のイベントを見ていれば出る思い出話 */
  cb: Record<string, string>;
  /** 3年生のデートで */
  y3: string[];
  /** 親しくなってから（段階1以上）出る質問 */
  qs: Q4[];
};
