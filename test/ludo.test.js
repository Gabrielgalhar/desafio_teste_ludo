import test from 'node:test';
import assert from 'node:assert/strict';
import { Ludo } from '../src/ludo.js';

function executarTurno(jogo, jogador, dado, peca = 0) {
  const legais = jogo.lancarDado(jogador, dado);
  if (legais.length) jogo.mover(jogador, peca);
}
function ate55() {
  const j = new Ludo();
  executarTurno(j,0,6); executarTurno(j,0,5); executarTurno(j,1,1);
  for (let n=0;n<10;n++) { executarTurno(j,0,5); executarTurno(j,1,1); }
  return j;
}

test('CT01 - partida inicia com quatro pecas na base para cada jogador', () => {
  assert.deepEqual(new Ludo().estado, { pecas:[[-1,-1,-1,-1],[-1,-1,-1,-1]], vez:0, dado:null, vencedor:null });
});
test('CT02 - seis libera uma peca e mantém o jogador na vez', () => {
  const j = new Ludo();
  assert.deepEqual(j.lancarDado(0,5), []);
  assert.equal(j.estado.vez,1);
  executarTurno(j,1,6);
  assert.equal(j.estado.pecas[1][0],0);
  assert.equal(j.estado.vez,1);
});
test('CT03 - valores invalidos e jogador incorreto preservam o estado', () => {
  const j = new Ludo(), antes=j.estado;
  for(const valor of [0,7,1.5,NaN]) assert.throws(()=>j.lancarDado(0,valor),RangeError);
  assert.throws(()=>j.lancarDado(1,6));
  assert.deepEqual(j.estado,antes);
});
test('CT04 - movimento exige dado e um novo lancamento nao pode ser feito na mesma vez', () => {
  const j = new Ludo();
  assert.throws(()=>j.mover(0,0));
  j.lancarDado(0,6);
  assert.throws(()=>j.lancarDado(0,1));
  assert.throws(()=>j.mover(1,0));
  assert.throws(()=>j.mover(0,4),RangeError);
});
test('CT05 - movimento normal avanca e entrega a vez ao adversario', () => {
  const j = new Ludo(); executarTurno(j,0,6); executarTurno(j,0,4);
  assert.equal(j.estado.pecas[0][0],4);
  assert.equal(j.estado.vez,1);
});
test('CT06 - tres seis consecutivos encerram a vez sem movimento', () => {
  const j = new Ludo(); executarTurno(j,0,6); executarTurno(j,0,6);
  const antes=j.estado.pecas;
  assert.deepEqual(j.lancarDado(0,6),[]);
  assert.deepEqual(j.estado.pecas,antes);
  assert.equal(j.estado.vez,1);
});
test('CT07 - barreira de duas pecas bloqueia a terceira peca', () => {
  const j = new Ludo(); executarTurno(j,0,6,0); executarTurno(j,0,6,1);
  j.lancarDado(0,6); executarTurno(j,1,1);
  assert.deepEqual(j.lancarDado(0,6),[0,1]);
  assert.throws(()=>j.mover(0,2),RangeError);
  assert.deepEqual(j.estado.pecas[0],[0,0,-1,-1]);
});
test('CT08 - peca adversaria e capturada fora das casas seguras', () => {
  const j = new Ludo();
  executarTurno(j,0,6); executarTurno(j,0,6); executarTurno(j,0,5);
  executarTurno(j,1,6); executarTurno(j,1,1);
  for(let n=0;n<3;n++) { executarTurno(j,0,5); executarTurno(j,1,1); }
  assert.equal(j.estado.pecas[1][0],4);
  executarTurno(j,0,4);
  assert.equal(j.estado.pecas[0][0],30);
  assert.equal(j.estado.pecas[1][0],-1);
});
test('CT09 - casas seguras permitem pecas de cores diferentes', () => {
  const j = new Ludo();
  executarTurno(j,0,6); executarTurno(j,0,6); executarTurno(j,0,5);
  executarTurno(j,1,6); executarTurno(j,1,1);
  for(let n=0;n<3;n++) { executarTurno(j,0,5); executarTurno(j,1,4); }
  // Adversario na casa segura global 39 (posicao relativa 13).
  executarTurno(j,0,5); executarTurno(j,1,6,1); executarTurno(j,1,1,1);
  executarTurno(j,0,5); executarTurno(j,1,1,1); executarTurno(j,0,3);
  assert.equal(j.estado.pecas[0][0],39);
  assert.equal(j.estado.pecas[1][0],13);
});
test('CT10 - chegada exige o valor exato para alcancar 57', () => {
  const j=ate55();
  assert.equal(j.estado.pecas[0][0],55);
  assert.deepEqual(j.lancarDado(0,3),[]);
  assert.equal(j.estado.pecas[0][0],55);
  executarTurno(j,1,1); executarTurno(j,0,2);
  assert.equal(j.estado.pecas[0][0],57);
});
test('CT11 - estado exposto nao altera o estado interno', () => {
  const j=new Ludo(); const copia=j.estado; copia.pecas[0][0]=57;
  assert.equal(j.estado.pecas[0][0],-1);
});
test('CT12 - quatro pecas em 57 definem o vencedor e encerram a partida', () => {
  const j=new Ludo();
  for(let p=0;p<4;p++) {
    executarTurno(j,0,6,p); executarTurno(j,0,5,p); executarTurno(j,1,1);
    for(let n=0;n<10;n++) { executarTurno(j,0,5,p); executarTurno(j,1,1); }
    executarTurno(j,0,2,p);
    if(p<3) executarTurno(j,1,1);
  }
  assert.equal(j.estado.vencedor,0);
  assert.deepEqual(j.estado.pecas[0],[57,57,57,57]);
  assert.throws(()=>j.lancarDado(j.estado.vez,6));
  assert.throws(()=>j.mover(j.estado.vez,0));
});
