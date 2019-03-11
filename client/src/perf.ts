declare var perfPoints: [string, string, number][];

export function perf(name: string, flow: string = "default"): void {
    perfPoints.push([name, flow, performance.now()]);
}
