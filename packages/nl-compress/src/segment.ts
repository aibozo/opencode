export interface Segment { text: string; start: number; end: number; kind: "line" | "code" | "stack" | "para" }

export function segment(text: string): Segment[] {
  const ls = text.split(/\r?\n/)
  const segs: Segment[] = []
  let i = 0
  while (i < ls.length) {
    if (/^\s*```/.test(ls[i])) {
      const a = i
      i++
      while (i < ls.length && !/^\s*```/.test(ls[i])) i++
      const b = Math.min(i, ls.length - 1)
      segs.push({ text: ls.slice(a, b + 1).join("\n"), start: a, end: b, kind: "code" })
      i++
      continue
    }
    if (/(^Traceback|^\s*at\s|File ".*", line \d+)/.test(ls[i])) {
      const a = i
      let b = i
      while (b + 1 < ls.length && /(^\s+at\s|^\s*File ".*", line \d+|^\s+.*Error|^\s*Traceback|^\s*Caused by:)/.test(ls[b + 1])) b++
      segs.push({ text: ls.slice(a, b + 1).join("\n"), start: a, end: b, kind: "stack" })
      i = b + 1
      continue
    }
    const a = i
    while (i + 1 < ls.length && ls[i + 1].trim() !== "") i++
    const b = i
    const blk = ls.slice(a, b + 1)
    if (blk.length) {
      if (blk.length <= 3) {
        const t = blk.join("\n").trim()
        if (t) segs.push({ text: t, start: a, end: b, kind: "para" })
      } else {
        let k = 0
        while (k < blk.length) {
          const sub = blk.slice(k, k + 3)
          const t = sub.join("\n").trim()
          if (t) segs.push({ text: t, start: a + k, end: Math.min(a + k + 2, b), kind: "para" })
          k += 3
        }
      }
    }
    i++
    while (i < ls.length && ls[i].trim() === "") i++
  }
  return segs
}
