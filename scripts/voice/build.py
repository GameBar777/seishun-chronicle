#!/usr/bin/env python3
"""生成済み音声の QC と Web 用エンコード。
python3 scripts/voice/build.py            -> qc.tsv / public/voice/<slug>/<id>.mp3 / public/voice/manifest.json
QC: 長さ・無音・クリップ・F0（基本周波数）を測り、異常を flags 列に記録。flagged.txt に再生成候補を出す。"""
import json, os, subprocess, sys, numpy as np
from multiprocessing import Pool
ROOT = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))
CACHE = '/workspace/voice-cache'; OUT = os.path.join(REPO, 'public', 'voice')
SLUG = {'hinata':'hinata','mio':'mio','yura':'yura','kaho':'kaho','reika':'reika','kotoha':'kotoha','ruka':'ruka','rin':'rin','shizuku':'shizuku','@芽衣':'mei','@健太':'kenta','@担任・真鍋':'manabe','@田中':'tanaka'}
import re
WORD = re.compile(r'[ぁ-ゖァ-ヺ一-龯々A-Za-z0-9]')
SEX = {k:'f' for k in SLUG}; SEX['@健太']='m'; SEX['@担任・真鍋']='m'; SEX['@田中']='m'
def analyze(l):
    import librosa
    if not WORD.search(l['say']): return None  # 「……」など記号だけの台詞は無音（収録しない）
    src = f"{CACHE}/{l['id']}.mp3"
    if not os.path.exists(src) or os.path.getsize(src) < 2000: return None
    dst_dir = os.path.join(OUT, SLUG[l['who']]); os.makedirs(dst_dir, exist_ok=True); dst = os.path.join(dst_dir, l['id'] + '.mp3')
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',src,'-ac','1','-ar','16000','-f','f32le','-'], capture_output=True).stdout
    y = np.frombuffer(raw, dtype=np.float32)
    dur = len(y)/16000; peak = float(np.abs(y).max()) if len(y) else 0
    clip = int((np.abs(y) > 0.995).sum()) if len(y) else 0
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=320)[0] if len(y) > 1024 else np.array([0.0])
    act = rms > max(0.01, rms.max()*0.08); speech = act.sum()*320/16000
    f0 = 0.0
    if len(y) > 2048:
        f = librosa.yin(y, fmin=70, fmax=650, sr=16000, frame_length=1024, hop_length=320)
        n = min(len(f), len(act)); v = f[:n][act[:n]]
        if len(v): f0 = float(np.median(v))
    chars = len(l['say'])
    flags = []
    if speech < 0.3 or peak < 0.02: flags.append('silent')
    if clip > 50: flags.append('clipped')
    if dur > chars*0.33 + 4: flags.append('too_long')
    if dur < chars*0.045: flags.append('too_short')
    if f0:
        if SEX[l['who']] == 'f' and f0 < 160: flags.append('gender?')
        if SEX[l['who']] == 'm' and f0 > 260: flags.append('gender?')
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',src,'-af','silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse',
                        '-ac','1','-ar','24000','-b:a','48k','-map_metadata','-1',dst], check=True)
    return dict(id=l['id'], who=l['who'], dur=round(dur,2), speech=round(speech,2), f0=round(f0), peak=round(peak,3), clip=clip, chars=chars, size=os.path.getsize(dst), flags=','.join(flags))
if __name__ == '__main__':
    L = json.load(open(os.path.join(ROOT, 'lines.json')))
    with Pool(os.cpu_count() or 4) as p: R = [r for r in p.map(analyze, L, chunksize=8) if r]
    # 話者ごとの F0 中央値から大きく外れたもの（声が別人化）も記録
    from statistics import median
    med = {w: median([r['f0'] for r in R if r['who']==w and r['f0']] or [0]) for w in SLUG}
    for r in R:
        m = med[r['who']]
        if r['f0'] and m and abs(r['f0']-m)/m > 0.6 and 'gender?' not in r['flags']: r['flags'] = (r['flags']+',f0_outlier').strip(',')
    with open(os.path.join(ROOT,'qc.tsv'),'w') as f:
        f.write('id\twho\tdur\tspeech\tf0\tpeak\tclip\tchars\tbytes\tflags\n')
        for r in R: f.write('\t'.join(str(r[k]) for k in ['id','who','dur','speech','f0','peak','clip','chars','size','flags'])+'\n')
    ids = sorted(r['id'] for r in R)
    json.dump({'v':1,'ids':ids}, open(os.path.join(OUT,'manifest.json'),'w'), separators=(',',':'))
    fl = [r for r in R if r['flags']]
    open(os.path.join(ROOT,'flagged.txt'),'w').write('\n'.join(f"{r['id']}\t{r['who']}\t{r['flags']}" for r in fl))
    print(json.dumps({'files':len(R),'flagged':len(fl),'bytes':sum(r['size'] for r in R),'f0_median':med}, ensure_ascii=False))
