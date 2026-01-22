
export interface Militar {
  numeroPM: string;
  pg: string;
  nomeGuerra: string;
}

export interface Bairro {
  nome: string;
  oficialSetor: string;
  telefoneComandante: string;
  setor: string;
}

export interface OcorrenciaForm {
  equipe: Militar[];
  viaturas: string[];
  endereco: string;
  numero: string;
  bairro: Bairro | null;
  cidade: string;
  historico: string;
  produtividade: string;
  foto?: string; // Armazenado como base64
}

export interface AppData {
  militares: Militar[];
  bairros: Bairro[];
  loading: boolean;
  error: string | null;
}
