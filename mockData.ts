
import { Militar, Bairro } from './types';

// Simulando dados que viriam da Planilha Google
export const MILITARES: Militar[] = [
  { numeroPM: '123456', pg: '3º SGT', nomeGuerra: 'SILVA' },
  { numeroPM: '654321', pg: 'CB PM', nomeGuerra: 'SANTOS' },
  { numeroPM: '111222', pg: 'SD PM', nomeGuerra: 'OLIVEIRA' },
  { numeroPM: '333444', pg: '1º TEN', nomeGuerra: 'RODRIGUES' },
];

export const BAIRROS: Bairro[] = [
  { nome: 'ELDORADO', oficialSetor: 'TEN COSTA', telefoneComandante: '5531988887777', setor: 'SETOR 01' },
  { nome: 'INDUSTRIAL', oficialSetor: 'TEN MARTINS', telefoneComandante: '5531999998888', setor: 'SETOR 02' },
  { nome: 'NOVO ELDORADO', oficialSetor: 'TEN COSTA', telefoneComandante: '5531988887777', setor: 'SETOR 01' },
  { nome: 'RIACHO', oficialSetor: 'TEN ALMEIDA', telefoneComandante: '5531977776666', setor: 'SETOR 03' },
  { nome: 'AMAZONAS', oficialSetor: 'TEN ALMEIDA', telefoneComandante: '5531977776666', setor: 'SETOR 03' },
];
