// argMax via https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
export function argMax(array: number[]) {
  return array
    .map((x: number, i: number) => [x, i])
    .reduce((r: number[], a: number[]) => (a[0] > r[0] ? a : r))[1];
}

export function zipArrays(a: string[], b: number[]) {
  return a.map((e: string, i: number) => [e, b[i]]);
}
