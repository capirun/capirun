const PREFIX = 'capirun:';

// localStorage pode lançar exceção (modo privado, bloqueado etc.): o jogo segue sem persistir.
function read(key, fallback) {
    try {
        const value = window.localStorage.getItem(PREFIX + key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function write(key, value) {
    try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // armazenamento indisponível
    }
}

const Storage = {
    getBest: () => read('best', 0),
    setBest: (score) => write('best', score),
    isMuted: () => read('muted', false),
    setMuted: (muted) => write('muted', muted),
};

export default Storage;
