#!/usr/bin/env python3
"""抜き取り確認：ローカルの Whisper（faster-whisper small）で書き起こし、台本との一致率（ひらがな化した LCS）を出す。
/workspace/.venv-stt/bin/python scripts/voice/spotcheck.py id,id,...  -> scripts/voice/spotcheck.tsv
音声認識は漢字の表記ゆれがあるので、一致率は目安。低いものだけ耳で確認する想定。"""
import json, os, re, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
ROOT = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))
SLUG = {'@芽衣': 'mei', '@健太': 'kenta', '@担任・真鍋': 'manabe'}
L = {l['id']: l for l in json.load(open(os.path.join(ROOT, 'lines.json')))}
def norm(s): return re.sub(r'[^ぁ-ゖァ-ヺ一-龯々a-zA-Z0-9]', '', re.sub(r'（[^）]*）', '', s))
def hira(s): return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)
def lcs(a, b):
    d = [0] * (len(b) + 1)
    for x in a:
        p = 0
        for j in range(1, len(b) + 1): t = d[j]; d[j] = p + 1 if x == b[j-1] else max(d[j], d[j-1]); p = t
    return d[-1]
m = WhisperModel('small', device='cpu', compute_type='int8')
rows = []
for i in sys.argv[1].split(','):
    l = L[i]; f = os.path.join(REPO, 'public', 'voice', SLUG.get(l['who'], l['who']), i + '.mp3')
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
    segs, _ = m.transcribe(pcm, language='ja', beam_size=3, vad_filter=False)
    t = ''.join(s.text for s in segs); a, b = hira(norm(l['say'])), hira(norm(t))
    sc = 2 * lcs(a, b) / (len(a) + len(b)) if a and b else (1.0 if not a else 0.0)
    rows.append((i, l['who'], round(sc, 2), l['say'], t.strip()))
with open(os.path.join(ROOT, 'spotcheck.tsv'), 'w') as o:
    o.write('id\twho\tscore\tscript\theard\n')
    for r in rows: o.write('\t'.join(map(str, r)) + '\n')
s = [r[2] for r in rows]; print(len(rows), 'median', sorted(s)[len(s)//2], 'low(<0.5)', sum(x < 0.5 for x in s))
