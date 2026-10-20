/** Índice da fase correspondente à distância percorrida. */
export function phaseIndexAt(meters, phases) {
    let i = 0;
    while (i < phases.length - 1 && meters >= phases[i].until) i++;
    return i;
}

export default class PhaseManager {
    constructor(phases, onChange) {
        this.phases = phases;
        this.onChange = onChange;
        this.index = 0;
    }

    get current() {
        return this.phases[this.index];
    }

    update(meters) {
        const next = phaseIndexAt(meters, this.phases);
        if (next === this.index) return;
        const previous = this.current;
        this.index = next;
        this.onChange?.(this.current, previous);
    }
}
