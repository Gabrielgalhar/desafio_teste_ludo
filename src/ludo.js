const CASAS_SEGURAS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export class Ludo {
  #pecas = [Array(4).fill(-1), Array(4).fill(-1)];
  #vez = 0;
  #dado = null;
  #seisConsecutivos = 0;
  #vencedor = null;

  #posicaoGlobal(jogador, posicao) {
    return (posicao + jogador * 26) % 52;
  }

  #quantidadesNaCasa(casa) {
    return this.#pecas.map((pecas, jogador) =>
      pecas.filter(
        posicao =>
          posicao >= 0 &&
          posicao < 52 &&
          this.#posicaoGlobal(jogador, posicao) === casa
      ).length
    );
  }

  #movimentoPermitido(jogador, indice) {
    const posicao = this.#pecas[jogador][indice];
    const destino = posicao === -1 ? 0 : posicao + this.#dado;

    if (
      posicao === 57 ||
      (posicao === -1 && this.#dado !== 6) ||
      destino > 57
    ) {
      return false;
    }

    for (
      let passo = posicao === -1 ? 0 : posicao + 1;
      passo <= Math.min(destino, 51);
      passo++
    ) {
      const ocupacao = this.#quantidadesNaCasa(
        this.#posicaoGlobal(jogador, passo)
      );

      if (ocupacao.some(quantidade => quantidade >= 2)) {
        return false;
      }
    }

    return true;
  }

  lancarDado(jogador, valor) {
    if (this.#vencedor !== null) {
      throw new Error('Partida encerrada');
    }

    if (jogador !== this.#vez || this.#dado !== null) {
      throw new Error('Nao pode lancar agora');
    }

    if (!Number.isInteger(valor) || valor < 1 || valor > 6) {
      throw new RangeError('Dado invalido');
    }

    this.#dado = valor;
    this.#seisConsecutivos = valor === 6 ? this.#seisConsecutivos + 1 : 0;

    if (this.#seisConsecutivos === 3) {
      this.#proximoJogador();
      return [];
    }

    const movimentos = this.jogaveis;

    if (movimentos.length === 0) {
      this.#proximoJogador();
    }

    return movimentos;
  }

  #proximoJogador() {
    this.#vez = 1 - this.#vez;
    this.#dado = null;
    this.#seisConsecutivos = 0;
  }

  mover(jogador, indice) {
    if (this.#vencedor !== null) {
      throw new Error('Partida encerrada');
    }

    if (jogador !== this.#vez || this.#dado === null) {
      throw new Error('Nao pode mover agora');
    }

    if (
      !Number.isInteger(indice) ||
      indice < 0 ||
      indice > 3 ||
      !this.#movimentoPermitido(jogador, indice)
    ) {
      throw new RangeError('Movimento invalido');
    }

    const posicaoAtual = this.#pecas[jogador][indice];
    const destino = posicaoAtual === -1 ? 0 : posicaoAtual + this.#dado;

    if (destino < 52) {
      const casaGlobal = this.#posicaoGlobal(jogador, destino);

      if (!CASAS_SEGURAS.has(casaGlobal)) {
        const adversario = 1 - jogador;

        this.#pecas[adversario] = this.#pecas[adversario].map(posicao =>
          posicao >= 0 &&
          posicao < 52 &&
          this.#posicaoGlobal(adversario, posicao) === casaGlobal
            ? -1
            : posicao
        );
      }
    }

    this.#pecas[jogador][indice] = destino;

    if (this.#pecas[jogador].every(posicao => posicao === 57)) {
      this.#vencedor = jogador;
    }

    const ganhouOutraJogada = this.#dado === 6;
    this.#dado = null;

    if (!ganhouOutraJogada) {
      this.#proximoJogador();
    }
  }

  get jogaveis() {
    if (this.#dado === null) {
      return [];
    }

    return [0, 1, 2, 3].filter(indice =>
      this.#movimentoPermitido(this.#vez, indice)
    );
  }

  get estado() {
    return {
      pecas: this.#pecas.map(pecas => [...pecas]),
      vez: this.#vez,
      dado: this.#dado,
      vencedor: this.#vencedor
    };
  }
}
