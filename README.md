# CapiRun 🦫

Corre capivara! **Jogue em <https://capirun.github.io/capirun/>**

Endless runner de capivara feito com [Phaser 3](https://phaser.io) (3.88). Corra pelo campo, atravesse o rio
desviando de jacarés e sobreviva à noite no Pantanal.

## Como rodar

O jogo usa ES modules, então precisa de um servidor HTTP (abrir o `index.html` direto não funciona):

```sh
python -m http.server 8080      # ou: npm start
```

Abra <http://localhost:8080>. Com `?debug` na URL (`http://localhost:8080/?debug`), as hitboxes aparecem e o
jogo fica acessível em `window.game` no console.

## Controles

| Ação | Teclado | Toque |
|---|---|---|
| Pular (segure para pular mais alto) | Espaço, ↑, W | metade direita da tela |
| Agachar / cair mais rápido no ar | ↓, S | metade esquerda da tela |
| Pausar | P, Esc | botão ⏸ |

## Fases

| Fase | Distância | Obstáculos |
|---|---|---|
| Campo | 0–300 m | pedras, pedras duplas, pássaros |
| Rio | 300–800 m | jacarés, jacarés filhotes, pássaros (a capivara nada) |
| Noite no Pantanal | 800 m+ | tudo misturado |

Pontuação = metros percorridos + 10 por capim coletado. O recorde fica salvo no navegador.

## Estrutura

```
index.html              carrega phaser.min.js + src/main.js (module)
src/
  main.js               config do Phaser e ordem das cenas
  config/               constantes, fases e tipos de obstáculo (dados, sem Phaser)
  scenes/               Preload → Menu → Game (+ Hud e GameOver em paralelo)
  entities/             Player (máquina de estados) e Obstacle (pool)
  systems/              Spawner, Difficulty, PhaseManager, Input, Audio, Storage
  ui/                   botões
tests/                  testes de lógica pura (node:test)
```

### Adicionando uma fase

1. Coloque os assets em `assets/` e carregue em `src/scenes/PreloadScene.js`.
2. Se houver obstáculo novo, descreva-o em `src/config/obstacles.js` (textura, tamanho do frame, hitbox).
3. Adicione a fase em `src/config/phases.js`.
4. Rode `npm test`: o teste de justiça garante que todo padrão novo é pulável ou passável agachado.

## Testes

```sh
npm test
```

Cobrem a curva de dificuldade, as transições de fase, o spawner (vão mínimo entre obstáculos) e a
"justiça" de cada padrão de obstáculos. Não há dependências para instalar.

## Pendências conhecidas

- `placeholder_*.png` ainda são arte provisória; pássaro e capim são desenhados em código.
- `assets/two_steps_from_hell.ogg` provavelmente tem direitos autorais: troque por música livre antes de publicar.
- As músicas estão só em `.ogg` (~7 MB). Para Safari antigo e um carregamento mais leve, gere versões `.mp3`
  comprimidas e passe as duas em `this.load.audio(key, [ogg, mp3])`.
